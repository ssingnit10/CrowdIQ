import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { POI, CrowdIncident, SystemStats, AlertLevel } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google Gen AI lazily
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// Global state in backend
let initialPois: POI[] = [
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

let initialIncidents: CrowdIncident[] = [
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

let mockAlerts: Array<{ id: string; message: string; timestamp: string; level: AlertLevel }> = [
  {
    id: 'al-1',
    message: 'Increased density detected at Vanguard main dome. Respect staff barrier redirections.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    level: 'medium',
  }
];

// Current session variables
let currentPois = JSON.parse(JSON.stringify(initialPois)) as POI[];
let currentIncidents = JSON.parse(JSON.stringify(initialIncidents)) as CrowdIncident[];
let currentAlerts = [...mockAlerts];
let totalAttendeesSimulated = 22250;
let simulationSpeedFactor = 1.0;
let activeEventIsSimulating = true;
let lastStateUpdateTime = Date.now();

// Simulator state updating tick
function getUpdatedState() {
  const now = Date.now();
  const timeDelta = (now - lastStateUpdateTime) / 1000; // in seconds
  lastStateUpdateTime = now;

  if (activeEventIsSimulating) {
    // Slowly cycle some crowd density variations
    const noise = Math.sin(now / 15000);
    const flowDirection = Math.cos(now / 60000); // represents flow entering/leaving
    
    // Total attendee fluctuation
    totalAttendeesSimulated += Math.floor((Math.random() - 0.45) * 15 * simulationSpeedFactor);
    if (totalAttendeesSimulated < 15000) totalAttendeesSimulated = 15000;
    if (totalAttendeesSimulated > 40000) totalAttendeesSimulated = 40000;

    // Distribute flows between POIs
    currentPois.forEach((poi) => {
      let delta = 0;
      if (poi.type === 'stage') {
        // Concert density moves up and down
        if (poi.id === 'poi-1') {
          // main stage
          delta = Math.floor(Math.sin(now / 35000) * 80 * simulationSpeedFactor);
        } else if (poi.id === 'poi-2') {
          delta = Math.floor(Math.cos(now / 25000) * 45 * simulationSpeedFactor);
        } else {
          delta = Math.floor(Math.sin(now / 20000) * 30 * simulationSpeedFactor);
        }
      } else if (poi.type === 'food') {
        // peak lunch/dinner cycles
        delta = Math.floor(Math.sin(now / 40000) * 50 * simulationSpeedFactor);
      } else if (poi.type === 'entrance') {
        delta = Math.floor((flowDirection > 0 ? 30 : -20) * simulationSpeedFactor);
      } else if (poi.type === 'exit') {
        delta = Math.floor((flowDirection > 0 ? -10 : 25) * simulationSpeedFactor);
      } else {
        delta = Math.floor((Math.random() - 0.5) * 15 * simulationSpeedFactor);
      }

      poi.currentCount += delta;
      if (poi.currentCount < 20) poi.currentCount = Math.floor(Math.random() * 30) + 10;
      if (poi.currentCount > poi.capacity * 1.25) {
        poi.currentCount = Math.floor(poi.capacity * 1.25); // cap at max risk overcrowd
      }

      // Re-evaluate status
      const occupancyRate = poi.currentCount / poi.capacity;
      if (occupancyRate > 0.95) {
        poi.status = 'congested';
      } else if (occupancyRate > 1.15) {
        poi.status = 'blocked';
      } else {
        poi.status = 'normal';
      }
    });
  }

  // Calculate stats
  let activeBottlenecks = currentPois.filter(p => p.status === 'congested' || p.status === 'blocked').length;
  let severityFactor = 0;
  if (activeBottlenecks > 2) severityFactor += 1;
  const criticalIncidents = currentIncidents.filter(i => i.status === 'active' && i.severity === 'high').length;
  severityFactor += criticalIncidents * 2;

  let alertLevel: AlertLevel = 'low';
  if (severityFactor >= 4) {
    alertLevel = 'critical';
  } else if (severityFactor >= 2) {
    alertLevel = 'high';
  } else if (severityFactor >= 1) {
    alertLevel = 'medium';
  }

  const averageFlow = Math.floor(180 + Math.sin(now / 30000) * 50 + (simulationSpeedFactor * 10));

  return {
    pois: currentPois,
    incidents: currentIncidents,
    alerts: currentAlerts,
    stats: {
      totalAttendees: totalAttendeesSimulated,
      activeAlertLevel: alertLevel,
      averageFlowRate: averageFlow,
      activeBottlenecks: activeBottlenecks,
      timestamp: new Date().toISOString(),
      isSimulating: activeEventIsSimulating
    } as SystemStats
  };
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Get current crowd platform state (dynamic simulation metrics)
app.get('/api/crowd/state', (req, res) => {
  const updated = getUpdatedState();
  res.json(updated);
});

// 2. Control simulation settings
app.post('/api/crowd/simulation/config', (req, res) => {
  const { speed, isSimulating, totalAttendees } = req.body;
  if (typeof speed === 'number') simulationSpeedFactor = speed;
  if (typeof isSimulating === 'boolean') activeEventIsSimulating = isSimulating;
  if (typeof totalAttendees === 'number') totalAttendeesSimulated = totalAttendees;

  res.json({
    success: true,
    speed: simulationSpeedFactor,
    isSimulating: activeEventIsSimulating,
    totalAttendees: totalAttendeesSimulated,
    message: 'Simulation updated successfully'
  });
});

// 3. Reset state
app.post('/api/crowd/reset', (req, res) => {
  currentPois = JSON.parse(JSON.stringify(initialPois)) as POI[];
  currentIncidents = JSON.parse(JSON.stringify(initialIncidents)) as CrowdIncident[];
  currentAlerts = [...mockAlerts];
  totalAttendeesSimulated = 22250;
  simulationSpeedFactor = 1.0;
  activeEventIsSimulating = true;
  lastStateUpdateTime = Date.now();

  res.json({
    success: true,
    message: 'System simulation dataset reset fully.'
  });
});

// 4. Report new incident (Attendees or Admins)
app.post('/api/crowd/incidents', (req, res) => {
  const { type, title, location, x, y, severity, reportedBy } = req.body;

  if (!type || !title || !location) {
    return res.status(400).json({ error: 'Missing required incident fields: type, title, location' });
  }

  const locationCoords = {
    x: typeof x === 'number' ? x : Math.floor(Math.random() * 80) + 10,
    y: typeof y === 'number' ? y : Math.floor(Math.random() * 80) + 10,
  };

  const newIncident: CrowdIncident = {
    id: `inc-${Date.now()}`,
    type,
    title,
    location,
    coords: locationCoords,
    status: 'active',
    severity: severity || 'medium',
    reportedAt: new Date().toISOString(),
    reportedBy: reportedBy || 'Attendee Portal',
  };

  currentIncidents.unshift(newIncident);

  // Auto-generate system alert for high severity incident
  if (severity === 'high' || severity === 'critical') {
    currentAlerts.unshift({
      id: `al-${Date.now()}`,
      message: `[SECURITY NOTICE] Incident reported: ${title} at ${location}. Approach with caution.`,
      timestamp: new Date().toISOString(),
      level: 'high',
    });
  }

  res.json({
    success: true,
    incident: newIncident,
    message: 'Incident reported and locked into telemetry system.'
  });
});

// 5. Update incident status
app.put('/api/crowd/incidents/:id', (req, res) => {
  const { id } = req.params;
  const { status, severity } = req.body;

  const incident = currentIncidents.find((inc) => inc.id === id);

  if (!incident) {
    return res.status(404).json({ error: 'Incident target not detected.' });
  }

  if (status) incident.status = status;
  if (severity) incident.severity = severity;

  res.json({
    success: true,
    incident,
    message: `Incident ${id} updated successfully.`
  });
});

// 5b. Adjust POI current headcount (e.g., when on-demand transport is deployed to drain exiting crowd)
app.post('/api/crowd/pois/:id/adjust', (req, res) => {
  const { id } = req.params;
  const { delta } = req.body;

  const poi = currentPois.find((p) => p.id === id);

  if (!poi) {
    return res.status(404).json({ error: 'POI not found' });
  }

  poi.currentCount = Math.max(10, poi.currentCount + (delta || 0));
  
  // Re-evaluate status
  const occupancyRate = poi.currentCount / poi.capacity;
  if (occupancyRate > 1.15) {
    poi.status = 'blocked';
  } else if (occupancyRate > 0.95) {
    poi.status = 'congested';
  } else {
    poi.status = 'normal';
  }

  res.json({
    success: true,
    poi,
    message: `POI ${id} headcount adjusted dynamically by ${delta}.`
  });
});

// 6. Broadcast admin safety notifications/alerts
app.post('/api/crowd/broadcast', (req, res) => {
  const { message, level } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Alert broadcast message cannot be empty.' });
  }

  const newAlert = {
    id: `al-${Date.now()}`,
    message,
    timestamp: new Date().toISOString(),
    level: level || 'medium',
  };

  currentAlerts.unshift(newAlert);

  res.json({
    success: true,
    alert: newAlert,
    message: 'Global broadcast dispatched to all safe route terminals.'
  });
});

// 7. Clear alerts
app.delete('/api/crowd/alerts', (req, res) => {
  currentAlerts = [];
  res.json({ success: true, message: 'Broadcast feeds cleared.' });
});

// 8. Gemini AI real-time safety analyzer & routing predictive engine
app.post('/api/predict', async (req, res) => {
  const { userPrompt } = req.body;
  const state = getUpdatedState();

  const gemini = getGenAI();

  if (!gemini) {
    // Generate intelligent simulation fallback in case API key is missing
    const crowdOverview = `Vanguard Arena currently processes ${state.stats.totalAttendees} attendees. Main Stage occupancy runs high at 74% with localized crossover friction adjacent to Central Boulevard. Standard north emergency egress displays low-friction pathways.`;
    return res.json({
      timestamp: new Date().toISOString(),
      summary: `[Simulation Demo Mode] ${crowdOverview} (Gemini Live Mode available once valid API key provided in Secrets).`,
      predictedBottlenecks: [
        {
          locationName: 'Main Stage Crossover Point',
          riskLevel: 'high',
          explanation: 'Heavy food court egress overlapping with back-of-house stage entries.',
        },
        {
          locationName: 'East Restrooms Access Gate',
          riskLevel: 'moderate',
          explanation: 'Surplus crowd from West Stage migrating eastwards over the major thoroughfare.',
        },
      ],
      safetyScore: 82,
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
          routePath: ['Central Boulevard & Food Court', 'East Hydration Point', 'Main South Entrance Gate'],
          safetyJustification: 'Diverts around high-density bottleneck point Alpha by using the spacious East outer track.',
        },
      ],
    });
  }

  try {
    const analysisPrompt = `
      You are the ultimate safety advisor and real-time operations engineer for the CrowdIQ crowd management system at Vanguard Arena & Fest Zone.
      Analyze the current real-time state telemetry:
      - Total Attendees in Venue: ${state.stats.totalAttendees}
      - Event Level Security Alert Status: ${state.stats.activeAlertLevel}
      - Flow Rate: ${state.stats.averageFlowRate} people/min across gates
      - Active Bottlenecks Count: ${state.stats.activeBottlenecks}
      
      Points of Interest status:
      ${JSON.stringify(state.pois.map(p => ({ name: p.name, cap: p.capacity, count: p.currentCount, status: p.status })))}
      
      Active safety incidents:
      ${JSON.stringify(state.incidents.map(i => ({ title: i.title, location: i.location, status: i.status, severity: i.severity })))}

      User Custom Analysis Query (if any): "${userPrompt || 'Provide general safety forecast and optimal emergency evacuation routes.'}"

      Generate a comprehensive crowd safety audit report based on these data points, ensuring structured recommendations and safe route egress suggestions.
    `;

    const response = await gemini.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: analysisPrompt,
      config: {
        systemInstruction: 'You are an elite Crowd Dynamics & Operations AI. Ensure safety warnings are highly analytical, precise, and completely customized with respect to the specific capacity thresholds and layout points provided. Return responses exclusively structured as a JSON block.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING, 
              description: 'Exhaustive operations summary of the crowd dynamics and ongoing security alerts.' 
            },
            predictedBottlenecks: {
              type: Type.ARRAY,
              description: 'Identified congestion bottlenecks or zones posing physical safety hazards.',
              items: {
                type: Type.OBJECT,
                properties: {
                  locationName: { type: Type.STRING },
                  riskLevel: { type: Type.STRING, description: 'low, moderate, high, or severe' },
                  explanation: { type: Type.STRING },
                },
                required: ['locationName', 'riskLevel', 'explanation']
              },
            },
            safetyScore: { 
              type: Type.INTEGER, 
              description: 'Overall safety rating from 1 (uncontrolled panic danger) to 100 (perfectly liquid flows).' 
            },
            actionableRecommendations: {
              type: Type.ARRAY,
              description: 'Crucial tactical instructions for security staff (e.g. dynamic barriers, lane allocation).',
              items: { type: Type.STRING },
            },
            suggestedEgressRoutes: {
              type: Type.ARRAY,
              description: 'Optimized safest egress path solutions routing attendees away from hazardous density zones.',
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.STRING },
                  end: { type: Type.STRING },
                  routePath: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  safetyJustification: { type: Type.STRING },
                },
                required: ['start', 'end', 'routePath', 'safetyJustification']
              },
            },
          },
          required: [
            'summary', 
            'predictedBottlenecks', 
            'safetyScore', 
            'actionableRecommendations', 
            'suggestedEgressRoutes'
          ],
        },
      },
    });

    const responseText = response.text || '{}';
    res.json(JSON.parse(responseText.trim()));

  } catch (error: any) {
    console.error('Gemini prediction error:', error);
    res.status(500).json({
      error: 'Failed to complete analysis via Gemini API.',
      details: error.message,
    });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC FRONTEND SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CrowdIQ Server online at: http://0.0.0.0:${PORT}`);
  });
}

startServer();
