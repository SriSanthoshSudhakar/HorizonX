import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sun, Moon, Play, Pause, X, Info, Shield, Cpu, Activity, Zap } from 'lucide-react';

// Function to map 3D mesh names to human-readable part info
const getPartInfo = (meshName) => {
  const name = meshName || '';
  const upper = name.toUpperCase();

  if (upper.includes('GAS_SENSOR') || upper.includes('GAS')) {
    return {
      title: 'Multi-Gas Sensor Array Module',
      badge: 'Chemical Detection',
      icon: Activity,
      description: 'Chemiresistive micro-sensor cluster capable of classifying hazardous gases (Ammonia, Acetone, Ethylene, Ethanol, Toluene, Acetaldehyde) with sub-PPM accuracy.',
      role: 'Continuously measures atmospheric volatile concentration levels in spacecraft modules and triggers rapid safety containment when thresholds are exceeded.'
    };
  }

  if (upper.includes('PRESSURE') || upper.includes('CAPTURE_PRESSURE')) {
    return {
      title: 'Differential Pressure Transducer',
      badge: 'Pneumatics & Life Support',
      icon: Shield,
      description: 'High-precision piezoresistive pressure cell engineered to register minute atmospheric decompression and compartment barometric changes.',
      role: 'Monitors 14.7 PSI baseline cabin integrity and immediately detects airlock depressurization or micro-meteorite hull punctures.'
    };
  }

  if (upper.includes('TEMPERATURE')) {
    return {
      title: 'Precision Thermal Sensor Unit',
      badge: 'Thermal Management',
      icon: Zap,
      description: 'Infrared & solid-state temperature detector calibrated across cryogenic space exposure (-150°C to +150°C).',
      role: 'Provides real-time thermal gradient monitoring to prevent electrical overheats, thruster backwash damage, and localized module fires.'
    };
  }

  if (upper.includes('CAMERA') || upper.includes('LENS')) {
    return {
      title: 'Optical Spacecraft Diagnostic Camera',
      badge: 'Optical Telemetry',
      icon: Activity,
      description: 'Ultra-wide angle inspection lens protected by radiation-hardened quartz glass with integrated micro-spectral imaging.',
      role: 'Delivers high-resolution visual feedback into the crew cabin and mission control to inspect hatch seals, particulate smoke, and structural damage.'
    };
  }

  if (upper.includes('PUMP') || upper.includes('TUBE') || upper.includes('CAPTURE')) {
    return {
      title: 'Atmospheric Scrubber & Pneumatic Pump Loop',
      badge: 'Life Support Hardware',
      icon: Shield,
      description: 'Brushless vacuum-rated diaphragm pump integrated with intake filtration tubes and airtight micro-valves.',
      role: 'Draws ambient air samples across the detection chambers and recirculates purified oxygen-nitrogen mix while purging dangerous chemical volatiles.'
    };
  }

  if (upper.includes('PCB') || upper.includes('CONTROLLER') || upper.includes('IC')) {
    return {
      title: 'Embedded Avionics Main Controller Board',
      badge: 'Edge Computing',
      icon: Cpu,
      description: 'Radiation-tolerant dual-core ARM Cortex/ESP32 computing module executing FreeRTOS real-time signal processing and Kalman filtering.',
      role: 'Processes raw 128-channel sensor streams at 100Hz, executes anomaly scoring algorithms, and autonomously triggers bulkhead hatch lockdowns.'
    };
  }

  if (upper.includes('DISPLAY') || upper.includes('LCD')) {
    return {
      title: 'HUD Compartment Status Display',
      badge: 'Crew Interface',
      icon: Info,
      description: 'High-contrast sunlight-readable digital status matrix protected under scratch-resistant toughened glass.',
      role: 'Displays instant localized PPM readings, life support status, hatch lock indicators, and evacuation warnings to onboard astronauts.'
    };
  }

  if (upper.includes('PORT') || upper.includes('POWER') || upper.includes('PIN')) {
    return {
      title: 'Industrial Avionics Bus & Power Interface',
      badge: 'Power & Data Bus',
      icon: Zap,
      description: 'Hermetically sealed mil-spec multi-pin connector supporting redundant CAN bus, I2C, SPI, and 28V DC spacecraft power distribution.',
      role: 'Ensures uninterrupted dual-redundant power delivery and telemetry streaming between the module and central mission control computers.'
    };
  }

  if (upper.includes('BATTERY')) {
    return {
      title: 'Internal Emergency Battery Pack',
      badge: 'Failsafe Power',
      icon: Zap,
      description: 'Space-rated Lithium Iron Phosphate (LiFePO4) backup cell bank with integrated thermal runaway protection.',
      role: 'Supplies up to 72 hours of uninterrupted emergency power to sensors and hatch actuators in case of spacecraft main bus blackout.'
    };
  }

  if (upper.includes('GRILLE') || upper.includes('FRONT')) {
    return {
      title: 'Front Intake Grille & Particle Filter',
      badge: 'Intake Filtration',
      icon: Shield,
      description: 'Aero-grade aluminum intake assembly fitted with HEPA and activated carbon filtration stages.',
      role: 'Allows continuous atmospheric airflow into internal detection chambers while blocking cosmic dust, debris, and condensation.'
    };
  }

  if (upper.includes('BODY') || upper.includes('HOUSING') || upper.includes('RING') || upper.includes('RIM')) {
    return {
      title: 'Pressurized Cylindrical Titanium-Alloy Hull',
      badge: 'Structural Enclosure',
      icon: Shield,
      description: 'Precision CNC-machined aerospace grade 6061-T6 aluminum and titanium outer sleeve treated with anodized ceramic thermal barrier.',
      role: 'Protects sensitive internal avionics against space radiation, micro-meteoroid collisions, and deep-vacuum pressure differentials.'
    };
  }

  return {
    title: meshName.replace(/_/g, ' ') || 'Spacecraft Subsystem Component',
    badge: 'Hardware Component',
    icon: Info,
    description: 'Precision-engineered subsystem component of the HAERIS cylinder spacecraft safety module.',
    role: 'Acts as an essential structural or electromechanical element contributing to autonomous hazard containment and spacecraft integrity.'
  };
};

