import React, { useState } from 'react';
import { 
  Search, 
  ArrowUpRight, 
  Calendar, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';

const Incidents = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 4 Documented Real-World Flight Anomalies
  const incidents = [
    {
      id: 'iss-2026',
      number: '01',
      mission: 'International Space Station (ISS)',
      date: 'June 5, 2026',
      gasType: 'Atmospheric Air',
      phase: 'Orbital Habitat Operations',
      image: '/incidents/iss.jpg',
      imageAlt: 'International Space Station in orbit',
      subsystem: 'Russian Zvezda PrK Tunnel',
      anomaly: 'Micro-fissures in the PrK transfer tunnel of the Russian Zvezda service module worsened abruptly, venting station air at an elevated rate of approximately two pounds per day.',
      response: 'NASA ordered five astronauts to shelter inside the docked SpaceX Crew Dragon spacecraft to prepare for a contingency evacuation if cabin pressure dropped further.',
      resolution: 'Russian cosmonauts patched the fissures using Germetal-1 sealant within two hours. The shelter order was safely lifted, with the tunnel remaining under active pressure monitoring.',
      primaryLink: {
        label: 'NASA Official Briefing',
        url: 'https://www.nasa.gov/blogs/spacestation/2026/06/05/nasa-provides-update-on-space-station-leak/'
      }
    },
    {
      id: 'crew13-2026',
      number: '02',
      mission: 'SpaceX Crew-13 (Dragon)',
      date: 'September 2026',
      gasType: 'Nitrogen Tetroxide (N₂O₄)',
      phase: 'Pre-Flight Pad Processing',
      image: '/incidents/dragon.jpg',
      imageAlt: 'SpaceX Crew Dragon launch profile',
      subsystem: 'Hypergolic RCS Manifold',
      anomaly: 'Ground checkout sensors identified an oxidizer vapor leak within the Dragon spacecraft reaction control propulsion system weeks prior to the scheduled launch to the ISS.',
      response: 'Flight operations postponed the launch countdown to allow propulsion engineers to de-integrate and replace the leaking propellant isolation valve assembly on the pad.',
      resolution: 'After extensive helium re-pressurization checks and sensor recertification, the propulsion system passed all flight criteria, launching successfully on September 30, 2026.',
      primaryLink: {
        label: 'SpaceX Mission Debrief',
        url: 'https://www.space.com/space-exploration/launches-spacecraft/spacex-nasa-delay-next-astronaut-launch-to-iss-due-to-leak-on-dragon-spacecraft'
      }
    },
    {
      id: 'artemis2-2026',
      number: '03',
      mission: 'NASA Artemis II (SLS Rocket)',
      date: 'February 2026',
      gasType: 'Liquid Hydrogen (LH₂)',
      phase: 'Wet Dress Rehearsal',
      image: '/incidents/artemis.jpg',
      imageAlt: 'Artemis II Space Launch System rocket on pad 39B',
      subsystem: 'Tail Service Mast Umbilical',
      anomaly: 'During a cryogenic wet dress rehearsal fueling test at Kennedy Space Center Pad 39B, super-cold liquid hydrogen leaked within the Tail Service Mast Umbilical (TSMU) cavity.',
      response: 'The automated launch control sequencer triggered an immediate abort at T-5 minutes, terminating cryogenic propellant transfer and initiating nitrogen purge purges.',
      resolution: 'Teams executed on-pad quick-disconnect repairs and optimized heat-shield ascent pressure margins, clearing the Artemis II crew to complete their historic lunar fly-around.',
      primaryLink: {
        label: 'NASA Artemis Report',
        url: 'https://www.nasa.gov/missions/artemis/nasa-identifies-cause-of-artemis-i-orion-heat-shield-char-loss/'
      }
    },
    {
      id: 'starliner-2024',
      number: '04',
      mission: 'Boeing Starliner (CFT)',
      date: 'June 2024',
      gasType: 'Helium Pressurant',
      phase: 'ISS Approach & Rendezvous',
      image: '/incidents/starliner.jpg',
      imageAlt: 'Boeing Starliner spacecraft in orbital flight',
      subsystem: 'Service Module RCS Doghouses',
      anomaly: 'En route to the space station, telemetry flagged five independent helium gas leaks within the reaction control system (RCS) manifolds used to pressurize thruster fuel lines.',
      response: 'Flight controllers isolated the affected manifold valves. While the capsule maintained thruster control, NASA elected to return the spacecraft uncrewed to minimize crew risk.',
      resolution: 'The uncrewed capsule successfully undocked and executed a flawless parachute touchdown at White Sands Space Harbor, while astronauts Williams and Wilmore returned via Crew-9.',
      primaryLink: {
        label: 'Investigation Assessment',
        url: 'https://www.space.com/boeing-starliner-helium-leaks-assessment'
      }
    }
  ];

  const filtered = incidents.filter(inc => {
    const q = searchTerm.toLowerCase();
    return inc.mission.toLowerCase().includes(q) ||
           inc.gasType.toLowerCase().includes(q) ||
           inc.subsystem.toLowerCase().includes(q) ||
           inc.anomaly.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 md:px-12 bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
        
        {/* Minimalist Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400 block mb-1">
              Mission Flight Safety Log (2024–2026)
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-tight text-slate-950">
              Spacecraft Gas Leaks
            </h1>
          </div>

          {/* Clean Search Pill */}
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search mission or gas species..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-64 transition"
            />
          </div>
        </div>

        {/* Creative Photographic Dossiers */}
        <div className="space-y-6 sm:space-y-10">
          {filtered.map((item) => (
            <article 
              key={item.id}
              className="group border border-slate-100 hover:border-slate-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 bg-white transition-all duration-300 shadow-2xs hover:shadow-sm"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
                
                {/* Real Spaceflight Photo Showcase */}
                <div className="lg:col-span-5 relative rounded-xl sm:rounded-2xl overflow-hidden aspect-16/10 sm:aspect-4/3 lg:aspect-auto min-h-[200px] sm:min-h-[260px] bg-slate-900 shadow-inner">
                  <img 
                    src={item.image} 
                    alt={item.imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                  
                  {/* Floating Micro-Badges */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md text-white border border-white/10">
                      Case #{item.number}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white pointer-events-none">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest uppercase text-slate-300 block">
                        {item.subsystem}
                      </span>
                      <span className="text-xs font-light text-white/90">
                        {item.phase}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editorial Content Column */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  
                  {/* Mission Heading & Meta */}
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {item.gasType}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.date}</span>
                      </div>
                    </div>
                    <h2 className="text-xl md:text-2xl font-normal tracking-tight text-slate-950">
                      {item.mission}
                    </h2>
                  </div>

                  {/* 3 Structured Narrative Blocks */}
                  <div className="space-y-4 text-xs md:text-sm">
                    
                    {/* The Anomaly */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-rose-600 font-semibold mb-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>The Anomaly</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-light">
                        {item.anomaly}
                      </p>
                    </div>

                    {/* The Response */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-600 font-semibold mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Mitigation Protocol</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-light">
                        {item.response}
                      </p>
                    </div>

                    {/* The Resolution */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-semibold mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Resolution & Status</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-light">
                        {item.resolution}
                      </p>
                    </div>

                  </div>

                  {/* Single Clean Authoritative Source Link */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Primary Verification
                    </span>
                    <a
                      href={item.primaryLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white text-xs font-mono transition-all duration-200 border border-slate-200 hover:border-slate-900"
                    >
                      <span>{item.primaryLink.label}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                </div>

              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Incidents;
