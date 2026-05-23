import React, { useState, useEffect } from 'react';
import { POI, CrowdIncident, SystemStats, AlertLevel, AIAnalysisResponse, EngagementCampaign } from './types';
import { InteractiveMap } from './components/InteractiveMap';
import { AttendeeView } from './components/AttendeeView';
import { CrowdEngagementPanel } from './components/CrowdEngagementPanel';
import { MultiEventTransportCoordinator } from './components/MultiEventTransportCoordinator';
import {
  Menu,
  Shield,
  Map,
  Bell,
  Settings,
  BrainCircuit,
  TrendingUp,
  AlertOctagon,
  Users,
  Compass,
  FileCheck,
  Zap,
  Activity,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  PlusCircle,
  XCircle,
  Megaphone,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Pre-packaged high-fidelity fallback telemetry datasets
const fallbackPois: POI[] = [
  {
    id: 'poi-1',
    name: 'Main Stage (Vanguard Dome)',
    description: 'The central stage hosting primary concerts and live events.',
    type: 'stage',
    coords: { x: 50, y: 25 },
    capacity: 12000,
    currentCount: 8850,
    status: 'congested',
  },
  {
    id: 'poi-2',
    name: 'West Stage (Cosmic Arena)',
    description: 'Outdoor secondary pavilion focusing on electronic dance sets.',
    type: 'stage',
    coords: { x: 20, y: 50 },
    capacity: 6000,
    currentCount: 3800,
    status: 'normal',
  },
  {
    id: 'poi-3',
    name: 'East Oasis (Horizon Lounge)',
    description: 'Chilled lounge setup with high quality cocktail spaces and sit downs.',
    type: 'stage',
    coords: { x: 80, y: 55 },
    capacity: 4000,
    currentCount: 1600,
    status: 'normal',
  },
  {
    id: 'poi-4',
    name: 'Central Boulevard & Food Court',
    description: 'Large culinary central court. Heavy intersection node.',
    type: 'food',
    coords: { x: 50, y: 65 },
    capacity: 5000,
    currentCount: 4400,
    status: 'congested',
  },
  {
    id: 'poi-5',
    name: 'Main South Entrance Gate',
    description: 'Major transit portal with metal detectors and RFID ticketing validation.',
    type: 'entrance',
    coords: { x: 50, y: 92 },
    capacity: 10000,
    currentCount: 1850,
    status: 'normal',
  },
  {
    id: 'poi-6',
    name: 'North Emergency Egress & Exit',
    description: 'Large security backup gates designed for egress routing.',
    type: 'exit',
    coords: { x: 50, y: 8 },
    capacity: 8000,
    currentCount: 450,
    status: 'normal',
  },
  {
    id: 'poi-7',
    name: 'North-West Medical Hub',
    description: 'Stationed field paramedics and emergency triage base.',
    type: 'medical',
    coords: { x: 15, y: 15 },
    capacity: 350,
    currentCount: 65,
    status: 'normal',
  },
  {
    id: 'poi-8',
    name: 'East Hydration Point',
    description: 'Water refill bar and modular sanitation restroom facilities.',
    type: 'restroom',
    coords: { x: 85, y: 25 },
    capacity: 2000,
    currentCount: 1250,
    status: 'normal',
  },
];

const fallbackIncidents: CrowdIncident[] = [
  {
    id: 'inc-1',
    type: 'overcrowding',
    title: 'Boulevard Intersection Congestion',
    location: 'Near Central Boulevard & Food Court crossover',
    coords: { x: 52, y: 58 },
    status: 'active',
    severity: 'medium',
    reportedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    reportedBy: 'Security Staff Node Beta',
  },
  {
    id: 'inc-2',
    type: 'medical',
    title: 'Hypothermia / Dehydration Case',
    location: 'Main Stage Backbarrier Center Bar',
    coords: { x: 46, y: 28 },
    status: 'responding',
    severity: 'low',
    reportedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    reportedBy: 'Attendee #4029',
  }
];

const fallbackStats: SystemStats = {
  totalAttendees: 22250,
  activeAlertLevel: 'medium',
  averageFlowRate: 180,
  activeBottlenecks: 2,
  timestamp: new Date().toISOString(),
  isSimulating: true
};

export default function App() {
  // Navigation role tabs: 'dashboard' is organizer/admin mode, 'attendee' is attendee mobile-companion mode
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendee' | 'sim-control'>('dashboard');

  // Live real-time synchronized telemetry states
  const [pois, setPois] = useState<POI[]>(fallbackPois);
  const [incidents, setIncidents] = useState<CrowdIncident[]>(fallbackIncidents);
  const [alerts, setAlerts] = useState<Array<{ id: string; message: string; timestamp: string; level: AlertLevel }>>([]);
  const [stats, setStats] = useState<SystemStats | null>(fallbackStats);
  
  // Tactical Crowd Engagement Gamification Campaigns
  const [campaigns, setCampaigns] = useState<EngagementCampaign[]>([
    {
      id: 'camp-1',
      type: 'discount',
      title: 'Flash 50% Munchies Voucher',
      targetPoiId: 'poi-1',
      targetPoiName: 'Main Stage (Vanguard Dome)',
      redirectPoiId: 'poi-8',
      redirectPoiName: 'East Hydration Point',
      status: 'active',
      description: 'The Main Stage is currently Congested. Walk over to East Hydration Point to cool down and get a 50% food discount code!',
      rewardValue: '50% Vendor Food Coupon',
      timestamp: new Date().toISOString(),
      participationCount: 384
    },
    {
      id: 'camp-2',
      type: 'quiz',
      title: 'Festival Trivia Brawl!',
      targetPoiId: 'poi-4',
      targetPoiName: 'Central Boulevard & Food Court',
      redirectPoiId: 'poi-3',
      redirectPoiName: 'East Oasis (Horizon Lounge)',
      status: 'active',
      description: 'Earn points and disperse the high food court density. Answer our live safety trivia correctly and claim a free drink cooler inside East Oasis!',
      rewardValue: 'Free Cocktail/Drink Voucher',
      timestamp: new Date().toISOString(),
      participationCount: 195
    }
  ]);

  const handleDispatchCampaign = (newCamp: Omit<EngagementCampaign, 'id' | 'timestamp' | 'participationCount' | 'status'>) => {
    const campaignId = `camp-${Date.now()}`;
    const preparedCampaign: EngagementCampaign = {
      ...newCamp,
      id: campaignId,
      status: 'active',
      timestamp: new Date().toISOString(),
      participationCount: 0
    };
    
    setCampaigns(prev => [preparedCampaign, ...prev]);

    // Dispatch a beautiful simulation alert notification automatically!
    const alertMessage = `[CROWD LURE DIRECTIVE DISPATCHED] ${preparedCampaign.title}: Dispersing traffic from ${preparedCampaign.targetPoiName.split(' (')[0]}. Participate in attendee panel to claim: ${preparedCampaign.rewardValue}!`;
    setAlerts(prev => [
      {
        id: `al-${Date.now()}`,
        message: alertMessage,
        timestamp: new Date().toISOString(),
        level: 'medium'
      },
      ...prev
    ]);
  };

  const handleTerminateCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  };

  const handleJoinCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return { ...c, participationCount: c.participationCount + 1 };
      }
      return c;
    }));
  };
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Automated polling tracker for high/critical incidents to trigger safety audits
  const [analyzedIncidentIds, setAnalyzedIncidentIds] = useState<string[]>([]);
  const [lastAutoTriggeredAudit, setLastAutoTriggeredAudit] = useState<{ id: string; title: string; location: string; time: string; severity: string } | null>(null);
  const hasInitializedIncidents = React.useRef(false);

  // Focus states
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [activeEgressRoute, setActiveEgressRoute] = useState<string[] | null>(null);

  // Custom Emergency Green Zone Route prepared by Organizer
  const [greenZoneRoute, setGreenZoneRoute] = useState<string[]>(['poi-1', 'poi-7', 'poi-6']);
  const [isGreenZoneActive, setIsGreenZoneActive] = useState<boolean>(false);

  // Simulation speed and scenario controllers
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [simAttendees, setSimAttendees] = useState<number>(22250);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Incident custom launch forms
  const [selectedIncidentType, setSelectedIncidentType] = useState<'medical' | 'overcrowding' | 'hazard' | 'fight' | 'other'>('overcrowding');
  const [incidentTitleForm, setIncidentTitleForm] = useState<string>('');
  const [incidentLocationForm, setIncidentLocationForm] = useState<string>('');
  const [incidentSeverityForm, setIncidentSeverityForm] = useState<'low' | 'medium' | 'high'>('medium');
  const [showIncidentForm, setShowIncidentForm] = useState<boolean>(false);

  // Broadcast dispatch systems
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastLevel, setBroadcastLevel] = useState<AlertLevel>('medium');
  const [broadcastSuccess, setBroadcastSuccess] = useState<boolean>(false);

  // Gemini AI Intelligence Engine states
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  // Fetch telemetry state from backend with optimistic client fallbacks
  const fetchTelemetryState = async () => {
    try {
      const response = await fetch('/api/crowd/state');
      if (response.ok) {
        const data = await response.json();
        setPois(data.pois);
        setIncidents(data.incidents);
        setAlerts(data.alerts);
        setStats(data.stats);
        setIsConnected(true);
        if (isLoading) {
          setIsLoading(false);
          setSimAttendees(data.stats.totalAttendees);
          setIsSimulating(data.stats.isSimulating);
        }

        if (!hasInitializedIncidents.current) {
          hasInitializedIncidents.current = true;
          // Pre-populate pre-existing active high/critical incidents to analyzed list,
          // so we only trigger on NEW ones reported during this active session.
          const existingHighIds = data.incidents
            .filter((inc: any) => (inc.severity === 'high' || inc.severity === 'critical') && inc.status !== 'resolved')
            .map((inc: any) => inc.id);
          setAnalyzedIncidentIds(existingHighIds);
        }
      } else {
        throw new Error('Non-ok response code');
      }
    } catch (error) {
      // Log connection notices gently
      console.warn('Syncing with live telemetric relays, employing client simulation metrics.');
      setIsConnected(false);
      setIsLoading(false);

      // Locally cycle metrics if server is temporarily restarting/offline
      if (isSimulating) {
        setSimAttendees(prev => {
          const delta = Math.floor((Math.random() - 0.45) * 15 * simSpeed);
          const val = prev + delta;
          return val < 15000 ? 15000 : (val > 40000 ? 40000 : val);
        });

        setPois(currentPois => {
          return currentPois.map(poi => {
            let val = poi.currentCount;
            if (Math.random() > 0.5) {
              const delta = Math.floor((Math.random() - 0.5) * 12 * simSpeed);
              val += delta;
            }
            if (val < 20) val = 20;
            if (val > poi.capacity * 1.25) val = Math.floor(poi.capacity * 1.25);

            const occupancyRate = val / poi.capacity;
            let currentStatus: POI['status'] = 'normal';
            if (occupancyRate > 1.15) currentStatus = 'blocked';
            else if (occupancyRate > 0.95) currentStatus = 'congested';

            return {
              ...poi,
              currentCount: val,
              status: currentStatus
            };
          });
        });

        setStats(prev => {
          if (!prev) return fallbackStats;
          const bottlenecks = pois.filter(p => p.status === 'congested' || p.status === 'blocked').length;
          return {
            ...prev,
            totalAttendees: simAttendees,
            activeBottlenecks: bottlenecks,
            timestamp: new Date().toISOString()
          };
        });
      }
    }
  };

  // Fetch state on mount and initiate 2-second real-time polling
  useEffect(() => {
    fetchTelemetryState();
    const tickInterval = setInterval(fetchTelemetryState, 2000);
    return () => clearInterval(tickInterval);
  }, [simSpeed, isSimulating, simAttendees]);

  // Automated polling tracker for high/critical incidents to trigger safety audits
  useEffect(() => {
    if (!hasInitializedIncidents.current || incidents.length === 0) return;

    // Filter active/responding high or critical incidents
    const activeHighIncidents = incidents.filter(
      (inc) => (inc.severity === 'high' || inc.severity === 'critical') && inc.status !== 'resolved'
    );

    if (activeHighIncidents.length === 0) return;

    // Find the first high/critical incident that hasn't been audited yet
    const unanalyzedIncident = activeHighIncidents.find((inc) => !analyzedIncidentIds.includes(inc.id));

    if (unanalyzedIncident) {
      // Instantly mark as analyzed to prevent re-entrant loops or duplicate trigger calls
      setAnalyzedIncidentIds((prev) => [...prev, unanalyzedIncident.id]);

      // Set trigger information for UI notification
      setLastAutoTriggeredAudit({
        id: unanalyzedIncident.id,
        title: unanalyzedIncident.title,
        location: unanalyzedIncident.location,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        severity: unanalyzedIncident.severity
      });

      // Construct a targeted custom prompt for the AI Safety Audit
      const targetPrompt = `URGENT SECURITY RE-AUDIT MANDATE: An active '${unanalyzedIncident.severity}' severity incident was just reported: "${unanalyzedIncident.title}" at "${unanalyzedIncident.location}". Perform an immediate predictive safety audit of this zone and recommend high-priority, AI-driven crowd mitigation techniques for dispatchers/organizers immediately. Recommend alternate routing modifications.`;

      console.log(`[AUTOMATED AI AUDIT] Active high-severity incident detected (${unanalyzedIncident.id}). Launching safety re-evaluation...`);
      
      // Execute the audit
      handleTriggerAIPredictions(targetPrompt);
    }
  }, [incidents, analyzedIncidentIds]);

  // Sync simulation config to backed on change
  const handleUpdateSimulationSpeed = async (speed: number) => {
    setSimSpeed(speed);
    try {
      await fetch('/api/crowd/simulation/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed }),
      });
    } catch (e) {
      console.error('Simulation sync error:', e);
    }
  };

  const handleUpdateAttendeeTotal = async (total: number) => {
    setSimAttendees(total);
    try {
      await fetch('/api/crowd/simulation/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAttendees: total }),
      });
    } catch (e) {
      console.error('Simulation total attendees sync error:', e);
    }
  };

  const handleToggleSimulation = async (playState: boolean) => {
    setIsSimulating(playState);
    try {
      await fetch('/api/crowd/simulation/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSimulating: playState }),
      });
    } catch (e) {
      console.error('Simulation play/pause sync error:', e);
    }
  };

  const handleTogglePoiInGreenZone = (poiId: string) => {
    setGreenZoneRoute(prev => {
      if (prev.includes(poiId)) {
        return prev.filter(id => id !== poiId);
      } else {
        return [...prev, poiId];
      }
    });
  };

  const handleToggleGreenZoneDeployment = () => {
    const nextActive = !isGreenZoneActive;
    setIsGreenZoneActive(nextActive);
    
    if (nextActive) {
      const routeText = greenZoneRoute
        .map(pid => pois.find(p => p.id === pid)?.name.split(' (')[0] || pid)
        .join(' ➔ ');
      
      const alertMessage = routeText 
        ? `[EMERGENCY SECURE CORRIDOR DEPLOYED] A direct safety path has been established: ${routeText}. Follow the neon safety path mapping on your mobile companion screens. Safe zones have been cleared of personnel bottlenecks.`
        : `[EMERGENCY GREEN ZONE ACTIVATED] Critical hazard response is active. Check maps for nearest glowing escape corridors.`;
      
      setAlerts(prev => [
        {
          id: `gz-al-${Date.now()}`,
          message: alertMessage,
          timestamp: new Date().toISOString(),
          level: 'critical'
        },
        ...prev
      ]);
      
      setStats(prev => prev ? { ...prev, activeAlertLevel: 'critical' } : null);
    } else {
      setAlerts(prev => [
        {
          id: `gz-al-off-${Date.now()}`,
          message: `[DIRECTIVE RECALIBRATION] Emergency Green Zone evacuation corridors have been secured and stood down. Back to standard site operating metrics.`,
          timestamp: new Date().toISOString(),
          level: 'medium'
        },
        ...prev
      ]);
      setStats(prev => prev ? { ...prev, activeAlertLevel: 'medium' } : null);
    }
  };

  // Preset scenario trigger system
  const handleTriggerScenario = async (scenario: 'rush' | 'medical-drill' | 'rapid-evacuation') => {
    setIsAILoading(true);
    setAiAnalysis(null);
    try {
      if (scenario === 'rush') {
        // Boost counts at main stage and center boulevard
        await fetch('/api/crowd/simulation/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speed: 4.5, totalAttendees: 34500, isSimulating: true }),
        });
        setSimSpeed(4.5);
        setSimAttendees(34500);
        setIsSimulating(true);

        // Report high-friction crowd incident
        await fetch('/api/crowd/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'overcrowding',
            title: 'Headliner Transition Surge',
            location: 'Main Stage (Vanguard Dome)',
            severity: 'high',
            reportedBy: 'AI Analytics Node #4',
            x: 50,
            y: 28
          }),
        });
      } else if (scenario === 'medical-drill') {
        await fetch('/api/crowd/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'medical',
            title: 'Multiple Heat Exhaustions Reported',
            location: 'East Hydration Point',
            severity: 'high',
            reportedBy: 'Paramedic Hub Alpha',
            x: 83,
            y: 27
          }),
        });
      } else if (scenario === 'rapid-evacuation') {
        // Speed up simulation, decrease headcount rapidly (simulating exit)
        await fetch('/api/crowd/simulation/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speed: 6.0, totalAttendees: 14500, isSimulating: true }),
        });
        setSimSpeed(6.0);
        setSimAttendees(14500);

        // Broadcast evacuation notice
        await fetch('/api/crowd/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'PRE-DRILL EXERCISE: Safely and orderly exit the gates. Egress routes to North Emergency are open and clear.',
            level: 'critical',
          }),
        });
      }

      await fetchTelemetryState();
      // Run AI assessment automatically
      await handleTriggerAIPredictions('Assess the triggered scenario immediately to outline immediate bottleneck forecasts.');
    } catch (e) {
      console.error('Scenario launch failure:', e);
    } finally {
      setIsAILoading(false);
    }
  };

  // Reset entire simulation data state on backend
  const handleResetSystemData = async () => {
    try {
      const res = await fetch('/api/crowd/reset', { method: 'POST' });
      if (res.ok) {
        setAiAnalysis(null);
        setActiveEgressRoute(null);
        setSelectedPoiId(null);
        hasInitializedIncidents.current = false;
        setAnalyzedIncidentIds([]);
        setLastAutoTriggeredAudit(null);
        fetchTelemetryState();
      }
    } catch (e) {
      console.error('Telemetry system reset error:', e);
    }
  };

  // Update backend incident status
  const handleUpdateIncidentStatus = async (id: string, status: 'active' | 'responding' | 'resolved') => {
    try {
      const res = await fetch(`/api/crowd/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchTelemetryState();
      }
    } catch (e) {
      console.error('Incident resolution error:', e);
    }
  };

  // Dispatch brand new incident logs
  const handleReportIncident = async (data: { type: string; title: string; location: string; x: number; y: number; severity: string }) => {
    try {
      const res = await fetch('/api/crowd/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          title: data.title,
          location: data.location,
          x: data.x,
          y: data.y,
          severity: data.severity,
          reportedBy: 'Field Safety Officer'
        }),
      });
      if (res.ok) {
        fetchTelemetryState();
        setShowIncidentForm(false);
        setIncidentTitleForm('');
        setIncidentLocationForm('');
      }
    } catch (e) {
      console.error('Reporting incident dispatch error:', e);
    }
  };

  // Broadcast manual security alerts
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;

    try {
      const res = await fetch('/api/crowd/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage,
          level: broadcastLevel,
        }),
      });
      if (res.ok) {
        setBroadcastMessage('');
        setBroadcastSuccess(true);
        fetchTelemetryState();
        setTimeout(() => setBroadcastSuccess(false), 4000);
      }
    } catch (e) {
      console.error('Emergency broadcast dispatch error:', e);
    }
  };

  // Remove existing broadcasts
  const handleClearBroadcasts = async () => {
    try {
      await fetch('/api/crowd/alerts', { method: 'DELETE' });
      fetchTelemetryState();
    } catch (e) {
      console.error('Clear feed error:', e);
    }
  };

  // Synchronized broadcast from multi-event & transport systems
  const handleCoordinatedBroadcast = async (message: string, level: 'low' | 'medium' | 'high' | 'critical') => {
    try {
      const res = await fetch('/api/crowd/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          level,
        }),
      });
      if (res.ok) {
        fetchTelemetryState();
      }
    } catch (e) {
      console.error('Coordinated broadcast error:', e);
    }
  };

  // Adjust POI count on-demand (e.g. transport drains a portal bottleneck)
  const handleAdjustPoiCount = async (poiId: string, delta: number) => {
    try {
      const res = await fetch(`/api/crowd/pois/${poiId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        fetchTelemetryState();
      }
    } catch (e) {
      console.error('POI count adjust error:', e);
    }
  };

  // Initiate Server-Side Gemini AI Safety Analysis
  const handleTriggerAIPredictions = async (customPromptOverride?: string) => {
    setIsAILoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: customPromptOverride || aiCustomPrompt || undefined,
        }),
      });
      if (res.ok) {
        const responseData: AIAnalysisResponse = await res.json();
        setAiAnalysis(responseData);
      } else {
        throw new Error('Predict API returned non-ok status');
      }
    } catch (err) {
      // Robust predictive fallback mimicking the Gemini API's analysis output structure perfectly
      setTimeout(() => {
        setAiAnalysis({
          timestamp: new Date().toISOString(),
          summary: `[Predictive Simulation Fallback] Vanguard Arena currently processes ${simAttendees.toLocaleString()} attendees. Main Stage occupancy runs high at 74% with localized crossover friction adjacent to Central Boulevard. Standard north emergency egress displays low-friction pathways.`,
          predictedBottlenecks: [
            {
              locationName: 'Main Stage (Vanguard Dome)',
              riskLevel: 'high',
              explanation: 'Heavy food court egress overlapping with back-of-house stage entries.',
            },
            {
              locationName: 'Central Boulevard & Food Court',
              riskLevel: 'moderate',
              explanation: 'Surplus crowd from West Stage migrating eastwards over the major thoroughfare.',
            },
          ],
          safetyScore: 84,
          actionableRecommendations: [
            'Deploy mobile fence vectors to divert East oasis crowd paths around Central Boulevard.',
            'Convert Central Boulevard thoroughfare lanes into unidirect flow lanes during headliner changes.',
            'Keep North Backup Gates pre-cleared for rapid transition if threshold exceeds 25,000.',
          ],
          suggestedEgressRoutes: [
            {
              start: 'Main Stage (Vanguard Dome)',
              end: 'North Emergency Egress & Exit',
              routePath: ['Main Stage (Vanguard Dome)', 'North Emergency Egress & Exit'],
              safetyJustification: 'Avoids highly congested Central Food Court entirely, passing through direct security pathways.',
            },
            {
              start: 'Central Boulevard & Food Court',
              end: 'Main South Entrance Gate',
              routePath: ['Central Boulevard & Food Court', 'East Oasis (Horizon Lounge)', 'Main South Entrance Gate'],
              safetyJustification: 'Diverts around high-density bottleneck point Alpha by using the spacious East outer track.',
            },
          ],
        });
        setIsAILoading(false);
      }, 500);
      return;
    } finally {
      setIsAILoading(false);
    }
  };

  // Format Recharts data structures
  const chartData = pois.map((poi) => ({
    name: poi.name.split(' (')[0],
    occupancy: poi.currentCount,
    capacity: poi.capacity,
    perc: Math.round((poi.currentCount / poi.capacity) * 100),
  }));

  // Style helpers for risk status indicators
  const getAlertLevelColors = (level: AlertLevel | undefined) => {
    switch (level) {
      case 'low':
        return { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', state: 'LOW' };
      case 'medium':
        return { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', state: 'MODERATE' };
      case 'high':
        return { text: 'text-orange-700', bg: 'bg-orange-50 border-orange-100', state: 'HIGH' };
      case 'critical':
        return { text: 'text-rose-750 font-bold', bg: 'bg-rose-50 border-rose-100 animate-pulse', state: 'CRITICAL' };
      default:
        return { text: 'text-slate-500', bg: 'bg-slate-50 border-slate-100', state: 'UNKNOWN' };
    }
  };

  const alertLevelMeta = stats ? getAlertLevelColors(stats.activeAlertLevel) : { text: 'bg-slate-100', bg: 'bg-slate-50', state: 'STABLE' };

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* ----------------- SIDEBAR CONTAINER ----------------- */}
      <nav className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800/80">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-950">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight block">CrowdIQ</span>
            <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold tracking-widest leading-none">
              Intelligence Hub
            </span>
          </div>
        </div>

        {/* Dynamic Nav Tabs */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('dashboard'); setActiveEgressRoute(null); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium text-xs ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 shadow-sm'
                : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 mr-3" />
            Organizer Dashboard
          </button>

          <button
            onClick={() => setActiveTab('attendee')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium text-xs ${
              activeTab === 'attendee'
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 shadow-sm'
                : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Compass className="w-4 h-4 mr-3" />
            Attendee Companion App
          </button>

          <button
            onClick={() => setActiveTab('sim-control')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium text-xs ${
              activeTab === 'sim-control'
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 shadow-sm'
                : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-l-4 border-transparent'
            }`}
          >
            <Settings className="w-4 h-4 mr-3" />
            Simulation Operations
          </button>

          {/* Quick Active Scenarios in Sidebar */}
          <div className="pt-6">
            <p className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">
              Rapid Scenarios
            </p>
            <div className="px-2 space-y-1.5">
              <button
                onClick={() => handleTriggerScenario('rush')}
                disabled={isAILoading}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center gap-1.5 transition-colors"
              >
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                Headliner Heavy Rush
              </button>
              <button
                onClick={() => handleTriggerScenario('medical-drill')}
                disabled={isAILoading}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center gap-1.5 transition-colors"
              >
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                East Hydration Drill
              </button>
              <button
                onClick={() => handleTriggerScenario('rapid-evacuation')}
                disabled={isAILoading}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center gap-1.5 transition-colors"
              >
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                Vanguard Drill Exit
              </button>
            </div>
          </div>
        </div>

        {/* Global Operational Status Marker */}
        <div className="p-6 border-t border-slate-800/80">
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-750/35">
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              System Telemetry
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse mr-2`} />
                <span className="text-[11px] text-slate-300 font-mono">
                  {isConnected ? 'Live Sync' : 'Simulated'}
                </span>
              </div>
              <button
                onClick={handleResetSystemData}
                title="Reset simulation parameters"
                className="text-slate-500 hover:text-slate-300 transition-colors"
                id="reset-simulation-data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ----------------- MAIN VIEW DESK ----------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Block */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Crowd Operations Dashboard'}
              {activeTab === 'attendee' && 'Vanguard Companion Portal'}
              {activeTab === 'sim-control' && 'Scenario Simulator Console'}
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold rounded-full font-mono flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-600 animate-bounce" />
              Arena Alpha Zone
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-700 block">ssingnit10@gmail.com</span>
              <span className="text-[10px] text-slate-400 font-mono block">Operator Terminal ID #09</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-indigo-50 flex items-center justify-center font-bold text-xs text-indigo-700 uppercase">
              OP
            </div>
          </div>
        </header>

        {/* Core Frame Content Container */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-50">

          {/* Core Analytics Metric Row */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Live Headcount */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Live Venue Crowd
                  </p>
                  <span className="text-2.5xl font-extrabold text-slate-900 block tracking-tight">
                    {stats.totalAttendees.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                    Maximum Occupancy: 45K
                  </span>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Risk Threat Level Indicator */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Overall Threat Rating
                  </p>
                  <span className={`text-xl font-extrabold px-3 py-1 rounded-xl border ${alertLevelMeta.bg} ${alertLevelMeta.text} inline-block mt-1 font-mono text-center`}>
                    {alertLevelMeta.state}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 block mt-1.5">
                    Based on active bottlenecks
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                  <AlertOctagon className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Egress Velocity Tracker */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Transit Egress Velocity
                  </p>
                  <span className="text-2.5xl font-extrabold text-slate-900 block tracking-tight">
                    {stats.averageFlowRate} <span className="text-xs font-semibold text-slate-500">pp/m</span>
                  </span>
                  <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-0.5 mt-0.5 font-mono">
                    <TrendingUp className="w-3.5 h-3.5" /> High Liquid Liquidity
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Card 4: Dispatched Critical Hazards */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Unresolved Safety Dispatches
                  </p>
                  <span className={`text-2.5xl font-extrabold ${incidents.filter(i => i.status !== 'resolved').length > 0 ? 'text-rose-600' : 'text-slate-900'} block tracking-tight`}>
                    {incidents.filter(i => i.status !== 'resolved').length.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                    {incidents.filter(i => i.status === 'active').length} in critical red state
                  </span>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

            </div>
          )}

          {/* ----------------- TAB WORKSPACE 1: ORGANIZER DASHBOARD ----------------- */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column Map Workspace: Occupies 7 out of 12 columns */}
              <div className="xl:col-span-7 flex flex-col gap-6">
                
                {/* 2D Map Visualization Board */}
                <div className="h-[480px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col p-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3 shrink-0">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Live Heatmap - Floor Telemetry</span>
                      <span className="text-[10px] text-slate-400">Interacts dynamically with clicking pins</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 bg-slate-900 rounded-2xl relative">
                    <InteractiveMap
                      pois={pois}
                      incidents={incidents}
                      selectedPoiId={selectedPoiId}
                      onSelectPoi={setSelectedPoiId}
                      activeEgressRoute={activeEgressRoute}
                      greenZoneRoute={greenZoneRoute}
                      isGreenZoneActive={isGreenZoneActive}
                      onOptimizeRoutes={setActiveEgressRoute}
                    />
                  </div>
                </div>

                {/* Real-time Stage Headcount Capacity Histogram */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Operational Sector Densities
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-none">Headcount compared against security safety limits</p>
                    </div>
                  </div>

                  <div className="h-[180px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <ChartTooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                            labelStyle={{ color: '#f8fafc', fontSize: '10px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#38bdf8', fontSize: '11px' }}
                          />
                          <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => {
                              const ratio = entry.occupancy / entry.capacity;
                              let fill = '#6366f1'; // Normal Blue
                              if (ratio > 1.15) fill = '#ef4444'; // Red
                              else if (ratio > 0.95) fill = '#f59e0b'; // Yellow
                              return <Cell key={`cell-${index}`} fill={fill} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No POI details found.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column Intelligence Desk: Occupies 5 out of 12 columns */}
              <div className="xl:col-span-5 flex flex-col gap-6">

                {/* Live Gemini predictive engine Card */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-purple-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <BrainCircuit className="w-4 h-4 text-indigo-700 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Gemini 3.5 Safety Advisor
                        </h4>
                        <p className="text-[10px] text-slate-400">Predictive crowd flow evacuation algorithms</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTriggerAIPredictions()}
                      disabled={isAILoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-200"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isAILoading ? 'Calculating...' : 'Run Audit'}
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Optional Custom analytical target instruction query prompt */}
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">
                        Analytics Focus Target (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Focus on Vanguard stage crowd blockades..."
                          value={aiCustomPrompt}
                          onChange={(e) => setAiCustomPrompt(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 text-slate-700 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {lastAutoTriggeredAudit && (
                      <div className="bg-emerald-50/90 border border-emerald-250 p-3.5 rounded-2xl flex items-start gap-2.5 animate-pulse">
                        <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">
                            ⚡ AI AUTO-AUDIT DISPATCHED
                          </span>
                          <p className="text-[11px] text-slate-700 font-medium leading-normal mt-0.5">
                            Mitigation recommendations generated for new {lastAutoTriggeredAudit.severity}-hazard report: <strong className="text-emerald-900">&quot;{lastAutoTriggeredAudit.title}&quot;</strong> at {lastAutoTriggeredAudit.location}.
                          </p>
                          <span className="text-[9px] font-mono text-slate-400 mt-1 block">
                            Auto-run triggered successfully at {lastAutoTriggeredAudit.time}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setLastAutoTriggeredAudit(null)}
                          className="text-slate-400 hover:text-slate-600 font-bold text-xs shrink-0 self-start p-0.5"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <div className="bg-slate-50/80 border border-slate-100 p-2.5 rounded-xl flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span>
                        <strong>Auto-Audit Polling Online</strong>: High/critical incident reporting triggers immediate AI recommendations.
                      </span>
                    </div>

                    {isAILoading && (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-mono">Running high-stress crowd simulations...</span>
                      </div>
                    )}

                    {aiError && (
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-700 text-[11px] leading-relaxed">
                        {aiError}
                      </div>
                    )}

                    {!isAILoading && !aiAnalysis && !aiError && (
                      <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs text-slate-500 block">No Active Prediction Report</span>
                        <p className="text-[10px] text-slate-400 px-8 mt-1">
                          Click <strong>&quot;Run Audit&quot;</strong> to activate the server side model processing the density telemetry.
                        </p>
                      </div>
                    )}

                    {/* Report Output results */}
                    {!isAILoading && aiAnalysis && (
                      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                        
                        {/* Summary overview */}
                        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block mb-1">
                            Auditor Summary
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-sans mt-1">
                            {aiAnalysis.summary}
                          </p>
                          <div className="mt-3 flex items-center justify-between border-t border-indigo-100/60 pt-2 text-[10px]">
                            <span className="text-slate-500">Physical Flow Safety Index:</span>
                            <span className={`font-bold font-mono text-sm ${
                              aiAnalysis.safetyScore > 80 ? 'text-emerald-600' : aiAnalysis.safetyScore > 50 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {aiAnalysis.safetyScore}/100
                            </span>
                          </div>
                        </div>

                        {/* Predicted Bottlenecks */}
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                            Predicted Overflows & Risk Sectors
                          </span>
                          <div className="space-y-2">
                            {aiAnalysis.predictedBottlenecks.map((bot, idx) => (
                              <div key={`bot-${idx}`} className="p-3 bg-slate-50 border border-slate-200/85 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[11px] font-bold text-slate-800">{bot.locationName}</span>
                                  <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded ${
                                    bot.riskLevel === 'severe' || bot.riskLevel === 'high'
                                      ? 'bg-rose-100 text-rose-700 font-bold'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {bot.riskLevel}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{bot.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Egress Evacuation Paths */}
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                            Dynamic Suggested Evacuation Tracks
                          </span>
                          <div className="space-y-2">
                            {aiAnalysis.suggestedEgressRoutes.map((route, idx) => (
                              <button
                                key={`egress-${idx}`}
                                onClick={() => setActiveEgressRoute(route.routePath)}
                                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col ${
                                  activeEgressRoute && activeEgressRoute.join(',') === route.routePath.join(',')
                                    ? 'bg-emerald-55/60 border-emerald-400 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono mb-1 w-full">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="font-bold text-slate-700 truncate">{route.start.split(' (')[0]}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-slate-500 truncate">{route.end.split(' (')[0]}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded uppercase self-end whitespace-nowrap ml-1">
                                    MAP IT
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-tight mb-2 italic">
                                  &ldquo;{route.safetyJustification}&rdquo;
                                </p>
                                <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2 text-[9px] font-mono text-slate-400">
                                  <span>Routing:</span>
                                  {route.routePath.map((node, nIdx) => (
                                    <React.Fragment key={`nd-${nIdx}`}>
                                      <span className="bg-slate-100/90 py-0.5 px-1.5 rounded">{node.split(' (')[0]}</span>
                                      {nIdx < route.routePath.length - 1 && <span className="text-slate-300">&gt;</span>}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions lists */}
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                            Tactical Staff Directives
                          </span>
                          <ul className="space-y-1.5">
                            {aiAnalysis.actionableRecommendations.map((rec, idx) => (
                              <li key={`rec-${idx}`} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-indigo-500 font-bold font-mono mt-0.5">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* Live Operations Incident Board */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Incident Dispatch logs</span>
                      <p className="text-[10px] text-slate-400">Manage reported security issues live</p>
                    </div>
                    <button
                      onClick={() => setShowIncidentForm(!showIncidentForm)}
                      className={`text-xs font-semibold py-1 px-2.5 rounded-lg border transition-all flex items-center gap-1 ${
                        showIncidentForm 
                          ? 'bg-rose-950 text-rose-300 border-rose-900' 
                          : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      {showIncidentForm ? 'Close' : 'Log New'}
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Add Incident Mini Drawer Form */}
                    {showIncidentForm && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!incidentTitleForm) return;
                          // Choose matching coordinates or defaults
                          const p = pois.find(poi => poi.name === incidentLocationForm) || pois[0];
                          handleReportIncident({
                            type: selectedIncidentType,
                            title: incidentTitleForm,
                            location: incidentLocationForm || p.name,
                            x: p.coords.x + (Math.random() - 0.5) * 3,
                            y: p.coords.y + (Math.random() - 0.5) * 3,
                            severity: incidentSeverityForm
                          });
                        }}
                        className="bg-slate-900 border border-slate-750 p-4 rounded-2xl text-slate-330 space-y-3 mb-2"
                      >
                        <h5 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          Log Field Incident Security
                        </h5>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <label className="text-slate-400 block mb-0.5">Category</label>
                            <select
                              value={selectedIncidentType}
                              onChange={(e) => setSelectedIncidentType(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 focus:outline-none"
                            >
                              <option value="overcrowding">Overcrowding</option>
                              <option value="medical">Medical Need</option>
                              <option value="hazard">Physical Danger</option>
                              <option value="fight">Altercation</option>
                              <option value="other">Other System</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-0.5">Criticality</label>
                            <select
                              value={incidentSeverityForm}
                              onChange={(e) => setIncidentSeverityForm(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-300 focus:outline-none"
                            >
                              <option value="low">Low Warning</option>
                              <option value="medium">Medium Alert</option>
                              <option value="high">High Emergency</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Location Zone</label>
                          <select
                            value={incidentLocationForm}
                            onChange={(e) => setIncidentLocationForm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="">-- Choose sector --</option>
                            {pois.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Telemetry Notes</label>
                          <input
                            type="text"
                            required
                            placeholder="Describe hazard..."
                            value={incidentTitleForm}
                            onChange={(e) => setIncidentTitleForm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-rose-600 hover:bg-rose-500 font-semibold text-slate-950 p-2 text-xs rounded-lg transition-colors"
                        >
                          Dispatch Security Node
                        </button>
                      </form>
                    )}

                    {/* Active list map */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {incidents.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs text-slate-400 border border-dashed border-slate-100 rounded-xl">
                          No reported issues. Venue is clean.
                        </div>
                      ) : (
                        incidents.map((inc) => (
                          <div
                            key={inc.id}
                            className={`p-3.5 rounded-xl border leading-relaxed flex items-start gap-3 transition-colors ${
                              inc.status === 'resolved'
                                ? 'bg-slate-50/50 border-slate-150 opacity-60'
                                : 'bg-white border-slate-200 hover:shadow-sm'
                            }`}
                          >
                            <div className={`p-1.5 rounded-full shrink-0 ${
                              inc.severity === 'high' 
                                ? 'bg-rose-100 text-rose-600' 
                                : inc.severity === 'medium'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              <AlertTriangle className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-bold text-slate-800 text-xs truncate">{inc.title}</span>
                                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                  inc.status === 'resolved' 
                                    ? 'bg-slate-100 text-slate-500' 
                                    : inc.status === 'responding'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800 animate-pulse'
                                }`}>
                                  {inc.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mb-2">{inc.location}</span>
                              
                              {/* Admin Action Buttons */}
                              <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-[9px] font-mono">
                                <span className="text-slate-400 mr-auto">
                                  By: {inc.reportedBy}
                                </span>
                                {inc.status === 'active' && (
                                  <button
                                    onClick={() => handleUpdateIncidentStatus(inc.id, 'responding')}
                                    className="bg-slate-100 hover:bg-amber-100 hover:text-amber-850 px-2.5 py-1 text-slate-600 rounded transition-colors"
                                  >
                                    Respond
                                  </button>
                                )}
                                {inc.status !== 'resolved' && (
                                  <button
                                    onClick={() => handleUpdateIncidentStatus(inc.id, 'resolved')}
                                    className="bg-slate-100 hover:bg-emerald-100 hover:text-emerald-850 px-2.5 py-1 text-slate-600 rounded transition-colors"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Tactical Live Crowd Engagement Campaign Panel */}
                <CrowdEngagementPanel
                  pois={pois}
                  campaigns={campaigns}
                  onDispatchCampaign={handleDispatchCampaign}
                  onTerminateCampaign={handleTerminateCampaign}
                />

                {/* Multi-Event & On-Demand Transit Coordinator Panel */}
                <MultiEventTransportCoordinator
                  pois={pois}
                  onBroadcastAlert={handleCoordinatedBroadcast}
                  onOptimizeRoutes={setActiveEgressRoute}
                  onAdjustPoiCount={handleAdjustPoiCount}
                  activeEgressRoute={activeEgressRoute}
                />

              </div>

            </div>
          )}

          {/* ----------------- TAB WORKSPACE 2: ATTENDEE COMPANION APP ----------------- */}
          {activeTab === 'attendee' && (
            <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl shadow-xl border border-slate-800">
              <div className="border-b border-slate-800 pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                    Attendee Companion Operations Portal
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Simulate how real-world festival attendees interact, calculate route avoidance, and report hazards.
                  </p>
                </div>
                <span className="bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 text-xs px-3 py-1 rounded-full font-mono">
                  Standard Web / Mobile View
                </span>
              </div>

              {/* Layout splits between 2D Map (interactive selector) and Form actions */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* Left Live Map overlay tracker */}
                <div className="xl:col-span-6 flex flex-col gap-4">
                  <div className="h-[430px] rounded-2.5xl overflow-hidden bg-slate-950">
                    <InteractiveMap
                      pois={pois}
                      incidents={incidents}
                      selectedPoiId={selectedPoiId}
                      onSelectPoi={setSelectedPoiId}
                      activeEgressRoute={activeEgressRoute}
                      greenZoneRoute={greenZoneRoute}
                      isGreenZoneActive={isGreenZoneActive}
                      onOptimizeRoutes={setActiveEgressRoute}
                    />
                  </div>
                  <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-400">
                    💡 <strong>Simulate User Egress:</strong> Choose departure and target points on the right panel. Safe routing coordinates bypass blocked congestion nodes, calculating pathways in real-time.
                  </div>
                </div>

                {/* Right Companion dashboard feeds */}
                <div className="xl:col-span-6">
                  <AttendeeView
                    pois={pois}
                    campaigns={campaigns}
                    onJoinCampaign={handleJoinCampaign}
                    onReportIncident={handleReportIncident}
                    onEgressRouteRequested={(from, to) => {
                      // Attempt to fetch dynamically from Gemini egress pathing matrix if matching
                      if (aiAnalysis) {
                        const matched = aiAnalysis.suggestedEgressRoutes.find(
                          (r) => r.start.includes(from) || from.includes(r.start)
                        );
                        if (matched) {
                          setActiveEgressRoute(matched.routePath);
                          return;
                        }
                      }
                      // Regular layout fallback: just draw line between them
                      setActiveEgressRoute([from, to]);
                    }}
                    statusAlerts={alerts}
                    selectedPoiId={selectedPoiId}
                    onSelectPoi={setSelectedPoiId}
                    greenZoneRoute={greenZoneRoute}
                    isGreenZoneActive={isGreenZoneActive}
                  />
                </div>

              </div>
            </div>
          )}

          {/* ----------------- TAB WORKSPACE 3: SIMULATION CONTROL CENTER ----------------- */}
          {activeTab === 'sim-control' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-4xl mx-auto space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  Scenario Simulator & Telemetry Forge
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  CrowdIQ evaluates simulated high-density movements. Adjust the sliders below to stress-test safety metrics, and view real-time changes instantly.
                </p>
              </div>

              {/* Sliders Control Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                
                {/* Simulated Tick Speed multiplier */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Time-Delta Velocity SpeedMultiplier</span>
                    <span className="font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                      {simSpeed.toFixed(1)}x Speed
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="8.0"
                    step="0.1"
                    value={simSpeed}
                    onChange={(e) => handleUpdateSimulationSpeed(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Increases the rate of attendees migrating between points. Higher rates generate rapid state changes, resulting in faster simulated bottlenecks.
                  </p>
                </div>

                {/* Total Simulated volume */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Total Simulation Volume (Attendees)</span>
                    <span className="font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                      {simAttendees.toLocaleString()} Persons
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="40000"
                    step="500"
                    value={simAttendees}
                    onChange={(e) => handleUpdateAttendeeTotal(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Dynamically scales headcount across all festival POI nodes. Pushing count past 28,000 simulates venue capacity stress.
                  </p>
                </div>

              </div>

              {/* Dispatch manual emergency safety broadcast notifications straight onto status alert levels */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-rose-500" />
                  Manual Safety Feed Broadcast Desk
                </h4>

                <form onSubmit={handleBroadcastAlert} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                      Urgency Alert Level Type
                    </label>
                    <div className="flex gap-4">
                      {['medium', 'high', 'critical'].map((level) => (
                        <label
                          key={level}
                          className={`flex-1 flex items-center justify-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            broadcastLevel === level
                              ? 'bg-rose-50 border-rose-400 text-rose-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="broadcast-level"
                            value={level}
                            checked={broadcastLevel === level}
                            onChange={() => setBroadcastLevel(level as any)}
                            className="mr-2 accent-rose-600 hidden"
                          />
                          {level.toUpperCase()} Urgent Warning
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                      Broadcaster Message Prompt
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Extreme safety density near Vanguard exits. Respect the physical barriers and divert path around food courts."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 text-slate-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {broadcastSuccess && (
                    <div className="bg-emerald-55 text-emerald-700 font-mono text-xs px-4 py-2.5 rounded-xl border border-emerald-150 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Bulletins successfully broadcasted onto passenger applet feeds.
                    </div>
                  )}

                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                    <button
                      type="button"
                      onClick={handleClearBroadcasts}
                      className="text-xs font-semibold hover:text-slate-800 text-slate-500 underline transition-all"
                    >
                      Clear active advisory bulletins
                    </button>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-2 px-6 rounded-xl transition-colors shadow-sm"
                    >
                      Push Broadcast Alert Live
                    </button>
                  </div>
                </form>
              </div>

              {/* Prepare & Deploy Emergency Green Zone Route */}
              <div className="border-t border-slate-100 pt-6 space-y-4" id="organizer-greenzone-panel">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-500 animate-pulse" />
                    Emergency Green Zone Safe Corridor Architect
                  </h4>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                    isGreenZoneActive 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 animate-pulse' 
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    {isGreenZoneActive ? "● CORRIDOR LIVE DEPLOYED" : "○ OFFLINE / READY"}
                  </span>
                </div>

                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Prepare a dedicated, high-priority safe pathway for extremely critical crowd emergencies. Attendees will instantly see this highlighted trail pulsing green in their portal, routing them directly through secured channels.
                </p>

                {/* Interactive Path Builder */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="text-xs">
                    <span className="font-bold text-slate-700 block mb-1.5">Configure Target Safe Sequence Nodes</span>
                    <p className="text-[10px] text-slate-400 mb-3">Click on any POI locations below in sequential order to build or adjust your evacuation pathway.</p>
                    
                    {/* Horizontal Node Flow Visualizer */}
                    <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-100 p-3 rounded-xl min-h-[50px]">
                      {greenZoneRoute.length === 0 ? (
                        <span className="text-slate-400 italic font-mono text-[11px] py-1">No nodes selected. Click the list below to create a direct green zone corridor path.</span>
                      ) : (
                        greenZoneRoute.map((nodeId, idx) => {
                          const poi = pois.find(p => p.id === nodeId);
                          return (
                            <React.Fragment key={nodeId}>
                              {idx > 0 && <span className="text-emerald-400 font-bold">➔</span>}
                              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-150 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg text-[11px] font-mono shadow-xs">
                                <span className="bg-emerald-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">{idx + 1}</span>
                                <span>{poi ? poi.name.split(' (')[0] : nodeId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePoiInGreenZone(nodeId)}
                                  className="ml-1 text-[11px] font-extrabold text-emerald-600 hover:text-rose-500 hover:bg-rose-50 px-1 rounded transition-colors cursor-pointer"
                                  title="Delete node from route"
                                >
                                  ×
                                </button>
                              </div>
                            </React.Fragment>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Toggle Selector Grid */}
                  <div>
                    <span className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Available Venue Hubs</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {pois.map((poi) => {
                        const isNodeSelected = greenZoneRoute.includes(poi.id);
                        const nodeIndex = greenZoneRoute.indexOf(poi.id);
                        return (
                          <button
                            type="button"
                            key={poi.id}
                            onClick={() => handleTogglePoiInGreenZone(poi.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] font-medium transition-all text-left ${
                              isNodeSelected
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-bold shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className="truncate">{poi.name.split(' (')[0]}</span>
                            {isNodeSelected ? (
                              <span className="bg-emerald-600 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-extrabold ml-1 shrink-0">
                                {nodeIndex + 1}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs shrink-0">+</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deploy Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setGreenZoneRoute([])}
                      className="text-xs font-semibold hover:text-rose-600 text-slate-400 hover:underline transition-all cursor-pointer"
                    >
                      Reset node sequence
                    </button>

                    <button
                      type="button"
                      disabled={greenZoneRoute.length < 2}
                      onClick={handleToggleGreenZoneDeployment}
                      className={`flex items-center gap-2 font-bold text-xs py-2 px-6 rounded-xl transition-all shadow-md ${
                        greenZoneRoute.length < 2
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-250 shadow-none'
                          : isGreenZoneActive
                            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:scale-102 cursor-pointer'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      {isGreenZoneActive ? "DEACTIVATE SECURED CORRIDOR" : "DEPLOY GREEN EVAC CORRIDOR LIVE"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulation State Play controls */}
              <div className="border-t border-slate-100 pt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSimulation(!isSimulating)}
                    className={`p-3 rounded-2xl text-white flex items-center gap-2 text-xs font-bold transition-all shadow-sm ${
                      isSimulating 
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-100' 
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-100'
                    }`}
                  >
                    {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isSimulating ? 'Pause State Evolution' : 'Resume State Evolution'}
                  </button>

                  <button
                    onClick={handleResetSystemData}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Simulation Database Dataset
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}
