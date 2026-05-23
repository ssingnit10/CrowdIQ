import React, { useState, useEffect, useMemo } from 'react';
import { POI, CrowdIncident, Coordinate } from '../types';
import { MapPin, AlertTriangle, ShieldCheck, Footprints, Flame, AlertCircle, ZoomIn, ZoomOut, Eye, EyeOff, GripVertical, Ruler } from 'lucide-react';
import { motion } from 'motion/react';

interface InteractiveMapProps {
  pois: POI[];
  incidents: CrowdIncident[];
  selectedPoiId: string | null;
  onSelectPoi: (poiId: string | null) => void;
  activeEgressRoute: string[] | null; // List of POI names in the route
  greenZoneRoute?: string[] | null;
  isGreenZoneActive?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
}

export function InteractiveMap({
  pois,
  incidents,
  selectedPoiId,
  onSelectPoi,
  activeEgressRoute,
  greenZoneRoute = null,
  isGreenZoneActive = false,
}: InteractiveMapProps) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showAttendees, setShowAttendees] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [isLegendVisible, setIsLegendVisible] = useState(true);
  const [activeLegendFilter, setActiveLegendFilter] = useState<'normal' | 'congested' | 'blocked' | 'incident' | null>(null);
  const [isSafetyDrillActive, setIsSafetyDrillActive] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<Coordinate | null>(null);
  const [measureEnd, setMeasureEnd] = useState<Coordinate | null>(null);

  const measuredDistance = useMemo(() => {
    if (!measureStart || !measureEnd) return 0;
    const dx = measureEnd.x - measureStart.x;
    const dy = measureEnd.y - measureStart.y;
    const pixelDistance = Math.hypot(dx, dy);
    // Real world calibration standard: 1% coordinate equals approx. 5.5 meters
    const metersPerPercent = 5.5;
    return Math.round(pixelDistance * metersPerPercent);
  }, [measureStart, measureEnd]);

  // Click handler on map viewport
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMeasuring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    
    const clickedPoint: Coordinate = {
      x: Math.round(xPercent * 10) / 10,
      y: Math.round(yPercent * 10) / 10
    };

    if (!measureStart || (measureStart && measureEnd)) {
      setMeasureStart(clickedPoint);
      setMeasureEnd(null);
    } else {
      setMeasureEnd(clickedPoint);
    }
  };

  const safetyDrillPaths = useMemo(() => [
    { d: "M 50 25 L 50 8", stroke: "#10b981", label: "North Emergency Route" },
    { d: "M 50 65 L 50 92", stroke: "#10b981", label: "South Egress Route" },
    { d: "M 50 65 L 20 50", stroke: "#22c55e", label: "West Relief Track" },
    { d: "M 50 65 L 80 55", stroke: "#22c55e", label: "East Oasis Relief Track" },
    { d: "M 80 55 L 85 25", stroke: "#06b6d4", label: "East Oasis Evacuation Link" },
    { d: "M 15 15 L 20 50", stroke: "#06b6d4", label: "Medical Hub Link" }
  ], []);

  const filteredPois = useMemo(() => {
    if (!activeLegendFilter) return pois;
    if (activeLegendFilter === 'normal') return pois.filter((p) => p.status === 'normal');
    if (activeLegendFilter === 'congested') return pois.filter((p) => p.status === 'congested');
    if (activeLegendFilter === 'blocked') return pois.filter((p) => p.status === 'blocked');
    if (activeLegendFilter === 'incident') return [];
    return pois;
  }, [pois, activeLegendFilter]);

  const filteredIncidents = useMemo(() => {
    const active = incidents.filter(inc => inc.status !== 'resolved');
    if (!activeLegendFilter) return active;
    if (activeLegendFilter === 'incident') return active;
    return [];
  }, [incidents, activeLegendFilter]);

  // Generate simulated attendee particles moving between random coordinates
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Initialize 100 particles
    const initialParticles: Particle[] = Array.from({ length: 110 }).map((_, i) => {
      // Pick a random POI as starting point
      const randomPoi = pois[Math.floor(Math.random() * pois.length)];
      const startX = randomPoi ? randomPoi.coords.x : Math.random() * 80 + 10;
      const startY = randomPoi ? randomPoi.coords.y : Math.random() * 80 + 10;

      // Pick another POI as target point
      const targetPoi = pois[Math.floor(Math.random() * pois.length)];
      const targetX = targetPoi ? targetPoi.coords.x : Math.random() * 80 + 10;
      const targetY = targetPoi ? targetPoi.coords.y : Math.random() * 80 + 10;

      return {
        id: i,
        x: startX + (Math.random() - 0.5) * 6,
        y: startY + (Math.random() - 0.5) * 6,
        targetX: targetX + (Math.random() - 0.5) * 6,
        targetY: targetY + (Math.random() - 0.5) * 6,
        speed: 0.15 + Math.random() * 0.35,
        color: i % 3 === 0 ? 'rgba(239, 68, 68, 0.65)' : i % 3 === 1 ? 'rgba(245, 158, 11, 0.65)' : 'rgba(59, 130, 246, 0.5)',
      };
    });
    setParticles(initialParticles);
  }, []); // Run copy once

  // Dynamic frame loop to walk particles towards targets
  useEffect(() => {
    let frameId: number;

    const updateParticles = () => {
      setParticles((prevParticles) =>
        prevParticles.map((p) => {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const distance = Math.hypot(dx, dy);

          if (distance < 2) {
            // Pick a new target POI
            const randomPoi = pois[Math.floor(Math.random() * pois.length)];
            const nextTargetX = randomPoi ? randomPoi.coords.x : Math.random() * 80 + 10;
            const nextTargetY = randomPoi ? randomPoi.coords.y : Math.random() * 80 + 10;

            // Set current density color
            let color = 'rgba(59, 130, 246, 0.5)'; // normal flow blue
            if (randomPoi && randomPoi.status === 'congested') {
              color = 'rgba(247, 120, 31, 0.7)'; // orange
            } else if (randomPoi && randomPoi.status === 'blocked') {
              color = 'rgba(220, 38, 38, 0.85)'; // critical red
            }

            return {
              ...p,
              targetX: nextTargetX + (Math.random() - 0.5) * 8,
              targetY: nextTargetY + (Math.random() - 0.5) * 8,
              color,
            };
          }

          // Move step
          const moveX = (dx / distance) * p.speed;
          const moveY = (dy / distance) * p.speed;

          return {
            ...p,
            x: p.x + moveX,
            y: p.y + moveY,
          };
        })
      );

      frameId = requestAnimationFrame(updateParticles);
    };

    frameId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(frameId);
  }, [pois]);

  // Construct active routing paths based on selected egress coordinates
  const activeRouteCoords = useMemo(() => {
    if (!activeEgressRoute || activeEgressRoute.length < 2) return null;
    const points: Coordinate[] = [];
    activeEgressRoute.forEach((name) => {
      // Find POI with matching name (loose or structured match)
      const formattedName = name.toLowerCase();
      const poi = pois.find(
        (p) =>
          formattedName.includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(formattedName) ||
          formattedName.includes(p.id)
      );
      if (poi) {
        points.push(poi.coords);
      }
    });
    return points.length >= 2 ? points : null;
  }, [activeEgressRoute, pois]);

  // Construct Custom Emergency Green Zone Evacuation Route coordinate sequence
  const greenZoneCoords = useMemo(() => {
    if (!greenZoneRoute || greenZoneRoute.length < 2) return null;
    const points: Coordinate[] = [];
    greenZoneRoute.forEach((idOrName) => {
      const formatted = idOrName.toLowerCase();
      const poi = pois.find(
        (p) =>
          p.id.toLowerCase() === formatted ||
          p.name.toLowerCase().includes(formatted) ||
          formatted.includes(p.id.toLowerCase())
      );
      if (poi) {
        points.push(poi.coords);
      }
    });
    return points.length >= 2 ? points : null;
  }, [greenZoneRoute, pois]);

  return (
    <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col h-full">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-ping" />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
            Venue Operations Telemetry Map
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 rounded transition-colors ${
              showHeatmap
                ? 'bg-orange-950 text-orange-400 border border-orange-850'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Heatmap {showHeatmap ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowAttendees(!showAttendees)}
            className={`px-2.5 py-1 rounded transition-colors ${
              showAttendees
                ? 'bg-sky-950 text-sky-400 border border-sky-850'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Attendees {showAttendees ? 'ON' : 'OFF'}
          </button>
          {activeRouteCoords && (
            <div className="bg-emerald-950/80 text-emerald-400 px-2.5 py-1 rounded border border-emerald-800 animate-pulse flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5" />
              Egress Track Mode
            </div>
          )}
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 rounded-xl w-full select-none bg-slate-950 overflow-hidden border border-slate-800/80 min-h-[350px]">
        <div
          id="map-canvas-viewport"
          onClick={handleMapClick}
          className={`absolute inset-0 w-full h-full transition-transform duration-200 ease-out origin-center ${
            isMeasuring ? 'cursor-crosshair' : ''
          }`}
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Vector Background Grids & Coordinate Labels */}
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-radial-gradient-slate opacity-40 pointers-none pointer-events-none" />

        {/* Outer Perimeter Fence representations */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Static Connection Corridors between POIs */}
          <path
            d="M 20 50 Q 50 25 80 55 M 50 65 L 50 25 M 50 65 L 20 50 M 50 65 L 80 55 M 50 65 L 50 92 M 80 55 L 85 25 M 15 15 L 20 50 M 50 25 L 50 8"
            fill="none"
            stroke="rgba(148, 163, 184, 0.12)"
            strokeWidth="3"
            strokeDasharray="4,6"
          />

          {/* Active Egress Route Pathway Overlay */}
          {showRoutes && activeRouteCoords && (
            <motion.path
              d={`M ${activeRouteCoords.map((pt) => `${pt.x} ${pt.y}`).join(' L ')}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_#10b981]"
              initial={{ strokeDasharray: '8, 8', strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 4 }}
            />
          )}

          {/* Custom Emergency Green Zone Evacuation Route Pathway Overlay */}
          {isGreenZoneActive && greenZoneCoords && (
            <g key="green-zone-emergency-path">
              {/* Thick ambient outer pulsing backdrop glow */}
              <motion.path
                d={`M ${greenZoneCoords.map((pt) => `${pt.x} ${pt.y}`).join(' L ')}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-25"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              />
              {/* Dark helper frame */}
              <path
                d={`M ${greenZoneCoords.map((pt) => `${pt.x} ${pt.y}`).join(' L ')}`}
                fill="none"
                stroke="#047857"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core flow indicator neon dots */}
              <motion.path
                d={`M ${greenZoneCoords.map((pt) => `${pt.x} ${pt.y}`).join(' L ')}`}
                fill="none"
                stroke="#34d399"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_12px_#34d399]"
                initial={{ strokeDasharray: '12, 12', strokeDashoffset: 120 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 1.2 }}
              />
            </g>
          )}

          {/* Safety Drill Egress Routes Overlay */}
          {isSafetyDrillActive && safetyDrillPaths.map((path, idx) => (
            <g key={`drill-path-${idx}`}>
              {/* Outer neon glow tube/line */}
              <motion.path
                d={path.d}
                fill="none"
                stroke={path.stroke}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-25"
                initial={{ opacity: 0.15 }}
                animate={{ opacity: [0.15, 0.45, 0.15] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: idx * 0.15 }}
              />
              {/* Core pulsing/flowing line */}
              <motion.path
                d={path.d}
                fill="none"
                stroke={path.stroke}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ strokeDasharray: '6, 6', strokeDashoffset: 60 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 2 }}
              />
            </g>
          ))}

          {/* Safety Drill Target Safe Zones */}
          {isSafetyDrillActive && pois.map((poi) => {
            if (poi.status !== 'normal') return null;
            return (
              <g key={`drill-safe-zone-${poi.id}`}>
                {/* Outermost pulsing ring */}
                <motion.circle
                  cx={`${poi.coords.x}%`}
                  cy={`${poi.coords.y}%`}
                  r={22}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  className="opacity-60"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.8, 0, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                  style={{ transformOrigin: `${poi.coords.x}% ${poi.coords.y}%` }}
                />
                {/* Secondary ring */}
                <circle
                  cx={`${poi.coords.x}%`}
                  cy={`${poi.coords.y}%`}
                  r={14}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  className="animate-spin-slow"
                  style={{ transformOrigin: `${poi.coords.x}% ${poi.coords.y}%` }}
                />
              </g>
            );
          })}

          {/* Dynamic Heatmap Halos */}
          {showHeatmap &&
            filteredPois.map((poi) => {
              const density = poi.currentCount / poi.capacity;
              let isSevere = density > 1.15;
              let color = 'rgba(16, 185, 129, 0.1)'; // green/normal
              let strokeColor = 'rgba(16, 185, 129, 0.4)';

              if (density > 0.95) {
                color = 'rgba(239, 68, 68, 0.28)'; // red/severe
                strokeColor = 'rgba(239, 68, 68, 0.6)';
              } else if (density > 0.65) {
                color = 'rgba(245, 158, 11, 0.22)'; // orange/medium
                strokeColor = 'rgba(245, 158, 11, 0.5)';
              }

              return (
                <g key={`heat-${poi.id}`}>
                  <circle
                    cx={`${poi.coords.x}%`}
                    cy={`${poi.coords.y}%`}
                    r={`${18 + density * 12}`}
                    fill={color}
                    className="transition-all duration-500 ease-out"
                  />
                  <circle
                    cx={`${poi.coords.x}%`}
                    cy={`${poi.coords.y}%`}
                    r={`${18 + density * 12}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.2"
                    strokeDasharray={isSevere ? '2,3' : 'none'}
                    className={`transition-all duration-500 ease-out ${isSevere ? 'animate-spin-slow origin-center' : ''}`}
                    style={{ transformOrigin: `${poi.coords.x}% ${poi.coords.y}%` }}
                  />
                </g>
              );
            })}
        </svg>

        {/* Measure Tool Points and Connecting Line */}
        {isMeasuring && (measureStart || measureEnd) && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            {measureStart && measureEnd && (
              <>
                {/* Connection dashed line */}
                <motion.line
                  x1={`${measureStart.x}%`}
                  y1={`${measureStart.y}%`}
                  x2={`${measureEnd.x}%`}
                  y2={`${measureEnd.y}%`}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  initial={{ strokeDashoffset: 20 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                />
                {/* Glow behind line */}
                <line
                  x1={`${measureStart.x}%`}
                  y1={`${measureStart.y}%`}
                  x2={`${measureEnd.x}%`}
                  y2={`${measureEnd.y}%`}
                  stroke="#0ea5e9"
                  strokeWidth="5"
                  className="opacity-20 blur-xs"
                />
                
                {/* Visual Distance Label floating in between */}
                <g>
                  <rect
                    x={`${(measureStart.x + measureEnd.x) / 2}%`}
                    y={`${(measureStart.y + measureEnd.y) / 2}%`}
                    width="64"
                    height="18"
                    rx="4"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1.1"
                    transform="translate(-32, -9)"
                  />
                  <text
                    x={`${(measureStart.x + measureEnd.x) / 2}%`}
                    y={`${(measureStart.y + measureEnd.y) / 2}%`}
                    fill="#38bdf8"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none"
                    dy="3"
                  >
                    {measuredDistance}m
                  </text>
                </g>
              </>
            )}
            
            {measureStart && (
              <g>
                <circle
                  cx={`${measureStart.x}%`}
                  cy={`${measureStart.y}%`}
                  r="5"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                <circle
                  cx={`${measureStart.x}%`}
                  cy={`${measureStart.y}%`}
                  r="10"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  className="animate-ping"
                  style={{ transformOrigin: `${measureStart.x}% ${measureStart.y}%` }}
                />
                <text
                  x={`${measureStart.x}%`}
                  y={`${measureStart.y - 2.5}%`}
                  fill="#38bdf8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  A
                </text>
              </g>
            )}

            {measureEnd && (
              <g>
                <circle
                  cx={`${measureEnd.x}%`}
                  cy={`${measureEnd.y}%`}
                  r="5"
                  fill="#f43f5e"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                <circle
                  cx={`${measureEnd.x}%`}
                  cy={`${measureEnd.y}%`}
                  r="10"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1"
                  className="animate-ping"
                  style={{ transformOrigin: `${measureEnd.x}% ${measureEnd.y}%` }}
                />
                <text
                  x={`${measureEnd.x}%`}
                  y={`${measureEnd.y - 2.5}%`}
                  fill="#f43f5e"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  B
                </text>
              </g>
            )}
          </svg>
        )}

        {/* Particle Attendee moving dots */}
        {showAttendees &&
          particles.map((p) => (
            <div
              key={`dot-${p.id}`}
              className="absolute w-2 h-2 rounded-full transition-all duration-[400ms] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                backgroundColor: p.color,
                boxShadow: p.color.includes('rgba(239') ? '0 0 4px rgba(239,68,68,0.7)' : 'none',
              }}
            />
          ))}

        {/* POI Hotspot Pins */}
        {filteredPois.map((poi) => {
          const density = poi.currentCount / poi.capacity;
          const isSelected = selectedPoiId === poi.id;
          const isGreenZoneNode = isGreenZoneActive && greenZoneRoute && (
            greenZoneRoute.includes(poi.id) ||
            greenZoneRoute.includes(poi.name) ||
            greenZoneRoute.some(r => r.toLowerCase() === poi.id.toLowerCase() || r.toLowerCase() === poi.name.toLowerCase())
          );

          let statusBadgeColor = 'bg-emerald-500';
          let statusTextClass = 'text-emerald-400';

          if (poi.status === 'congested') {
            statusBadgeColor = 'bg-amber-500';
            statusTextClass = 'text-amber-400';
          } else if (poi.status === 'blocked') {
            statusBadgeColor = 'bg-rose-500 animate-pulse';
            statusTextClass = 'text-rose-400';
          }

          return (
            <div
              key={poi.id}
              onClick={(e) => {
                if (isMeasuring) return;
                onSelectPoi(isSelected ? null : poi.id);
              }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group transition-all duration-300 ${
                isMeasuring ? 'pointer-events-none opacity-40' : 'cursor-pointer'
              } ${
                isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
              style={{ left: `${poi.coords.x}%`, top: `${poi.coords.y}%` }}
            >
              {/* Radial Ping Indicator for heavy crowd stages or active green zone node */}
              {poi.status === 'blocked' && (
                <div className="absolute inset-0 bg-rose-600 rounded-full animate-ping opacity-75 w-10 h-10 -ml-1.5 -mt-1.5" />
              )}
              {isGreenZoneNode && (
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-35 w-10 h-10 -ml-1.5 -mt-1.5" />
              )}

              {/* Pin Frame */}
              <div
                className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                  isGreenZoneNode
                    ? 'bg-emerald-950/90 border-emerald-500/80 shadow-emerald-950 shadow-md scale-102 font-bold'
                    : isSelected
                      ? 'bg-slate-850 border-sky-400 shadow-sky-950 shadow-xl scale-105'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-550 shadow-md'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-1.5 ${
                    isGreenZoneNode ? 'bg-emerald-400 animate-pulse' : statusBadgeColor
                  } ${
                    poi.status === 'blocked' ? 'scale-110' : ''
                  }`}
                />
                <span className="text-[10px] font-mono text-slate-200 font-bold max-w-[102px] whitespace-nowrap overflow-hidden text-overflow-ellipsis flex items-center gap-1">
                  {isGreenZoneNode && <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />}
                  {poi.name.split(' (')[0]}
                </span>
              </div>

              {/* Advanced Tooltip Panel on hover (and select) */}
              <div
                className={`absolute left-1/2 top-11 -translate-x-1/2 w-48 p-2.5 rounded-lg bg-slate-950 border border-slate-750/90 shadow-2xl pointer-events-none transition-all duration-200 text-xs z-40 ${
                  isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 origin-top group-hover:opacity-100 group-hover:scale-100'
                }`}
              >
                <div className="font-bold text-slate-100 truncate mb-1">{poi.name}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed mb-1.5">{poi.description}</div>
                <div className="border-t border-slate-800 pt-1.5 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">Occupancy:</span>
                  <span className={`font-semibold ${statusTextClass}`}>
                    {poi.currentCount} / {poi.capacity} ({Math.round(density * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Active Safety Incident Indicators */}
        {filteredIncidents.map((inc) => (
          <div
            key={inc.id}
            className="absolute z-25 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${inc.coords.x}%`, top: `${inc.coords.y}%` }}
          >
            {/* Pulsing hazard area indicator */}
            <div className={`absolute -inset-2.5 rounded-full animate-ping opacity-60 ${
              inc.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'
            }`} />

            <div className={`p-1.5 rounded-full border shadow-lg ${
              inc.severity === 'high' 
                ? 'bg-rose-950 border-rose-500 text-rose-400' 
                : 'bg-amber-950 border-amber-500 text-amber-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>

            {/* Hover details for incident */}
            <div className="absolute left-6 -top-2 w-52 p-2.5 rounded-lg bg-slate-950 border border-red-900/60 shadow-2xl pointer-events-none opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all text-xs z-45">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${inc.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <span className="font-bold text-slate-200">Incident Telemetry</span>
              </div>
              <div className="font-medium text-slate-100 mb-0.5 whitespace-normal pr-1">{inc.title}</div>
              <div className="text-slate-400 text-[10px] mb-1.5">{inc.location}</div>
              <div className="flex justify-between items-center text-[9px] font-mono border-t border-slate-800 pt-1">
                <span className="text-slate-400">Severity: {inc.severity.toUpperCase()}</span>
                <span className="text-slate-400">Status: {inc.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
        ))}
        </div>

        {/* Safety Drill Operational Status Banner */}
        {isSafetyDrillActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold uppercase tracking-wider text-emerald-400">Simulation Safety Drill Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-[9px] text-emerald-500 font-bold uppercase">Safest Routes Pulsing</span>
          </motion.div>
        )}

        {/* Measure Tool Status and Results Overlay Banner */}
        {isMeasuring && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-35 bg-slate-950/95 border border-sky-500/50 text-sky-400 text-[10px] font-mono px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-[90%] sm:max-w-md"
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <span className="font-bold uppercase tracking-wider text-sky-400">TELEMETRY CALIBRATION</span>
            </div>
            
            <span className="hidden sm:inline text-slate-700">|</span>

            <div className="text-[10.5px] text-slate-250 font-sans flex items-center gap-1.5">
              {!measureStart ? (
                <span className="animate-pulse">Click any 2 spots on the map to measure distance</span>
              ) : !measureEnd ? (
                <span>
                  A ({measureStart.x}%, {measureStart.y}%) <span className="text-sky-300 animate-pulse">→ Click second spot</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Distance:</span>
                  <span className="font-bold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-550/20 font-mono text-xs animate-fade-in">
                    {measuredDistance} meters
                  </span>
                  <button 
                    onClick={() => { setMeasureStart(null); setMeasureEnd(null); }}
                    className="ml-1 text-[8.5px] font-bold text-slate-400 hover:text-white uppercase bg-slate-900 hover:bg-slate-800 border border-slate-800 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                    title="Reset measurement points"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Map Legend Labeling Bar and Zoom Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-800">
        <div id="map-telemetry-legend" className="flex flex-col sm:flex-row sm:items-center gap-3 text-[10px] font-mono text-slate-400 flex-1">
          {/* Interactive Drag Handle visual prompt indicating pan functionality */}
          <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-800/60 px-2 py-1 rounded-md text-slate-500 hover:text-slate-400 select-none cursor-grab active:cursor-grabbing transition-colors shrink-0" title="Click and drag map to pan view">
            <GripVertical className="w-3.5 h-3.5 text-slate-450" />
            <span className="text-[9px] uppercase font-bold tracking-wider">Pan</span>
          </div>

          {/* Visibility toggle button for the legend */}
          <button
            onClick={() => setIsLegendVisible(!isLegendVisible)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer select-none font-semibold uppercase tracking-wider text-[9px]"
            id="legend-visibility-toggle"
            title={isLegendVisible ? "Hide Legend details" : "Show Legend details"}
          >
            {isLegendVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-450" />
                <span>Hide Legend</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Show Legend</span>
              </>
            )}
           </button>

          {/* Safety Drill Trigger Button */}
          <button
            onClick={() => setIsSafetyDrillActive(!isSafetyDrillActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer select-none font-semibold uppercase tracking-wider text-[9px] border hover:scale-102 hover:shadow-lg ${
              isSafetyDrillActive
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 border-slate-800 text-slate-300'
            }`}
            id="safety-drill-trigger"
            title={isSafetyDrillActive ? "Terminate Safe Redirection Drill Overlay" : "Initiate Safe Redirection Drill Overlay"}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isSafetyDrillActive ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
            <span>{isSafetyDrillActive ? "Drill Active" : "Safety Drill"}</span>
          </button>

          {/* Measure Tool Trigger Button */}
          <button
            onClick={() => {
              const nextMode = !isMeasuring;
              setIsMeasuring(nextMode);
              if (!nextMode) {
                setMeasureStart(null);
                setMeasureEnd(null);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer select-none font-semibold uppercase tracking-wider text-[9px] border hover:scale-102 hover:shadow-lg ${
              isMeasuring
                ? 'bg-sky-950/80 border-sky-500/80 text-sky-400 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-850 hover:text-sky-400 border-slate-800 text-slate-300'
            }`}
            id="map-measure-trigger"
            title={isMeasuring ? "Disable Distance Measurement Tool" : "Enable Distance Measurement Tool"}
          >
            <Ruler className={`w-3.5 h-3.5 ${isMeasuring ? 'text-sky-400 animate-spin-slow' : 'text-slate-400'}`} />
            <span>{isMeasuring ? "Measure ON" : "Measure"}</span>
          </button>

          {/* Active Legend filter warning badge */}
          {activeLegendFilter && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-950/40 border border-indigo-850/60 text-indigo-400 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Filtering: {activeLegendFilter}</span>
              <button
                onClick={() => setActiveLegendFilter(null)}
                className="ml-1 text-[8px] text-slate-500 hover:text-white cursor-pointer hover:bg-indigo-900/40 rounded px-1"
                title="Clear Legend Filter"
              >
                ✕
              </button>
            </div>
          )}

          {isLegendVisible && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              
              {/* Normal Level Tooltip */}
              <div 
                id="legend-normal-trigger" 
                onClick={() => setActiveLegendFilter(activeLegendFilter === 'normal' ? null : 'normal')}
                className={`relative group flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-xl transition-all border ${
                  activeLegendFilter === 'normal'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/10'
                    : activeLegendFilter
                    ? 'opacity-35 hover:opacity-75 border-transparent text-slate-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                title="Click to filter Normal POIs"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                <span className="truncate border-b border-dashed border-slate-700 pb-0.5">Normal: Stable Flow</span>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl pointer-events-none opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-sans font-bold text-slate-100 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Normal Capacity
                    </span>
                    <span className="text-[9px] bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                      ≤ 95%
                    </span>
                  </div>
                  <p className="font-sans text-[10.5px] text-slate-400 leading-normal mb-2">
                    Optimal and safe crowd fluidity. Traffic exits are fully unobstructed and pedestrians cycle uninterruptedly.
                  </p>
                  <div className="border-t border-slate-900 pt-1.5 text-[9px] text-slate-500 font-sans flex items-center justify-between">
                    <span>Risk Rating:</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">Minimal</span>
                  </div>
                </div>
              </div>

              {/* Congested Level Tooltip */}
              <div 
                id="legend-congested-trigger" 
                onClick={() => setActiveLegendFilter(activeLegendFilter === 'congested' ? null : 'congested')}
                className={`relative group flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-xl transition-all border ${
                  activeLegendFilter === 'congested'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/10'
                    : activeLegendFilter
                    ? 'opacity-35 hover:opacity-75 border-transparent text-slate-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                title="Click to filter Congested POIs"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                <span className="truncate border-b border-dashed border-slate-700 pb-0.5">Congested: High Density</span>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl pointer-events-none opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-sans font-bold text-slate-100 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Congestion Warning
                    </span>
                    <span className="text-[9px] bg-amber-950/60 border border-amber-800/80 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                      95% - 115%
                    </span>
                  </div>
                  <p className="font-sans text-[10.5px] text-slate-400 leading-normal mb-2">
                    Localized bottleneck threat. Pedestrian transit speed is approximately halved. Field units are automatically alerted.
                  </p>
                  <div className="border-t border-slate-900 pt-1.5 text-[9px] text-slate-500 font-sans flex items-center justify-between">
                    <span>Risk Rating:</span>
                    <span className="text-amber-400 font-bold uppercase tracking-wider">Moderate</span>
                  </div>
                </div>
              </div>

              {/* Blocked Level Tooltip */}
              <div 
                id="legend-blocked-trigger" 
                onClick={() => setActiveLegendFilter(activeLegendFilter === 'blocked' ? null : 'blocked')}
                className={`relative group flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-xl transition-all border ${
                  activeLegendFilter === 'blocked'
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/10'
                    : activeLegendFilter
                    ? 'opacity-35 hover:opacity-75 border-transparent text-slate-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                title="Click to filter Blocked POIs"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm animate-pulse" />
                <span className="truncate border-b border-dashed border-slate-700 pb-0.5">Blocked: Overcrowded</span>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl pointer-events-none opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-sans font-bold text-slate-100 text-[11px] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping mr-1" />
                      Saturated / Blocked
                    </span>
                    <span className="text-[9px] bg-rose-950/60 border border-rose-800/80 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                      &gt;115%
                    </span>
                  </div>
                  <p className="font-sans text-[10.5px] text-slate-400 leading-normal mb-2">
                    Critical crowding capacity exceeded. Safe pedestrian flows are severely impeded. Dispatch evacuation audit.
                  </p>
                  <div className="border-t border-slate-900 pt-1.5 text-[9px] text-slate-500 font-sans flex items-center justify-between">
                    <span>Risk Rating:</span>
                    <span className="text-rose-400 font-bold uppercase tracking-wider">Critical Danger</span>
                  </div>
                </div>
              </div>

              {/* Incident Tooltip */}
              <div 
                id="legend-incident-trigger" 
                onClick={() => setActiveLegendFilter(activeLegendFilter === 'incident' ? null : 'incident')}
                className={`relative group flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-xl transition-all border ${
                  activeLegendFilter === 'incident'
                    ? 'bg-red-950/40 border-red-500/50 text-rose-300 ring-2 ring-red-500/10'
                    : activeLegendFilter
                    ? 'opacity-35 hover:opacity-75 border-transparent text-slate-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                title="Click to filter Active Incidents"
              >
                <div className="w-3.5 h-3.5 rounded border border-rose-500 bg-rose-950/40 flex items-center justify-center p-0">
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                </div>
                <span className="truncate border-b border-dashed border-slate-700 pb-0.5">Active Incident Alert</span>
                
                {/* Tooltip Popup */}
                <div className="absolute bottom-7 right-0 md:left-1/2 md:-translate-x-1/2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl pointer-events-none opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-sans font-bold text-slate-100 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      Operational Dispatch Urgent
                    </span>
                  </div>
                  <p className="font-sans text-[10.5px] text-slate-400 leading-normal mb-2">
                    Outstanding safety, security, or medical hazard registered. Field staff must coordinate and resolve immediately.
                  </p>
                  <div className="border-t border-slate-900 pt-1.5 text-[9px] text-slate-500 font-sans flex items-center justify-between">
                    <span>Incident Response:</span>
                    <span className="text-rose-500 font-bold uppercase tracking-wider">Unresolved</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 select-none bg-slate-950 border border-slate-800/60 p-1.5 rounded-xl self-end lg:self-auto shadow-sm">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 px-1">Scale:</span>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.7))}
            className="p-1 px-[7px] bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors font-bold"
            title="Zoom Out"
            id="map-zoom-out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center text-slate-200 font-bold bg-slate-900 border border-slate-850 py-0.5 rounded text-[9.5px]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.5))}
            className="p-1 px-[7px] bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors font-bold"
            title="Zoom In"
            id="map-zoom-in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-colors text-[9px] uppercase tracking-wider font-bold"
            title="Reset Scope"
            id="map-zoom-reset"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
