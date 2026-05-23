import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Bus, 
  Train, 
  Navigation, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Clock, 
  Zap, 
  ArrowRight, 
  ShieldAlert, 
  ChevronRight,
  TrendingDown,
  Sparkles,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { POI } from '../types';

interface MultiEventTransportCoordinatorProps {
  pois: POI[];
  onBroadcastAlert: (message: string, level: 'low' | 'medium' | 'high' | 'critical') => void;
  onOptimizeRoutes: (routePath: string[] | null) => void;
  onAdjustPoiCount: (poiId: string, delta: number) => void;
  activeEgressRoute: string[] | null;
}

interface VenueEvent {
  id: string;
  title: string;
  venueName: string;
  poiId: string;
  timeLabel: string;
  estimatedCrowd: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  severity: 'low' | 'medium' | 'high';
}

interface TransitAsset {
  id: string;
  name: string;
  type: 'shuttle' | 'subway' | 'rideshare' | 'ferry';
  targetPoiId: string; // which Exit the shuttle drains
  targetPoiName: string;
  status: 'normal' | 'congested' | 'optimized';
  activeFleets: number;
  limitFleets: number;
  passengerQueue: number;
  headwayMins: number;
  avgWaitMins: number;
}

export function MultiEventTransportCoordinator({
  pois,
  onBroadcastAlert,
  onOptimizeRoutes,
  onAdjustPoiCount,
  activeEgressRoute
}: MultiEventTransportCoordinatorProps) {
  // Local active tab for the coordinator panel
  const [subTab, setSubTab] = useState<'events' | 'transit'>('events');
  
  // High-stress event list
  const [events, setEvents] = useState<VenueEvent[]>([
    {
      id: 'evt-1',
      title: 'Neon Horizons Concert (Headliner Act)',
      venueName: 'Main Stage (Vanguard Dome)',
      poiId: 'poi-1',
      timeLabel: '18:30 - 20:00 (Post-event exiting imminent)',
      estimatedCrowd: 19500,
      status: 'ongoing',
      severity: 'high'
    },
    {
      id: 'evt-2',
      title: 'Sunset DJ Session',
      venueName: 'East Hydration Point',
      poiId: 'poi-4',
      timeLabel: '19:00 - 21:00 (Concurrent flow crossover)',
      estimatedCrowd: 4200,
      status: 'ongoing',
      severity: 'medium'
    },
    {
      id: 'evt-3',
      title: 'Global Food Arena Expo & Craft Beer Festival',
      venueName: 'Central Boulevard & Food Court',
      poiId: 'poi-3',
      timeLabel: '12:00 - 22:00 (Continuous baseline)',
      estimatedCrowd: 6500,
      status: 'ongoing',
      severity: 'medium'
    }
  ]);

  // Public transport assets state 
  const [phaseMode, setPhaseMode] = useState<'pre-event' | 'post-event'>('post-event');
  const [transitAssets, setTransitAssets] = useState<TransitAsset[]>([
    {
      id: 't-1',
      name: 'Vanguard Express Shuttle Link',
      type: 'shuttle',
      targetPoiId: 'poi-7', // North Emergency Egress & Exit
      targetPoiName: 'North Emergency Egress & Exit',
      status: 'congested',
      activeFleets: 8,
      limitFleets: 24,
      passengerQueue: 980,
      headwayMins: 12,
      avgWaitMins: 24
    },
    {
      id: 't-2',
      name: 'Metro Underground Line Blue',
      type: 'subway',
      targetPoiId: 'poi-6', // Main South Entrance Gate
      targetPoiName: 'Main South Entrance Gate',
      status: 'congested',
      activeFleets: 4,
      limitFleets: 12,
      passengerQueue: 1450,
      headwayMins: 9,
      avgWaitMins: 18
    },
    {
      id: 't-3',
      name: 'Ride-Share Hub Alpha Gate Terminal',
      type: 'rideshare',
      targetPoiId: 'poi-6', // Main South Entrance Gate
      targetPoiName: 'Main South Entrance Gate',
      status: 'normal',
      activeFleets: 35,
      limitFleets: 150,
      passengerQueue: 480,
      headwayMins: 4, // average intervals
      avgWaitMins: 15
    },
    {
      id: 't-4',
      name: 'Riverfront Ferry Contingency Pontoon',
      type: 'ferry',
      targetPoiId: 'poi-6', // Main South Entrance Gate
      targetPoiName: 'Main South Entrance Gate',
      status: 'normal',
      activeFleets: 2,
      limitFleets: 6,
      passengerQueue: 320,
      headwayMins: 20,
      avgWaitMins: 26
    }
  ]);

  // Operational state flags
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationScore, setOptimizationScore] = useState<number | null>(null);

  // Run Route Optimization
  const handleOptimiseOverlaps = () => {
    setIsOptimizing(true);
    setOptimizationScore(null);
    
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationScore(94);
      
      // Select best bypass sequence avoiding Central Food Court (poi-3)
      // e.g., Route: Main Stage -> East Hydration -> Main South Gate
      const optimizedPath = ['poi-1', 'poi-4', 'poi-6'];
      onOptimizeRoutes(optimizedPath);
      
      // Alert broadcast system warning
      onBroadcastAlert(
        `[COMMUNICATION OPTIMIZATION COMPLETED] Concurrent Area Event flow conflict resolved. Exit paths from Main Stage (Vanguard Dome) have been rerouted through East Hydration to bypass overcrowding at Central Food Court. Following safe vectors is advised.`, 
        'medium'
      );
    }, 2000);
  };

  const handleCustomBroadcaster = (presetMsg: string) => {
    onBroadcastAlert(`[ORGANIZER DIRECTIVE] ${presetMsg}`, 'high');
  };

  // Deploy transport on-demand
  const handleDeployTransportOnDemand = (assetId: string) => {
    setTransitAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        if (asset.activeFleets >= asset.limitFleets) return asset;
        
        // Double active vehicles or add a substantial block
        const addedFleets = asset.type === 'rideshare' ? 30 : asset.type === 'subway' ? 2 : 4;
        const nextFleets = Math.min(asset.activeFleets + addedFleets, asset.limitFleets);
        
        // Drastically cut wait time & queue size
        const queueReduction = asset.type === 'rideshare' ? 180 : asset.type === 'subway' ? 600 : 400;
        const nextQueue = Math.max(asset.passengerQueue - queueReduction, 50);
        
        const nextHeadway = Math.max(Math.floor(asset.headwayMins * 0.45), 2);
        const nextWait = Math.max(Math.floor(asset.avgWaitMins * 0.35), 4);

        // Deduce crowd counts in corresponding exit POI to make map turn green dynamically!
        onAdjustPoiCount(asset.targetPoiId, -350);

        // System broadcast
        onBroadcastAlert(
          `[ON-DEMAND TRANSIT ACTIVE] Deployed more capacity for ${asset.name}. Fleet size increased to ${nextFleets} active nodes. Average terminal wait time slashed to ${nextWait} minutes! High-frequency loop cleared.`,
          'low'
        );

        return {
          ...asset,
          activeFleets: nextFleets,
          passengerQueue: nextQueue,
          headwayMins: nextHeadway,
          avgWaitMins: nextWait,
          status: 'optimized'
        };
      }
      return asset;
    }));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" id="multi-event-transport-panel">
      
      {/* Primary Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/55 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Co-Scheduled Events & Transit Dispatch
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Handle spatial location overlaps, egress, and on-demand transit</p>
        </div>

        {/* Action Toggle Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'events'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Spatial Overlaps
          </button>
          <button
            type="button"
            onClick={() => setSubTab('transit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'transit'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            On-Demand Transit
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">

        {/* -------------------- SUB-TAB 1: MULTI EVENT SYNC & OPTIMIZE -------------------- */}
        {subTab === 'events' && (
          <div className="space-y-4">
            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block">Dynamic Bottleneck Alert: Local Overlap detected</span>
                <p className="text-[10.5px] text-slate-600 leading-relaxed mt-0.5">
                  Three overlapping events are happening in close proximity. High crowd outflow from <strong>Vanguard Stage</strong> will cross with <strong>Central Gourmet Area</strong> queues. This will trigger local choke points unless egress routes are actively split.
                </p>
              </div>
            </div>

            {/* Event Cards Row */}
            <div className="space-y-2">
              <span className="block text-[9px] font-mono text-slate-400 uppercase">Active Concurrent Shows</span>
              
              <div className="grid grid-cols-1 gap-2.5">
                {events.map((evt) => (
                  <div key={evt.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl relative overflow-hidden flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          evt.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        <span className="font-bold text-slate-800 text-[11.5px] truncate block">{evt.title}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 flex items-center gap-1">
                        <span>Venue:</span>
                        <strong className="text-slate-600 font-medium">{evt.venueName}</strong>
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">{evt.timeLabel}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold text-indigo-600 font-mono">{evt.estimatedCrowd.toLocaleString()} pax</div>
                      <span className="text-[8.5px] uppercase font-mono tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 mt-1 inline-block">
                        {evt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Routing Optimization Interface */}
            <div className="bg-indigo-50/40 border border-indigo-100/60 p-4 rounded-2.5xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Cross-Flow Route Optimizer</span>
                  <span className="text-[10px] text-slate-500">Auto-calculate alternative exits bypass matrix</span>
                </div>
                {optimizationScore && (
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded animate-bounce">
                    Throughput: +{optimizationScore}%
                  </span>
                )}
              </div>

              {isOptimizing ? (
                <div className="py-2.5 flex items-center justify-center gap-2 text-slate-500 text-xs font-mono bg-white border border-slate-100 rounded-xl">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Analyzing crowd heat maps & calculating alternate bypass vectors...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOptimiseOverlaps}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    RUN ROUTE OVERLAP OPTIMIZATION
                  </button>

                  {activeEgressRoute && (
                    <button
                      type="button"
                      onClick={() => {
                        onOptimizeRoutes(null);
                        setOptimizationScore(null);
                      }}
                      className="px-3 py-2 border border-slate-250 hover:border-slate-350 text-slate-500 rounded-xl text-xs font-semibold cursor-pointer"
                      title="Clear computed bypass route"
                    >
                      Reset Paths
                    </button>
                  )}
                </div>
              )}

              {/* Quick Communication Tooltip */}
              <div className="space-y-2">
                <span className="block text-[9.5px] font-mono text-slate-500 uppercase mt-1">Single-Click Broadcast Directives</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCustomBroadcaster("Divert Vanguard Exiting Flow: Main exit lanes are congested. Use East Canopy bypassing Gate B.")}
                    className="text-left text-[10.5px] p-2 bg-white border border-slate-150 hover:bg-slate-50 hover:border-indigo-200 transition-colors rounded-xl text-slate-600 font-medium cursor-pointer"
                  >
                    📢 Vanguard Exit Reroute
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCustomBroadcaster("DJ Set Outflow Advisory: Please exit through the Riverfront South gate to locate clear transport channels.")}
                    className="text-left text-[10.5px] p-2 bg-white border border-slate-150 hover:bg-slate-50 hover:border-indigo-200 transition-colors rounded-xl text-slate-600 font-medium cursor-pointer"
                  >
                    📢 DJ Canopy Exit Advice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- SUB-TAB 2: ON-DEMAND PUBLIC TRANSIT DISPATCHER -------------------- */}
        {subTab === 'transit' && (
          <div className="space-y-4">
            
            {/* Phase State Filter */}
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase ml-2">Transit Wave Synchronization:</span>
              <div className="flex bg-slate-200 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setPhaseMode('pre-event')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    phaseMode === 'pre-event'
                      ? 'bg-indigo-650 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pre-Event Arrivals
                </button>
                <button
                  type="button"
                  onClick={() => setPhaseMode('post-event')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    phaseMode === 'post-event'
                      ? 'bg-indigo-650 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Post-Event Surges
                </button>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              {phaseMode === 'post-event' 
                ? "POST-EVENT SYNC: Real-time attendees are surging toward exiting portals. Trigger extra on-demand high-capacity loops below. Doing so will immediately lower waiting queues and drain live gate crowding percentages."
                : "PRE-EVENT SYNC: Facilitate inbound lines before gates open to prevent entrance gate build-ups. Ensure express subways run at peak speed and transit capacity."
              }
            </p>

            {/* Transit List */}
            <div className="space-y-3">
              {transitAssets.map((asset) => {
                const isMaxCapacity = asset.activeFleets >= asset.limitFleets;
                const isOptimized = asset.status === 'optimized';
                
                return (
                  <div key={asset.id} className={`p-4 rounded-2xl border transition-all ${
                    isOptimized 
                      ? 'bg-emerald-50/50 border-emerald-300' 
                      : asset.status === 'congested'
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-slate-50/50 border-slate-150'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      
                      <div className="flex items-start gap-2.5 flex-1">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          isOptimized ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {asset.type === 'shuttle' && <Bus className="w-5 h-5" />}
                          {asset.type === 'subway' && <Train className="w-5 h-5" />}
                          {asset.type === 'rideshare' && <Users className="w-5 h-5" />}
                          {asset.type === 'ferry' && <Navigation className="w-5 h-5 rotate-45" />}
                        </div>

                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 text-[12px] leading-tight flex items-center gap-1.5 flex-wrap">
                            {asset.name}
                            
                            {isOptimized ? (
                              <span className="text-[8.5px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                Capacity Boosted
                              </span>
                            ) : asset.passengerQueue > 805 ? (
                              <span className="text-[8.5px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                Peak Load
                              </span>
                            ) : (
                              <span className="text-[8.5px] bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                Standby Stable
                              </span>
                            )}
                          </h5>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 xs:grid-cols-4 gap-x-4 gap-y-1.5 mt-2 text-[10.5px]">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase font-mono">Current Fleets</span>
                              <strong className="text-slate-700">{asset.activeFleets} / {asset.limitFleets} active</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase font-mono">Passenger Queue</span>
                              <strong className={`${asset.passengerQueue > 800 ? 'text-rose-600' : 'text-slate-700'} font-bold`}>
                                {asset.passengerQueue} waiting
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase font-mono">Loop Headway</span>
                              <strong className="text-slate-700 flex items-center gap-0.5 font-mono">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {asset.headwayMins} min
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase font-mono">Avg Wait Time</span>
                              <strong className={`flex items-center gap-0.5 font-mono ${
                                asset.avgWaitMins > 20 ? 'text-amber-600 font-bold' : 'text-slate-705'
                              }`}>
                                <TrendingDown className="w-3 h-3 text-emerald-500" />
                                {asset.avgWaitMins} mins
                              </strong>
                            </div>
                          </div>

                          <span className="block text-[9.5px] text-slate-400 mt-2">
                            *Drains crowd from: <strong>{asset.targetPoiName.split(' (')[0]}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Deploy button */}
                      <button
                        type="button"
                        disabled={isMaxCapacity || isOptimized}
                        onClick={() => handleDeployTransportOnDemand(asset.id)}
                        className={`font-extrabold uppercase text-[9px] tracking-wider py-2 px-3.5 rounded-xl transition-all shadow-xs shrink-0 ${
                          isMaxCapacity || isOptimized
                            ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-slate-900 border border-indigo-500/10 text-slate-950 hover:text-indigo-400 hover:scale-102 cursor-pointer font-bold'
                        }`}
                        title={isMaxCapacity ? "Maximum logistical deployment reached." : "Click to inject extra public transit vehicles to drain exit nodes immediately."}
                      >
                        {isOptimized ? "Deployed ✓" : isMaxCapacity ? "Max Active" : "+ DEPLOY EXTRA"}
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Informational Warning Banner */}
            <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center gap-2 text-[10.5px] text-slate-500 leading-normal">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>LOGISTICAL RULE: Deploying extra public transport results in an immediate reduction in exit-gate backup queues and lowers corresponding venue spot counts on the live simulation map.</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
