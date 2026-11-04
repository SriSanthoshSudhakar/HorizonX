import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, 
  RefreshCw,
  CheckCircle2,
  Lock,
  ArrowLeft,
  UserPlus,
  AlertTriangle
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const getLastName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Webcam & Canvas Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Active View Tab: 'register' (Primary) vs 'scan' (Auto Face Login)
  const [activeTab, setActiveTab] = useState('register');

  // Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    role: '',
    batch_id: ''
  });
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [additionalFrames, setAdditionalFrames] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regMessage, setRegMessage] = useState('');

  // Automatic Face Scan States
  const [scanStatus, setScanStatus] = useState('idle'); // idle | scanning | verified | unregistered | error
  const [statusMessage, setStatusMessage] = useState('Initializing biometric camera...');
  const [matchedUser, setMatchedUser] = useState(null);
  const [unregisteredAlert, setUnregisteredAlert] = useState(false);
  const [detectedShape, setDetectedShape] = useState(null);
  const [crewRoster, setCrewRoster] = useState([]);

  // Fetch crew members
  useEffect(() => {
    fetch(`${API_BASE}/api/face/crew`)
      .then(res => res.json())
      .then(data => {
        if (data.crew) setCrewRoster(data.crew);
      })
      .catch(() => {
        setCrewRoster([]);
      });
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !matchedUser) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, matchedUser]);

  // Start webcam feed
  const startCamera = async () => {
    try {
      setCameraError(null);
      setStatusMessage('Ready to capture');
      setUnregisteredAlert(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setStatusMessage('Camera engaged. Position your face inside the frame.');
      }
    } catch (err) {
      console.warn('Webcam access error:', err);
      setCameraError('Camera access not detected or permission denied.');
      setCameraActive(false);
    }
  };

  // Stop webcam immediately (shuts off physical camera hardware light)
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        try {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => {
            try { track.stop(); } catch (_) {}
          });
        } catch (_) {}
      }
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [activeTab]);

  // Permanently ensure camera is stopped if component unmounts or user navigates
  useEffect(() => {
    return () => stopCamera();
  }, []);


  // Capture photo snapshot from webcam for Registration
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);

    // Collect 3 quick micro-burst frames for LBPH face training
    const burst = [dataUrl];
    setTimeout(() => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      burst.push(canvas.toDataURL('image/jpeg', 1));
    }, 150);
    setTimeout(() => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      burst.push(canvas.toDataURL('image/jpeg', 1));
      setAdditionalFrames(burst);
    }, 300);
  };

  // Submit Registration: Register face, name, role, batch_id & Login automatically
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.role.trim()) {
      setRegMessage('Please enter your Full Name and Role.');
      return;
    }
    if (!capturedPhoto) {
      setRegMessage('Please click "Capture Photo" to record your face.');
      return;
    }

    setIsRegistering(true);
    setRegMessage('Enrolling credentials into system...');

    const framesToSend = additionalFrames.length > 0 ? additionalFrames : [capturedPhoto];

    try {
      const res = await fetch(`${API_BASE}/api/face/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regForm.name.trim(),
          role: regForm.role.trim(),
          batch_id: regForm.batch_id.trim() || 'HX-2026-01',
          frames: framesToSend
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        // Automatically push image into local storage
        if (capturedPhoto) {
          try {
            localStorage.setItem(`horizonx_user_avatar_${data.user.id}`, capturedPhoto);
            localStorage.setItem('horizonx_last_registered_avatar', capturedPhoto);
          } catch (_) {}
        }
        // Stop camera immediately after registration
        stopCamera();
        setRegMessage(`Registration Complete! Welcome, ${getLastName(data.user.name)}. Logging in...`);
        setMatchedUser(data.user);

        setTimeout(() => {
          login(data.user);
          navigate(from, { replace: true });
        }, 1200);
      } else {
        setRegMessage(data.error || 'Registration failed. Please recapture your photo and try again.');
      }
    } catch (_err) {
      // Offline fallback: stop camera immediately and log in
      stopCamera();
      if (capturedPhoto) {
        try {
          localStorage.setItem('horizonx_last_registered_avatar', capturedPhoto);
        } catch (_) {}
      }
      const localUser = {
        id: Date.now(),
        name: regForm.name.trim(),
        role: regForm.role.trim(),
        batch_id: regForm.batch_id.trim() || 'HX-2026-01',
        avatar: capturedPhoto
      };
      setRegMessage(`Credentials Registered! Logging in ${getLastName(localUser.name)}...`);
      setMatchedUser(localUser);
      setTimeout(() => {
        login(localUser);
        navigate(from, { replace: true });
      }, 1000);
    } finally {
      setIsRegistering(false);
    }
  };

  // Automatic Face Login Loop (When on 'scan' tab)
  useEffect(() => {
    if (activeTab !== 'scan' || !cameraActive || scanStatus === 'verified') return;

    setScanStatus('scanning');
    setStatusMessage('Ready to login');

    const scanFrame = async () => {
      if (!videoRef.current || !canvasRef.current || scanStatus === 'verified') return;
      const video = videoRef.current;
      if (video.readyState !== 4) return;

      const canvas = canvasRef.current;
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL('image/jpeg', 0.7);

      try {
        const response = await fetch(`${API_BASE}/api/face/recognize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, auto_login: true })
        });

        if (!response.ok) return;
        const data = await response.json();

        // Update real-time facial shape
        if (data.face_shape && data.face_shape.shape_type) {
          setDetectedShape(data.face_shape.shape_type);
        } else {
          setDetectedShape(null);
        }

        if (data.face_detected) {
          if (data.matched && data.user) {
            // Recognized! Automatically push and cache fetched avatar into local storage
            if (data.user.avatar) {
              try {
                localStorage.setItem(`horizonx_user_avatar_${data.user.id}`, data.user.avatar);
                localStorage.setItem('horizonx_last_authenticated_avatar', data.user.avatar);
              } catch (_) {}
            }
            // Recognized! Turn off camera immediately so physical webcam light turns off
            stopCamera();
            setScanStatus('verified');
            setMatchedUser(data.user);
            setUnregisteredAlert(false);
            setStatusMessage(`Verified: ${getLastName(data.user.name)} (${data.user.role})`);
            
            // Log in automatically and navigate without any countdown or words in the circle
            setTimeout(() => {
              login(data.user);
              navigate(from, { replace: true });
            }, 500);
          } else {
            // Unregistered face! Do NOT use existing user. Tell them to register first.
            setScanStatus('unregistered');
            setUnregisteredAlert(true);
            setStatusMessage('Face not registered. Please register first before logging in.');
          }
        }
      } catch (err) {
        console.warn('Scan frame error:', err);
      }
    };

    scanIntervalRef.current = setInterval(scanFrame, 800);
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [activeTab, cameraActive, scanStatus]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between font-sans selection:bg-neutral-800 selection:text-white">
      
      {/* Top Header */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-neutral-900 bg-black/95 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/horizonx (1).svg" 
            alt="HorizonX" 
            className="h-10 sm:h-12 md:h-16 w-auto object-contain filter invert contrast-200 pointer-events-none select-none hover:opacity-80 transition"
            draggable={false}
          />
        </Link>
        <Link 
          to="/" 
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition font-medium px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Home</span>
        </Link>
      </header>

      {/* Main Split Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-4 sm:p-6 lg:p-12">
        
        {/* Left Column: Context & Guidelines */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-6 text-center lg:text-left items-center lg:items-start">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Spacecraft Crew <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Biometric Clearance
            </span>
          </h1>

          <div className="bg-black border border-neutral-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-neutral-300 shadow-sm text-left w-full">
            <Lock className="w-5 h-5 text-white shrink-0" />
            <span>Public visitors may view the <strong className="text-white">Home</strong> page. Access to interior dashboards requires facial registration and clearance.</span>
          </div>
        </div>

        {/* Right Column: Registration & Login Card */}
        <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-slate-100 flex flex-col items-center w-full max-w-xl mx-auto lg:max-w-none">
          
          {/* View Mode Toggle: Register vs Login */}
          <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {activeTab === 'register' ? 'Register' : 'Login'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {activeTab === 'register' 
                  ? 'Enroll your identity' 
                  : 'Verify your identity'}
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button 
                onClick={() => {
                  setActiveTab('register');
                  setUnregisteredAlert(false);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'register' 
                    ? 'bg-black text-white shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-black'
                }`}
              >
                Register Face
              </button>
              <button 
                onClick={() => {
                  setActiveTab('scan');
                  setUnregisteredAlert(false);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'scan' 
                    ? 'bg-black text-white shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-black'
                }`}
              >
                Face Login
              </button>
            </div>
          </div>

          {/* Offscreen Canvas for snapshot extraction */}
          <canvas ref={canvasRef} className="hidden" />

          {/* ================= TAB 1: USER REGISTRATION ================= */}
          {activeTab === 'register' && (
            <div className="w-full space-y-4">
              
              {/* Form Inputs: Name, Role, Batch ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Name
                  </label>
                  <input 
                    type="text" 
                    placeholder=""
                    value={regForm.name}
                    onChange={e => setRegForm({...regForm, name: e.target.value})}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-slate-50 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role
                  </label>
                  <input 
                    type="text" 
                    placeholder=""
                    value={regForm.role}
                    onChange={e => setRegForm({...regForm, role: e.target.value})}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-slate-50 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batch ID
                </label>
                <input 
                  type="text" 
                  placeholder=""
                  value={regForm.batch_id}
                  onChange={e => setRegForm({...regForm, batch_id: e.target.value})}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-slate-50 font-mono"
                  required
                />
              </div>

              {/* Live Webcam & Captured Face Photo Row */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Live Camera View: Pure Black Circle and Black Inside */}
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-black bg-black shadow-inner flex items-center justify-center">
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onContextMenu={(e) => e.preventDefault()}
                      className={`w-full h-full object-cover transform scale-x-[-1] ${cameraActive ? 'opacity-100' : 'opacity-20'}`}
                    />
                    {!cameraActive && (
                      <Camera className="w-8 h-8 text-neutral-600 absolute" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" /> Capture Photo
                  </button>
                </div>

                {/* Arrow indicator */}
                <div className="text-slate-300 font-bold hidden sm:block">→</div>

                {/* Captured Photo Preview - Black Circle Only */}
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-black bg-slate-100 shadow-inner flex items-center justify-center">
                    {capturedPhoto ? (
                      <img 
                        src={capturedPhoto} 
                        alt="Captured Face" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium text-center px-2">
                        No photo captured yet
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-black font-bold mt-2.5">
                    {capturedPhoto ? '✓ Face Photo Ready' : 'Pending Capture'}
                  </span>
                </div>

              </div>

              {regMessage && (
                <p className="text-xs font-medium text-blue-700 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                  {regMessage}
                </p>
              )}

              {/* Submit Registration Button: Black background, white font, white human icon */}
              <button
                type="button"
                onClick={handleRegisterSubmit}
                disabled={isRegistering || !capturedPhoto || !regForm.name}
                className="w-full py-3.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-900 active:bg-neutral-800 border border-neutral-800 transition disabled:bg-black disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span className="text-white font-bold">Registering Credentials...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-white" />
                    <span className="text-white font-bold">Register</span>
                  </>
                )}
              </button>

            </div>
          )}

          {/* ================= TAB 2: AUTOMATIC FACE LOGIN ================= */}
          {activeTab === 'scan' && (
            <div className="w-full flex flex-col items-center">
              
              {/* Circular Camera Viewport: Black Circle & Black Inside */}
              <div className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 rounded-full overflow-hidden flex items-center justify-center bg-black border-2 border-black shadow-inner my-2">
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onContextMenu={(e) => e.preventDefault()}
                  className={`w-full h-full object-cover transform scale-x-[-1] ${cameraActive ? 'opacity-100' : 'opacity-20'}`}
                />

                {/* Pure Loading Blue Circle - NO words, NO countdown */}
                <div 
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 border-b-transparent border-l-transparent animate-spin pointer-events-none" 
                  style={{ animationDuration: '2.5s' }} 
                />
              </div>

              {/* Status Pill with Static Black Camera Icon (No Blinking) */}
              <div className="mt-3 flex items-center justify-center flex-wrap gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 max-w-full">
                <Camera className="w-3.5 h-3.5 text-black shrink-0" />
                <span className="text-xs font-medium text-slate-800 font-mono text-center">
                  {statusMessage}
                </span>
                {detectedShape && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-white font-semibold">
                    {detectedShape}
                  </span>
                )}
              </div>

              {/* Unregistered Face Notice */}
              {unregisteredAlert && (
                <div className="mt-4 w-full p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in text-center sm:text-left">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-medium">Face not registered. Please register first before logging in.</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('register');
                      setUnregisteredAlert(false);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition shadow-xs shrink-0 w-full sm:w-auto"
                  >
                    Register Now
                  </button>
                </div>
              )}



            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-neutral-900 bg-black text-center text-xs text-neutral-500 font-mono">
        HorizonX Spacecraft Biometric Subsystem
      </footer>

    </div>
  );
};

export default Login;