const Prototype = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const ambientLightRef = useRef(null);
  const modelRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredMeshRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [studioMode, setStudioMode] = useState('light'); // 'light' | 'dark'
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf8fafc);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.maxDistance = 30;
    controls.minDistance = 0.5;

    // 5. Lighting Setup (Clean studio aesthetic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 10, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 1.4);
    fillLight.position.set(-6, -4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(0, 8, -8);
    scene.add(rimLight);

    // 6. Load GLB Model
    const loader = new GLTFLoader();
    loader.load(
      '/HAERIS_Detailed_Cylinder_Model.glb',
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Auto-center and fit model into view
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center model at origin
        model.position.sub(center);

        // Adjust camera distance according to model bounding box
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        cameraZ = Math.max(cameraZ, 2.5);

        camera.position.set(cameraZ * 0.75, cameraZ * 0.35, cameraZ);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);

        // Enhance material settings & cache original material
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
              child.userData.originalEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0, 0, 0);
              child.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 1;
            }
          }
        });

        scene.add(model);
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (error) => {
        console.error('Error loading GLB:', error);
        setLoadError('Failed to load 3D Model file.');
        setLoading(false);
      }
    );

    // 7. Raycasting & Click Handler (Part Inspection)
    let pointerDownPos = { x: 0, y: 0 };
    const handlePointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
      // Ignore if user was dragging/panning
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 5) return;

      if (!modelRef.current || !cameraRef.current) return;

      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(modelRef.current.children, true);

      if (intersects.length > 0) {
        // Find first valid mesh
        const hit = intersects.find(i => i.object.isMesh);
        if (hit && hit.object) {
          const mesh = hit.object;
          const info = getPartInfo(mesh.name);

          // Stop rotation on click as requested
          setAutoRotate(false);
          if (controlsRef.current) {
            controlsRef.current.autoRotate = false;
          }

          // Highlight mesh
          if (hoveredMeshRef.current && hoveredMeshRef.current.material && hoveredMeshRef.current.material.emissive) {
            hoveredMeshRef.current.material.emissive.copy(hoveredMeshRef.current.userData.originalEmissive);
            hoveredMeshRef.current.material.emissiveIntensity = hoveredMeshRef.current.userData.originalEmissiveIntensity;
          }

          if (mesh.material && mesh.material.emissive) {
            mesh.material.emissive.set(0x38bdf8); // Cyan highlight
            mesh.material.emissiveIntensity = 0.5;
            hoveredMeshRef.current = mesh;
          }

          setSelectedPart({
            meshName: mesh.name,
            ...info
          });
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);

    // 8. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update background and lighting when studioMode changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(studioMode === 'light' ? 0xf8fafc : 0x05080f);
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = studioMode === 'light' ? 1.6 : 1.0;
    }
  }, [studioMode]);

  // Sync autoRotate state with controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Dismiss modal & resume rotation if desired
  const handleCloseModal = () => {
    if (hoveredMeshRef.current && hoveredMeshRef.current.material && hoveredMeshRef.current.material.emissive) {
      hoveredMeshRef.current.material.emissive.copy(hoveredMeshRef.current.userData.originalEmissive);
      hoveredMeshRef.current.material.emissiveIntensity = hoveredMeshRef.current.userData.originalEmissiveIntensity;
      hoveredMeshRef.current = null;
    }
    setSelectedPart(null);
  };

  const handleToggleRotate = () => {
    setAutoRotate(prev => !prev);
  };

  const PartIcon = selectedPart?.icon || Info;

  return (
    <div className={`w-full h-screen overflow-hidden relative ${studioMode === 'light' ? 'bg-slate-50' : 'bg-[#05080f]'}`}>
      
      {/* Floating Header Pill */}
      <div className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200 shadow-sm text-slate-800 max-w-[94vw] overflow-x-auto scrollbar-none">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider font-mono whitespace-nowrap">
          HAERIS Cylinder <span className="hidden sm:inline">• 3D CAD</span>
        </span>
        <div className="h-4 w-px bg-slate-200 shrink-0"></div>

        {/* Play/Pause Rotation Button */}
        <button
          onClick={handleToggleRotate}
          className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition shrink-0 whitespace-nowrap"
          title={autoRotate ? "Pause Turntable Rotation" : "Resume Turntable Rotation"}
        >
          {autoRotate ? (
            <>
              <Pause className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Pause Rotate</span>
              <span className="sm:hidden">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Auto Rotate</span>
              <span className="sm:hidden">Rotate</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 shrink-0"></div>

        {/* Studio mode toggle */}
        <button
          onClick={() => setStudioMode(studioMode === 'light' ? 'dark' : 'light')}
          className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition shrink-0 whitespace-nowrap"
          title="Toggle Studio Lighting"
        >
          {studioMode === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dark Space</span>
              <span className="sm:hidden">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Studio Light</span>
              <span className="sm:hidden">Light</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-slate-600 font-mono font-semibold">
            Loading 3D Prototype Geometry... ({loadProgress}%)
          </p>
        </div>
      )}

      {/* Error Message */}
      {loadError && (
        <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center p-6 text-center text-red-600">
          <p className="text-sm font-semibold uppercase tracking-wider">{loadError}</p>
        </div>
      )}

      {/* 3D Canvas Viewport */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing" 
        title="Click on any component to inspect its function"
      />

      {/* Interactive Part Inspection Drawer / Card */}
      {selectedPart && (
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-3 sm:px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-6 text-slate-900 relative max-h-[80vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition cursor-pointer"
              title="Close inspection"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <PartIcon className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-blue-600 bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                {selectedPart.badge}
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]" title={selectedPart.meshName}>
                {selectedPart.meshName}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 mb-2">
              {selectedPart.title}
            </h2>

            {/* What it is */}
            <div className="mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
                Component Architecture
              </h3>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                {selectedPart.description}
              </p>
            </div>

            {/* What it does */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Operational Mission Function
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedPart.role}
              </p>
            </div>

            {/* Footer action hint */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 mt-3">
              <span className="font-mono">Rotation Paused for Inspection</span>
              <button
                onClick={() => {
                  handleCloseModal();
                  setAutoRotate(true);
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1"
              >
                <Play className="w-3 h-3" /> Resume 3D Rotation
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Prototype;