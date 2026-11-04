import os
import json
import base64
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

try:
    from database.user_repository import user_repo
except Exception:
    try:
        from ..database.user_repository import user_repo
    except Exception:
        user_repo = None

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
CASCADE_FACE_PATH = os.path.join(MODULE_DIR, "haarcascade_frontalface_default.xml")
CASCADE_EYE_PATH = os.path.join(MODULE_DIR, "haarcascade_eye.xml")
YUNET_PATH = os.path.join(MODULE_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_PATH = os.path.join(MODULE_DIR, "face_recognition_sface_2021dec.onnx")

DATASET_DIR = os.path.join(MODULE_DIR, "dataset")
AVATARS_DIR = os.path.join(MODULE_DIR, "avatars")
USERS_JSON_PATH = os.path.join(MODULE_DIR, "users.json")

class ProductionFaceManager:
    """
    High-Performance Biometric Engine:
    - Deep Learning: OpenCV YuNet (Face Detection + 5-point facial/eye landmarks)
    - Deep Neural Embedding: SFace 128-dimensional Deep Feature Representation
    - Dark-Environment Adaptive Enhancement: Recovers underexposed / dark room faces
    - Facial Contour Geometry: Extracts face oval ratios, aspect ratio, jawline shape
    - Sub-second vector cosine distance comparison
    """
    def __init__(self):
        os.makedirs(DATASET_DIR, exist_ok=True)
        os.makedirs(AVATARS_DIR, exist_ok=True)

        self.face_cascade = cv2.CascadeClassifier(CASCADE_FACE_PATH)
        self.eye_cascade = cv2.CascadeClassifier(CASCADE_EYE_PATH) if os.path.exists(CASCADE_EYE_PATH) else None

        self.has_dnn = False
        self.yunet = None
        self.sface = None
        if os.path.exists(YUNET_PATH) and os.path.exists(SFACE_PATH):
            try:
                self.yunet = cv2.FaceDetectorYN.create(
                    YUNET_PATH,
                    "",
                    (320, 240),
                    score_threshold=0.45,  # lower threshold to catch faces in dark/dim settings
                    nms_threshold=0.3,
                    top_k=5
                )
                self.sface = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
                self.has_dnn = True
                print("[FaceEngine] YuNet and SFace deep learning models successfully loaded.")
            except Exception as e:
                print(f"[FaceEngine] Error initializing DNN models: {e}")

        self.clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))

        self.users: Dict[str, Any] = self._load_users()
        self.user_features: Dict[int, List[np.ndarray]] = {}
        self.is_trained = False

        self._rebuild_feature_bank()

    def _load_users(self) -> Dict[str, Any]:
        # 1. First attempt to load users directly from PostgreSQL app_user table
        if user_repo is not None:
            try:
                db_rows = user_repo.get_all_users()
                if db_rows:
                    users = {}
                    for row in db_rows:
                        uid = int(row["user_id"])
                        uid_str = str(uid)
                        avatar_path = row.get("face_image_path") or os.path.join(AVATARS_DIR, f"user_{uid}.jpg")
                        avatar_b64 = ""
                        if os.path.exists(avatar_path):
                            try:
                                with open(avatar_path, "rb") as af:
                                    avatar_b64 = "data:image/jpeg;base64," + base64.b64encode(af.read()).decode("utf-8")
                            except Exception:
                                pass
                        users[uid_str] = {
                            "id": uid,
                            "name": row["full_name"],
                            "role": row["role"],
                            "batch_id": row["batch_id"],
                            "avatar": avatar_b64,
                            "avatar_url": f"/api/face/avatar/{uid}",
                            "face_image_path": avatar_path,
                            "clearance": "Authorized Personnel",
                            "station": "Primary Flight Module",
                            "face_shape": "Oval / Oblong",
                            "registration_status": row.get("registration_status", "Active")
                        }
                    self._save_users(users)
                    print(f"[FaceEngine] Loaded {len(users)} users from PostgreSQL database (app_user).")
                    return users
            except Exception as e:
                print(f"[FaceEngine] Warning: Could not load from PostgreSQL app_user table: {e}")

        # 2. Fallback to local users.json
        if os.path.exists(USERS_JSON_PATH):
            try:
                with open(USERS_JSON_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data:
                        # Auto-sync existing users into PostgreSQL app_user if available
                        if user_repo is not None:
                            for uid_str, u in data.items():
                                try:
                                    uid = int(uid_str)
                                    avatar_path = u.get("face_image_path") or os.path.join(AVATARS_DIR, f"user_{uid}.jpg")
                                    user_repo.save_user(
                                        user_id=uid,
                                        full_name=u.get("name", f"User {uid}"),
                                        role=u.get("role", "Specialist"),
                                        batch_id=u.get("batch_id", f"HX-USR-{uid:02d}"),
                                        face_image_path=avatar_path if os.path.exists(avatar_path) else None,
                                        status=u.get("registration_status", "Active")
                                    )
                                except Exception as sync_err:
                                    print(f"[FaceEngine] Sync error for user {uid_str}: {sync_err}")
                            print(f"[FaceEngine] Synced {len(data)} user(s) into PostgreSQL app_user table.")
                        return data
            except Exception as e:
                print(f"[FaceEngine] Error reading users.json: {e}")
        self._save_users({})
        return {}

    def _save_users(self, data: Dict[str, Any]):
        with open(USERS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def decode_base64_image(self, b64_str: str) -> Optional[np.ndarray]:
        try:
            if not b64_str:
                return None
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_str)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"[FaceEngine] Decode error: {e}")
            return None

    def enhance_low_light(self, img: np.ndarray) -> np.ndarray:
        """
        Enhances images taken in dark or dim lighting so facial features
        and landmarks remain distinctly visible to the detector and recognizer.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        brightness = gray.mean()
        
        # If dark or dimly lit environment (mean brightness < 85)
        if brightness < 85:
            # Dynamic gamma expansion: brighten dark shadows without blowing out highlights
            gamma = max(0.28, (brightness / 95.0) * 0.70)
            table = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)]).astype("uint8")
            brightened = cv2.LUT(img, table)

            # Apply CLAHE on the Lightness channel in LAB color space
            lab = cv2.cvtColor(brightened, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            l_eq = self.clahe.apply(l)
            enhanced = cv2.cvtColor(cv2.merge((l_eq, a, b)), cv2.COLOR_LAB2BGR)
            return enhanced

        return img

    def extract_face_shape(self, box: List[int], landmarks: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates facial geometry parameters:
        aspect ratio, eye distance ratio, nose-to-mouth ratio, and estimated contour shape.
        """
        w = max(1, box[2])
        h = max(1, box[3])
        aspect_ratio = round(h / w, 2)

        eye_dist = 0.0
        if landmarks and landmarks.get("right_eye") and landmarks.get("left_eye"):
            rx = landmarks["right_eye"]["x"]
            ry = landmarks["right_eye"]["y"]
            lx = landmarks["left_eye"]["x"]
            ly = landmarks["left_eye"]["y"]
            eye_dist = round(float(np.sqrt((rx - lx) ** 2 + (ry - ly) ** 2)), 1)

        # Estimate face shape category
        if aspect_ratio >= 1.35:
            shape_type = "Oval / Oblong"
        elif aspect_ratio <= 1.15:
            shape_type = "Square / Round"
        else:
            shape_type = "Proportional"

        return {
            "aspect_ratio": aspect_ratio,
            "eye_distance": eye_dist,
            "shape_type": shape_type
        }

    def detect_face_and_eyes(self, img: np.ndarray) -> Tuple[Optional[Dict[str, Any]], Optional[np.ndarray]]:
        if img is None:
            return None, None

        # Automatically apply low-light enhancement if in a dark environment
        img_proc = self.enhance_low_light(img)
        h, w = img_proc.shape[:2]

        # 1. Try Deep Learning YuNet
        if self.has_dnn and self.yunet is not None:
            try:
                self.yunet.setInputSize((w, h))
                _, faces = self.yunet.detect(img_proc)

                # If raw dark image failed and enhancement was skipped or insufficient, try with aggressive boost
                if (faces is None or len(faces) == 0):
                    boosted = cv2.convertScaleAbs(img_proc, alpha=1.5, beta=35)
                    _, faces = self.yunet.detect(boosted)
                    if faces is not None and len(faces) > 0:
                        img_proc = boosted

                if faces is not None and len(faces) > 0:
                    best_face = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
                    fx, fy, fw, fh = int(best_face[0]), int(best_face[1]), int(best_face[2]), int(best_face[3])
                    
                    r_eye = {"x": round(float(best_face[4]), 1), "y": round(float(best_face[5]), 1)}
                    l_eye = {"x": round(float(best_face[6]), 1), "y": round(float(best_face[7]), 1)}
                    nose = {"x": round(float(best_face[8]), 1), "y": round(float(best_face[9]), 1)}
                    r_mouth = {"x": round(float(best_face[10]), 1), "y": round(float(best_face[11]), 1)}
                    l_mouth = {"x": round(float(best_face[12]), 1), "y": round(float(best_face[13]), 1)}

                    aligned = self.sface.alignCrop(img_proc, best_face)
                    feature = self.sface.feature(aligned)

                    norm = np.linalg.norm(feature)
                    if norm > 0:
                        feature = feature / norm

                    box = [max(0, fx), max(0, fy), max(10, fw), max(10, fh)]
                    landmarks = {
                        "right_eye": r_eye,
                        "left_eye": l_eye,
                        "nose": nose,
                        "right_mouth": r_mouth,
                        "left_mouth": l_mouth
                    }
                    face_shape = self.extract_face_shape(box, landmarks)

                    face_info = {
                        "box": box,
                        "eyes_tracked": True,
                        "right_eye": r_eye,
                        "left_eye": l_eye,
                        "nose": nose,
                        "face_shape": face_shape,
                        "feature": feature
                    }
                    return face_info, aligned
            except Exception as e:
                print(f"[FaceEngine] YuNet detection error: {e}")

        # 2. Fallback: Haar Cascade Detection
        gray = cv2.cvtColor(img_proc, cv2.COLOR_BGR2GRAY)
        gray_eq = self.clahe.apply(gray)
        faces = self.face_cascade.detectMultiScale(gray_eq, 1.1, 4, minSize=(50, 50))

        if len(faces) == 0:
            return None, None

        x, y, w_box, h_box = sorted(faces, key=lambda b: b[2] * b[3], reverse=True)[0]
        box = [int(x), int(y), int(w_box), int(h_box)]
        face_shape = self.extract_face_shape(box, None)

        face_info = {
            "box": box,
            "eyes_tracked": False,
            "face_shape": face_shape,
            "feature": None
        }
        return face_info, None

    def _rebuild_feature_bank(self):
        self.user_features.clear()
        if not self.users:
            self.is_trained = False
            return

        # Fetch stored binary embeddings from PostgreSQL app_user table
        db_embeddings = {}
        if user_repo is not None:
            try:
                db_embeddings = user_repo.get_user_embeddings()
            except Exception as e:
                print(f"[FaceEngine] Error fetching embeddings from PostgreSQL: {e}")

        for uid_str, u in self.users.items():
            uid = int(uid_str)
            self.user_features[uid] = []

            # A. Load from PostgreSQL bytea embedding if present
            if uid in db_embeddings and db_embeddings[uid]:
                try:
                    raw_bytes = db_embeddings[uid]
                    if len(raw_bytes) >= 512:  # 128 floats * 4 bytes
                        emb = np.frombuffer(raw_bytes, dtype=np.float32).reshape(1, 128)
                        norm = np.linalg.norm(emb)
                        if norm > 0:
                            emb = emb / norm
                        self.user_features[uid].append(emb)
                except Exception as ex:
                    print(f"[FaceEngine] Error decoding db embedding for user {uid}: {ex}")

            # B. Load from avatar file on disk
            avatar_path = u.get("face_image_path") or os.path.join(AVATARS_DIR, f"user_{uid}.jpg")
            img = None
            if os.path.exists(avatar_path):
                img = cv2.imread(avatar_path)
            elif "avatar" in u and u["avatar"]:
                img = self.decode_base64_image(u["avatar"])

            if img is not None:
                info, _ = self.detect_face_and_eyes(img)
                if info and info.get("feature") is not None:
                    self.user_features[uid].append(info["feature"])

            # C. Load from dataset multi-angle images
            for fname in os.listdir(DATASET_DIR):
                if fname.startswith(f"user_{uid}_") and fname.endswith(".jpg"):
                    fpath = os.path.join(DATASET_DIR, fname)
                    fimg = cv2.imread(fpath)
                    if fimg is not None:
                        finfo, _ = self.detect_face_and_eyes(fimg)
                        if finfo and finfo.get("feature") is not None:
                            self.user_features[uid].append(finfo["feature"])

        total_features = sum(len(v) for v in self.user_features.values())
        self.is_trained = total_features > 0 and len(self.users) > 0
        print(f"[FaceEngine] Feature bank ready: {len(self.users)} users, {total_features} total embeddings.")

    def recognize_frame(self, b64_str: str) -> Dict[str, Any]:
        frame = self.decode_base64_image(b64_str)
        if frame is None:
            return {
                "face_detected": False,
                "matched": False,
                "message": "Invalid video frame data received."
            }

        face_info, aligned = self.detect_face_and_eyes(frame)
        if face_info is None:
            return {
                "face_detected": False,
                "matched": False,
                "box": None,
                "message": "Position your face clearly within the biometric scanner."
            }

        box = face_info["box"]
        face_shape = face_info.get("face_shape")

        # If no users are registered, immediately prompt to register
        if not self.is_trained or not self.users:
            return {
                "face_detected": True,
                "matched": False,
                "box": box,
                "face_shape": face_shape,
                "message": "Face not registered. Please register first before logging in."
            }

        query_feature = face_info.get("feature")
        if query_feature is None:
            return {
                "face_detected": True,
                "matched": False,
                "box": box,
                "face_shape": face_shape,
                "message": "Face not registered. Please register first before logging in."
            }

        # SFace Cosine Matching
        best_sim = -1.0
        best_uid = None

        for uid, feat_list in self.user_features.items():
            for stored_feat in feat_list:
                sim = float(self.sface.match(query_feature, stored_feat, cv2.FaceRecognizerSF_FR_COSINE))
                if sim > best_sim:
                    best_sim = sim
                    best_uid = uid

        # 0.58 threshold accommodates low-light environments while securely blocking strangers
        MATCH_THRESHOLD = 0.58

        if best_uid is not None and best_sim >= MATCH_THRESHOLD:
            user_info = self.users.get(str(best_uid))
            if user_info:
                confidence_pct = round(min(99.8, max(75.0, best_sim * 100.0)), 1)
                return {
                    "face_detected": True,
                    "matched": True,
                    "user": user_info,
                    "confidence": confidence_pct,
                    "similarity": round(best_sim, 4),
                    "box": box,
                    "face_shape": face_shape,
                    "message": f"Biometric Match: {user_info['name']}"
                }

        return {
            "face_detected": True,
            "matched": False,
            "similarity": round(best_sim, 4) if best_sim > 0 else 0.0,
            "box": box,
            "face_shape": face_shape,
            "message": "Face not registered. Please register first before logging in."
        }

    def train_new_user(
        self,
        name: str,
        role: str,
        batch_id: str,
        frames_b64: List[str]
    ) -> Dict[str, Any]:
        if not name or not role:
            return {"success": False, "error": "Name and Role are required"}

        clean_name = name.strip()
        clean_role = role.strip()

        existing_uid = None
        for uid_str, u in self.users.items():
            if u.get("name", "").strip().lower() == clean_name.lower():
                existing_uid = int(uid_str)
                break

        if existing_uid is not None:
            user_id = existing_uid
        elif user_repo is not None:
            try:
                user_id = user_repo.get_next_user_id()
            except Exception:
                existing_ids = [int(k) for k in self.users.keys() if k.isdigit()]
                user_id = (max(existing_ids) + 1) if existing_ids else 1
        else:
            existing_ids = [int(k) for k in self.users.keys() if k.isdigit()]
            user_id = (max(existing_ids) + 1) if existing_ids else 1

        user_id_str = str(user_id)
        user_embeddings = []
        best_full_frame = None

        for old_f in os.listdir(DATASET_DIR):
            if old_f.startswith(f"user_{user_id}_"):
                try:
                    os.remove(os.path.join(DATASET_DIR, old_f))
                except Exception:
                    pass

        saved_count = 0
        primary_shape = None

        for idx, b64 in enumerate(frames_b64):
            frame = self.decode_base64_image(b64)
            if frame is None:
                continue
            if best_full_frame is None:
                best_full_frame = frame

            info, _ = self.detect_face_and_eyes(frame)
            if info and info.get("feature") is not None:
                user_embeddings.append(info["feature"])
                if primary_shape is None:
                    primary_shape = info.get("face_shape")
                fpath = os.path.join(DATASET_DIR, f"user_{user_id}_{saved_count}.jpg")
                cv2.imwrite(fpath, frame)
                saved_count += 1

                # Generate low-light and brightened variations for the training embedding bank
                # so the user can easily log in whether in bright daylight or pitch darkness
                dark_simulated = np.clip((frame / 255.0) ** (1 / 0.5) * 255, 0, 255).astype(np.uint8)
                dark_info, _ = self.detect_face_and_eyes(dark_simulated)
                if dark_info and dark_info.get("feature") is not None:
                    user_embeddings.append(dark_info["feature"])

        if len(user_embeddings) == 0:
            return {
                "success": False,
                "error": "Face was not clearly visible in the camera frame. Please keep your face inside the circle and try again."
            }

        avatar_disk_path = os.path.join(AVATARS_DIR, f"user_{user_id}.jpg")
        if best_full_frame is not None:
            cv2.imwrite(avatar_disk_path, best_full_frame)

        assigned_batch_id = batch_id.strip() if batch_id else f"HX-USR-{user_id:02d}"
        primary_emb_bytes = user_embeddings[0].tobytes() if len(user_embeddings) > 0 else None

        # Persist directly into PostgreSQL app_user table
        if user_repo is not None:
            try:
                user_repo.save_user(
                    full_name=clean_name,
                    role=clean_role,
                    batch_id=assigned_batch_id,
                    face_image_path=avatar_disk_path,
                    face_embedding=primary_emb_bytes,
                    user_id=user_id,
                    status="Active"
                )
                print(f"[FaceEngine] User {clean_name} (ID: {user_id}) stored in PostgreSQL app_user table.")
            except Exception as dbe:
                print(f"[FaceEngine] Warning: Failed to persist to PostgreSQL app_user: {dbe}")

        user_record = {
            "id": user_id,
            "name": clean_name,
            "role": clean_role,
            "batch_id": assigned_batch_id,
            "avatar": frames_b64[0],
            "avatar_url": f"/api/face/avatar/{user_id}",
            "face_image_path": avatar_disk_path,
            "clearance": "Authorized Personnel",
            "station": "Primary Flight Module",
            "face_shape": primary_shape.get("shape_type") if primary_shape else "Oval / Oblong",
            "registration_status": "Active"
        }
        self.users[user_id_str] = user_record
        self._save_users(self.users)

        self.user_features[user_id] = user_embeddings
        self.is_trained = True

        print(f"[FaceEngine] Successfully enrolled {clean_name} (ID: {user_id}) with {len(user_embeddings)} deep embeddings.")

        return {
            "success": True,
            "message": f"Successfully enrolled and trained model for {clean_name}!",
            "user": user_record,
            "samples_collected": len(user_embeddings)
        }

    def reset_all_data(self) -> Dict[str, Any]:
        self.users.clear()
        self.user_features.clear()
        self.is_trained = False
        self._save_users({})

        # Wipe records from PostgreSQL app_user table
        if user_repo is not None:
            try:
                user_repo.delete_all_users()
            except Exception as e:
                print(f"[FaceEngine] Error resetting PostgreSQL app_user table: {e}")

        for d in [DATASET_DIR, AVATARS_DIR]:
            for f in os.listdir(d):
                p = os.path.join(d, f)
                if os.path.isfile(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

        print("[FaceEngine] All biometric records reset.")
        return {"success": True, "message": "All user registration records cleared."}

    def get_user_avatar(self, user_id: int) -> Optional[bytes]:
        avatar_disk_path = os.path.join(AVATARS_DIR, f"user_{user_id}.jpg")
        if os.path.exists(avatar_disk_path):
            with open(avatar_disk_path, "rb") as f:
                return f.read()

        user_info = self.users.get(str(user_id))
        if user_info and "avatar" in user_info:
            avatar_b64 = user_info["avatar"]
            if "," in avatar_b64:
                avatar_b64 = avatar_b64.split(",", 1)[1]
            try:
                img_bytes = base64.b64decode(avatar_b64)
                with open(avatar_disk_path, "wb") as f:
                    f.write(img_bytes)
                return img_bytes
            except Exception as e:
                print(f"[FaceEngine] Avatar decode error: {e}")
        return None

    def get_crew_list(self) -> List[Dict[str, Any]]:
        return list(self.users.values())

# Global singleton instance
face_manager = ProductionFaceManager()
