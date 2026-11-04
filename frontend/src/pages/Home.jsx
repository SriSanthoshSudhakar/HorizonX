import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Activity, 
  Cpu, 
  ArrowRight, 
  Compass, 
  Sparkles,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Ensure video plays continuously
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    let ctx = gsap.context(() => {
      // Fade-up stagger for interactive cards
      gsap.utils.toArray('.reveal-up').forEach((elem) => {
        gsap.fromTo(elem,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: elem,
              start: 'top 88%',
              once: true
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const corePillars = [
    {
      id: "01",
      title: "Atmospheric Sensor Fusion",
      category: "Telemetry Ingestion",
      summary: "128-channel array capturing volatile chemical vectors with sub-second spectral precision.",
      metrics: "100Hz Bus • 6 Gas Classes",
      icon: Activity,
      color: "from-blue-600 to-cyan-500",
      bgLight: "bg-blue-50/70 border-blue-200"
    },
    {
      id: "02",
      title: "Autonomous Hazard Pinpointing",
      category: "Spatial Localization",
      summary: "Instantly correlates multi-point gas concentration gradients to exact physical bulkheads.",
      metrics: "< 12ms Edge Latency",
      icon: Compass,
      color: "from-emerald-600 to-teal-500",
      bgLight: "bg-emerald-50/70 border-emerald-200"
    },
    {
      id: "03",
      title: "Hermetic Bulkhead Lockdown",
      category: "Life-Support Actuation",
      summary: "Autonomous pneumatic hatch interlock seals off compromised zones without crew latency.",
      metrics: "14.7 PSI Sealed • Dual Relays",
      icon: Lock,
      color: "from-rose-600 to-pink-500",
      bgLight: "bg-rose-50/70 border-rose-200"
    },
    {
      id: "04",
      title: "Distributed Anomaly Analytics",
      category: "Big Data Processing",
      summary: "PySpark & D3 interactive analytics pipelines delivering deep insight across 13,900+ flight samples.",
      metrics: "Spark SQL • TimescaleDB",
      icon: Cpu,
      color: "from-indigo-600 to-purple-500",
      bgLight: "bg-indigo-50/70 border-indigo-200"
    }
  ];

  const showcaseItems = [
    {
      title: "HAERIS Cylinder Module",
      tag: "3D CAD Prototype",
      desc: "Anodized titanium outer hull with integrated pneumatic isolation valves and multi-gas chamber arrays.",
      link: "/prototype",
      action: "Explore 3D Digital Twin",
      stat: "110 Meshes • 14.7 PSI"
    },
    {
      title: "D3 Sensor Chromatography",
      tag: "Interactive Analytics",
      desc: "Live multi-channel gas scatter distributions, correlation heatmaps, and hazard cutoff thresholds.",
      link: "/analytics",
      action: "View Live Charts",
      stat: "13,910 Samples Analyzed"
    },
    {
      title: "Recent Spaceflight Gas Leaks",
      tag: "Recent Incidents",
      desc: "Documented real-world spacecraft gas leaks across ISS, Crew Dragon, Artemis II, and Starliner in the past 2 years before HorizonX launch.",
      link: "/incidents",
      action: "Explore Incident Log",
      stat: "4 Historical Events (2024–2026)"
    }
  ];

  return (
    <div ref={containerRef} className="w-full bg-white text-gray-900 font-sans overflow-hidden">
      
      {/* 1. FULL-WIDTH HERO SECTION (FULL SCREEN, FULL RATIO - NO BUTTONS/ARROWS) */}
      <section 
        className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center select-none"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      >
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline 
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          className="w-full h-full object-cover pointer-events-none select-none"
        >
          <source src="/landing-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Transparent Click Shield to block browser video context menu */}
        <div 
          className="absolute inset-0 z-10 select-none" 
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }} 
        />
      </section>

      {/* 2. CREATIVE INTRO: MISSION OVERVIEW PILLARS (Inspired by reference's highlight blocks) */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
        
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 reveal-up">
            <span className="text-xs uppercase tracking-[0.28em] text-blue-600 font-semibold font-mono block mb-3">
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-normal text-gray-900 tracking-tight leading-tight">
              Engineering the next generation of spacecraft life-support safety
            </h2>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg font-light mt-4 leading-relaxed">
              HorizonX integrates edge chemical chromatography, pneumatic bulkhead actuators, and interactive D3 telemetry to eliminate human response delay during catastrophic hull leaks.
            </p>
          </div>

          {/* 4 Interactive Feature Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {corePillars.map((pillar, idx) => {
              const IconComponent = pillar.icon;
              return (
                <div 
                  key={idx}
                  className={`reveal-up rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between ${pillar.bgLight} group cursor-default`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-gray-900 transition-colors">
                        {pillar.id}
                      </span>
                      <div className="p-2.5 rounded-xl bg-white shadow-xs border border-gray-100 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5 text-gray-900" />
                      </div>
                    </div>
                    
                    <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-500 block mb-1">
                      {pillar.category}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-gray-600 font-light leading-relaxed">
                      {pillar.summary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 3. SHOWCASE GALLERY / MISSION CAPABILITIES (Inspired by reference's curated showcase) */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-slate-50/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 reveal-up gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-gray-400 font-semibold font-mono block mb-2">
                Mission Modules
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal text-gray-900 tracking-tight">
                Integrated Defense System
              </h2>
            </div>
            <p className="text-xs md:text-sm text-gray-500 max-w-md font-light">
              Explore the digital twin prototype, real-time D3 analytics suite, and recent spacecraft gas leak chronicles.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {showcaseItems.map((item, idx) => (
              <div 
                key={idx}
                className="reveal-up bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {item.tag}
                    </span>
                    <Sparkles className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs md:text-sm text-gray-600 font-light leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-gray-400 mb-4 pb-3 border-b border-gray-100">
                    {item.stat}
                  </div>

                  <Link 
                    to={item.link}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-900 hover:text-blue-600 transition-colors group-hover:translate-x-1 duration-200"
                  >
                    <span>{item.action}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. FLIGHT STATISTICS BANNER (Inspired by reference's Profile & Stats row) */}
      <section className="py-16 md:py-20 px-4 sm:px-6 md:px-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            
            <div className="reveal-up p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 block font-mono">
                13.9K+
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-gray-500 font-semibold font-mono mt-2 block">
                Telemetry Datapoints
              </span>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-light mt-1">Multi-batch gas sensor vectors</p>
            </div>

            <div className="reveal-up p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-blue-600 block font-mono">
                12 ms
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-gray-500 font-semibold font-mono mt-2 block">
                Edge Anomaly Latency
              </span>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-light mt-1">FreeRTOS embedded loop cycle</p>
            </div>

            <div className="reveal-up p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-emerald-600 block font-mono">
                99.9%
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-gray-500 font-semibold font-mono mt-2 block">
                Airtight Seal Integrity
              </span>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-light mt-1">Double pneumatic bulkhead redundancy</p>
            </div>

            <div className="reveal-up p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-purple-600 block font-mono">
                6 Classes
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-gray-500 font-semibold font-mono mt-2 block">
                Chemical Volatiles
              </span>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-light mt-1">Sub-PPM accuracy classification</p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. MINIMAL SPACECRAFT FOOTER */}
      <footer className="bg-white py-8 md:py-12 border-t border-gray-100 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <Link to="/" className="flex items-center hover:opacity-80 transition select-none">
            <img 
              src="/horizonx (1).svg" 
              alt="HorizonX" 
              className="h-8 sm:h-9 md:h-10 w-auto object-contain mix-blend-multiply pointer-events-none select-none" 
              draggable={false}
            />
          </Link>

          <p className="text-xs text-gray-500 font-mono font-medium text-center">
            HorizonX.©2026
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-500 font-medium">
            <Link to="/prototype" className="hover:text-black transition">Prototype</Link>
            <Link to="/analytics" className="hover:text-black transition">Analytics</Link>
            <Link to="/incidents" className="hover:text-black transition">Incidents</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
