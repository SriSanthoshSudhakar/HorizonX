import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List, Optional
from .connection import get_db_cursor

class AppUserRepository:
    """
    Dedicated repository for the `app_user` table in PostgreSQL:
      - user_id : integer (PK)
      - full_name : varchar
      - role : varchar
      - batch_id : varchar
      - face_image_path : text
      - face_embedding : bytea
      - registration_status : varchar
      - created_at : timestamptz
    """

    @staticmethod
    def get_next_user_id() -> int:
        """
        Calculates the next available user_id if sequence is not present.
        """
        try:
            with get_db_cursor() as cur:
                cur.execute("SELECT COALESCE(MAX(user_id), 0) + 1 AS next_id FROM app_user;")
                res = cur.fetchone()
                return int(res["next_id"]) if res else 1
        except Exception:
            return 1

    @staticmethod
    def save_user(
        full_name: str,
        role: str,
        batch_id: str,
        face_image_path: Optional[str] = None,
        face_embedding: Optional[bytes] = None,
        user_id: Optional[int] = None,
        status: str = "Active"
    ) -> Dict[str, Any]:
        """
        Inserts or updates a user in the `app_user` PostgreSQL table.
        Returns the stored user row.
        """
        binary_embedding = psycopg2.Binary(face_embedding) if face_embedding is not None else None

        with get_db_cursor(commit=True) as cur:
            # Check if user already exists with this ID or full_name
            existing = None
            if user_id is not None:
                cur.execute("SELECT * FROM app_user WHERE user_id = %s;", (user_id,))
                existing = cur.fetchone()
            if not existing:
                cur.execute("SELECT * FROM app_user WHERE LOWER(full_name) = LOWER(%s);", (full_name.strip(),))
                existing = cur.fetchone()

            if existing:
                target_id = existing["user_id"]
                cur.execute("""
                    UPDATE app_user
                    SET full_name = %s,
                        role = %s,
                        batch_id = %s,
                        face_image_path = COALESCE(%s, face_image_path),
                        face_embedding = COALESCE(%s, face_embedding),
                        registration_status = %s
                    WHERE user_id = %s
                    RETURNING user_id, full_name, role, batch_id, face_image_path, registration_status, created_at;
                """, (
                    full_name.strip(),
                    role.strip(),
                    batch_id.strip(),
                    face_image_path,
                    binary_embedding,
                    status,
                    target_id
                ))
                updated = cur.fetchone()
                return dict(updated) if updated else dict(existing)
            else:
                if user_id is not None:
                    cur.execute("""
                        INSERT INTO app_user (
                            user_id,
                            full_name,
                            role,
                            batch_id,
                            face_image_path,
                            face_embedding,
                            registration_status,
                            created_at
                        )
                        OVERRIDING SYSTEM VALUE
                        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                        RETURNING user_id, full_name, role, batch_id, face_image_path, registration_status, created_at;
                    """, (
                        user_id,
                        full_name.strip(),
                        role.strip(),
                        batch_id.strip(),
                        face_image_path,
                        binary_embedding,
                        status
                    ))
                else:
                    cur.execute("""
                        INSERT INTO app_user (
                            full_name,
                            role,
                            batch_id,
                            face_image_path,
                            face_embedding,
                            registration_status,
                            created_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, NOW())
                        RETURNING user_id, full_name, role, batch_id, face_image_path, registration_status, created_at;
                    """, (
                        full_name.strip(),
                        role.strip(),
                        batch_id.strip(),
                        face_image_path,
                        binary_embedding,
                        status
                    ))
                inserted = cur.fetchone()
                return dict(inserted)

    @staticmethod
    def get_all_users() -> List[Dict[str, Any]]:
        """
        Fetches all registered crew users from PostgreSQL app_user table.
        """
        try:
            with get_db_cursor() as cur:
                cur.execute("""
                    SELECT user_id, full_name, role, batch_id, face_image_path, registration_status, created_at
                    FROM app_user
                    ORDER BY user_id ASC;
                """)
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            print(f"[AppUserRepository] Error fetching users from PostgreSQL: {e}")
            return []

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetches single user by user_id from PostgreSQL.
        """
        try:
            with get_db_cursor() as cur:
                cur.execute("""
                    SELECT user_id, full_name, role, batch_id, face_image_path, face_embedding, registration_status, created_at
                    FROM app_user
                    WHERE user_id = %s;
                """, (user_id,))
                res = cur.fetchone()
                return dict(res) if res else None
        except Exception as e:
            print(f"[AppUserRepository] Error fetching user {user_id}: {e}")
            return None

    @staticmethod
    def get_user_embeddings() -> Dict[int, bytes]:
        """
        Returns all stored face_embedding bytes mapped by user_id for model training.
        """
        try:
            with get_db_cursor() as cur:
                cur.execute("SELECT user_id, face_embedding FROM app_user WHERE face_embedding IS NOT NULL;")
                rows = cur.fetchall()
                return {int(r["user_id"]): bytes(r["face_embedding"]) for r in rows if r["face_embedding"]}
        except Exception as e:
            print(f"[AppUserRepository] Error fetching embeddings: {e}")
            return {}

    @staticmethod
    def delete_all_users() -> bool:
        """
        Clears all records from app_user table.
        """
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("DELETE FROM app_user;")
            print("[AppUserRepository] Cleared all records from app_user.")
            return True
        except Exception as e:
            print(f"[AppUserRepository] Error deleting users from PostgreSQL: {e}")
            return False

user_repo = AppUserRepository()
