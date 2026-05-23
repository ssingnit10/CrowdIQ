import React, { useState, useMemo } from 'react';
import { POI, EngagementCampaign } from '../types';
import { 
  Plus, 
  HelpCircle, 
  Ticket, 
  Sparkles, 
  Search, 
  Users, 
  TrendingDown, 
  Trash2, 
  Megaphone,
  Gamepad2,
  Navigation,
  ArrowRight,
  Gift,
  BarChart2,
  TrendingUp,
  Activity,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface CrowdEngagementPanelProps {
  pois: POI[];
  campaigns: EngagementCampaign[];
  onDispatchCampaign: (campaign: Omit<EngagementCampaign, 'id' | 'timestamp' | 'participationCount' | 'status'>) => void;
  onTerminateCampaign: (campaignId: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-xl">
        <p className="text-[9px] font-mono font-bold text-slate-400 mb-1">
          Time: {label}
        </p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.stroke }} />
              <span className="text-slate-300 truncate max-w-[120px]">{p.name.split(' (')[0]}</span>
              <span className="font-mono font-bold text-white ml-auto">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function CrowdEngagementPanel({
  pois,
  campaigns,
  onDispatchCampaign,
  onTerminateCampaign
}: CrowdEngagementPanelProps) {
  const [type, setType] = useState<EngagementCampaign['type']>('quiz');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetPoiId, setTargetPoiId] = useState('');
  const [redirectPoiId, setRedirectPoiId] = useState('');
  const [rewardValue, setRewardValue] = useState('+100 RFID Coins & Free Drink');

  // Export current participation trend data to CSV for offline reporting
  const handleExportCSV = () => {
    if (campaigns.length === 0) return;
    const campaignTitles = campaigns.map(c => c.title);
    const headers = ['Time Offset', 'Total Dispersed', ...campaignTitles];
    
    const csvRows = [];
    // Header row with double quotes escaping
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    
    // Data rows matching dynamic chartData coordinates
    chartData.forEach(row => {
      const values = headers.map(header => {
        let val = '';
        if (header === 'Time Offset') {
          val = row.time;
        } else if (header === 'Total Dispersed') {
          val = String(row['Total Dispersed'] || 0);
        } else {
          val = String(row[header] !== undefined ? row[header] : 0);
        }
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `crowd_dispersal_trend_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate historical trend data over the last hour (60 minutes in 10-minute steps)
  const chartData = useMemo(() => {
    const timeLabels = ['-60m', '-50m', '-40m', '-30m', '-20m', '-10m', 'Now'];
    const factors = [0.15, 0.32, 0.48, 0.65, 0.78, 0.90, 1.0];
    
    return timeLabels.map((label, idx) => {
      const item: any = { time: label };
      let totalDispersed = 0;
      
      campaigns.forEach(c => {
        const count = c.participationCount || 0;
        const value = Math.round(count * factors[idx]);
        item[c.title] = value;
        totalDispersed += value;
      });
      
      item['Total Dispersed'] = totalDispersed;
      return item;
    });
  }, [campaigns]);

  // Suggest default presets depending on selected campaign type
  const handleTypeSelect = (selectedType: EngagementCampaign['type']) => {
    setType(selectedType);
    if (selectedType === 'quiz') {
      setTitle('Vanguard Arena Trivia Brawl!');
      setDescription('Quick: Solve our live 3-question trivia challenge. Walk over to East Oasis Lounge to scan your prize QR!');
      setRewardValue('+150 RFID Loot & Free Cooler');
    } else if (selectedType === 'discount') {
      setTitle('Flash 50% Munchies Voucher');
      setDescription('Main Boulevard is packed! Grab a 50% discount code valid for the next 20 minutes specifically at the Quiet East Hydration Refresh Bar!');
      setRewardValue('50% Off Total Snack Voucher');
    } else if (selectedType === 'lightshow') {
      setTitle('Synchronized Cosmic Neon Wave');
      setDescription('Initiating an interactive crowd flash show! Move outside Vanguard Dome and hold up your phones to synchronize live festival frequencies.');
      setRewardValue('Collectible Aura Badge');
    } else if (selectedType === 'hunt') {
      setTitle('East Oasis Mystery Geocaching Loot');
      setDescription('We just hid a physical Golden Ticket near East Oasis. Follow the clues and tap your NFC band to claim your VIP wristband!');
      setRewardValue('VIP Wristband Upgrade');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetPoiId) return;

    const targetPoi = pois.find(p => p.id === targetPoiId);
    const redirectPoi = pois.find(p => p.id === redirectPoiId);

    if (!targetPoi) return;

    onDispatchCampaign({
      type,
      title,
      description,
      targetPoiId,
      targetPoiName: targetPoi.name,
      redirectPoiId: redirectPoiId || undefined,
      redirectPoiName: redirectPoi ? redirectPoi.name : undefined,
      rewardValue
    });

    // Clear and reset
    setTitle('');
    setDescription('');
    setTargetPoiId('');
    setRedirectPoiId('');
  };

  const congestedPois = pois.filter(p => p.status === 'congested' || p.status === 'blocked');
  const relaxedPois = pois.filter(p => p.status === 'normal');

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-emerald-700 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Crowd Engagement Directives
            </h4>
            <p className="text-[10px] text-slate-400">Deploy real-time incentive games to dynamically disperse high densities</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Overcrowding alert warnings with smart prompt triggers */}
        {congestedPois.length > 0 && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest block mb-1">
              ⚠️ Congestion Recommendation Engine
            </span>
            <p className="text-[11px] text-slate-600 leading-normal">
              High density detected at <strong className="text-amber-800">{congestedPois[0].name}</strong> ({((congestedPois[0].currentCount / congestedPois[0].capacity) * 100).toFixed(0)}% load). Take immediate tactical action by deploying a redirect campaign target to a relaxed area like <strong className="text-emerald-700">{relaxedPois[0]?.name || 'East Oasis'}</strong>.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  setTargetPoiId(congestedPois[0].id);
                  if (relaxedPois.length > 0) {
                    setRedirectPoiId(relaxedPois[0].id);
                  }
                  handleTypeSelect('discount');
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200/50 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Auto-Configure Redirect Promotion
              </button>
            </div>
          </div>
        )}

        {/* Campaign Creator form */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-2.5xl border border-slate-100 space-y-3.5">
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Configure Live Crowd Lure Campaign
          </h5>

          {/* Select Type Pills */}
          <div>
            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1.5 label-campaign">Select Engagement Core</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['quiz', 'discount', 'lightshow', 'hunt'] as const).map((t) => {
                const isSel = type === t;
                const getIcon = () => {
                  switch(t) {
                    case 'quiz': return <HelpCircle className="w-3.5 h-3.5" />;
                    case 'discount': return <Ticket className="w-3.5 h-3.5" />;
                    case 'lightshow': return <Sparkles className="w-3.5 h-3.5 animate-pulse" />;
                    case 'hunt': return <Search className="w-3.5 h-3.5" />;
                  }
                };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeSelect(t)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                      isSel 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {getIcon()}
                    <span className="capitalize mt-1 text-[9px]">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Target Congested Sector</label>
              <select
                required
                value={targetPoiId}
                onChange={(e) => setTargetPoiId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- Select Overfilled POI --</option>
                {pois.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currentCount} / {p.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Incentivized Safe Redirect Sector</label>
              <select
                value={redirectPoiId}
                onChange={(e) => setRedirectPoiId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- No Redirection (Keep at Zone) --</option>
                {relaxedPois.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Relaxed - {p.currentCount} cap)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Campaign Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. Trivia Brawl!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Guaranteed Participant Reward</label>
              <input
                type="text"
                required
                placeholder="e.g. Free dynamic drink voucher..."
                value={rewardValue}
                onChange={(e) => setRewardValue(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Interactive Instruction Message</label>
            <textarea
              required
              rows={2}
              placeholder="Provide a clear description with instructions urging crowds to dynamically shift locations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 text-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-200/50"
          >
            <Megaphone className="w-4 h-4 animate-pulse" />
            Dispatch Tactical Engagement Campaign
          </button>
        </form>

        {/* DISPERSAL EFFECTIVENESS ANALYTICS TRENDS */}
        <div className="bg-slate-50 p-4 rounded-2.5xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between col-span-full">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h5 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Dispersal Effectiveness Analytics
              </h5>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                disabled={campaigns.length === 0}
                className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded shadow-xs focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                title="Export Chart Data to CSV"
              >
                <Download className="w-3 h-3" />
                <span>Export Data</span>
              </button>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] font-mono text-slate-400 font-semibold uppercase">Live Feed</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            Visualizes dynamic attendee response times and cumulative redirection counts towards low-density safe zones over the last hour.
          </p>

          {campaigns.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-xl text-slate-400 space-y-1">
              <BarChart2 className="w-7 h-7 text-slate-300 stroke-[1.5]" />
              <span className="text-[10px] font-mono text-center">No active campaign metrics to plot trend</span>
            </div>
          ) : (
            <div className="bg-white p-2.5 rounded-xl border border-slate-100/80">
              <div className="h-[180px] w-full text-[10px]" style={{ minWidth: 100 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="time" 
                      tickLine={false} 
                      axisLine={false}
                      stroke="#94a3b8" 
                      style={{ fontSize: '9px', fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      stroke="#94a3b8"
                      style={{ fontSize: '9px', fontFamily: 'monospace' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Primary Cumulative Total Area */}
                    <Area
                      type="monotone"
                      dataKey="Total Dispersed"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="url(#colorTotal)"
                      name="Total Redirected"
                    />

                    {/* Dynamic per-campaign flow curves */}
                    {campaigns.map((c, i) => {
                      const colors = [
                        { stroke: '#6366f1' }, // Indigo
                        { stroke: '#f59e0b' }, // Amber
                        { stroke: '#a855f7' }, // Purple
                        { stroke: '#06b6d4' }, // Cyan
                        { stroke: '#ec4899' }  // Pink
                      ];
                      const color = colors[i % colors.length];
                      return (
                        <Area
                          key={c.id}
                          type="monotone"
                          dataKey={c.title}
                          stroke={color.stroke}
                          fill="none"
                          strokeWidth={1.5}
                          name={c.title}
                        />
                      );
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic Legend footer */}
              <div className="mt-2 text-center flex flex-wrap gap-x-3 gap-y-1.5 items-center justify-center border-t border-slate-50 pt-2.5">
                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                  <span className="w-2.5 h-0.5 border-t-2 border-dashed border-emerald-500" />
                  <span>Cumulative Redirection</span>
                </div>
                {campaigns.map((c, i) => {
                  const colors = ['bg-indigo-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500', 'bg-pink-500'];
                  const colorClass = colors[i % colors.length];
                  return (
                    <div key={c.id} className="flex items-center gap-1 text-[9px] font-mono text-slate-400 max-w-[120px] truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
                      <span className="truncate">{c.title.split(' (')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* List of active campaigns */}
        <div className="space-y-3">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
            Monitor Active Campaign Dispatches
          </span>

          {campaigns.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              No live redirection campaigns dispatched. Crowd is navigating without incentives.
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {campaigns.map((c) => {
                const getCampaignTypeBadge = () => {
                  switch(c.type) {
                    case 'quiz':
                      return <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase font-mono">
                        <HelpCircle className="w-3 h-3" /> Trivia Live
                      </span>;
                    case 'discount':
                      return <span className="bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase font-mono">
                        <Ticket className="w-3 h-3" /> Voucher
                      </span>;
                    case 'lightshow':
                      return <span className="bg-purple-50 border border-purple-200 text-purple-700 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase font-mono">
                        <Sparkles className="w-3 h-3" /> Light show
                      </span>;
                    case 'hunt':
                      return <span className="bg-teal-50 border border-teal-200 text-teal-700 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase font-mono">
                        <Search className="w-3 h-3" /> Scavenger
                      </span>;
                  }
                };

                return (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getCampaignTypeBadge()}
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[10px] font-bold text-emerald-600 font-mono uppercase">ACTIVE</span>
                      </div>
                      <button
                        onClick={() => onTerminateCampaign(c.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Force Terminate Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h6 className="font-extrabold text-slate-800 text-xs mb-1 font-sans">{c.title}</h6>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3.5">{c.description}</p>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Targeting:</span>
                        <span className="font-bold text-rose-600">{c.targetPoiName.split(' (')[0]}</span>
                      </div>
                      {c.redirectPoiName && (
                        <div className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className="text-slate-400">Rerouting:</span>
                          <span className="font-bold text-emerald-600">{c.redirectPoiName.split(' (')[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono bg-indigo-50/40 p-2 rounded-xl border border-indigo-100/50">
                      <div className="flex items-center gap-1.5 text-indigo-700">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-bold">{c.participationCount}</span>
                        <span>Attendees Engaged</span>
                      </div>
                      <span className="text-[9.5px] font-extrabold text-indigo-600 font-sans bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Gift className="w-3 h-3" /> {c.rewardValue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
