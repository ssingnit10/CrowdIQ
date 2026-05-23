export interface Coordinate {
  x: number; // 0 to 100 representing percentage coordinates on the venue map
  y: number;
}

export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

export interface POI {
  id: string;
  name: string;
  description: string;
  type: 'stage' | 'entrance' | 'exit' | 'food' | 'restroom' | 'medical';
  coords: Coordinate;
  capacity: number;
  currentCount: number;
  status: 'normal' | 'congested' | 'blocked' | 'evacuating';
}

export interface CrowdIncident {
  id: string;
  type: 'medical' | 'overcrowding' | 'hazard' | 'fight' | 'other';
  title: string;
  location: string;
  coords: Coordinate;
  status: 'active' | 'responding' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  reportedAt: string;
  reportedBy: string;
}

export interface RoutingNode {
  id: string;
  name: string;
  coords: Coordinate;
  neighbors: string[]; // Neighbor node IDs
}

export interface RoutingEdge {
  fromNode: string;
  toNode: string;
  currentCongestion: number; // 0 (free) to 1 (blocked)
}

export interface SystemStats {
  totalAttendees: number;
  activeAlertLevel: AlertLevel;
  averageFlowRate: number; // people per minute crossing egress
  activeBottlenecks: number;
  timestamp: string;
  isSimulating: boolean;
}

export interface AIAnalysisRequest {
  systemStats: SystemStats;
  pois: POI[];
  incidents: CrowdIncident[];
  userPrompt?: string;
}

export interface AIAnalysisResponse {
  timestamp: string;
  summary: string;
  predictedBottlenecks: Array<{
    locationName: string;
    riskLevel: 'low' | 'moderate' | 'high' | 'severe';
    explanation: string;
  }>;
  safetyScore: number; // 1 to 100
  actionableRecommendations: string[];
  suggestedEgressRoutes: Array<{
    start: string;
    end: string;
    routePath: string[]; // list of POIs/Nodes
    safetyJustification: string;
  }>;
}

export interface EngagementCampaign {
  id: string;
  type: 'quiz' | 'discount' | 'lightshow' | 'hunt';
  title: string;
  targetPoiId: string;
  targetPoiName: string;
  redirectPoiId?: string;
  redirectPoiName?: string;
  status: 'active' | 'completed' | 'expired';
  description: string;
  rewardValue: string;
  timestamp: string;
  participationCount: number;
}
