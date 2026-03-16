import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  History, 
  PlusCircle, 
  FileText, 
  Mail, 
  Settings, 
  User, 
  LogOut,
  Bell,
  Search,
  Filter,
  Download,
  Activity,
  MapPin,
  Clock,
  CheckCircle,
  Upload,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Trash2,
  Lock,
  Camera,
  Image,
  X
} from 'lucide-react';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total_logs: 0, open_issues: 0, resolved_today: 0, avg_resolution_min: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [period, setPeriod] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const ws = useRef(null);
  const [user, setUser] = useState({ username: 'Admin', role: 'Admin' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchLogs();
      fetchStats();
      setupWebSocket();
    }
    return () => ws.current?.close();
  }, [period, token]);

  const setupWebSocket = () => {
    ws.current = new WebSocket(`ws://${window.location.host}/api/ws`);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(prev => [data, ...prev].slice(0, 5));
      fetchLogs();
      fetchStats();
    };
  };

  const fetchLogs = async () => {
    const res = await fetch(`/api/faults/?period=${period}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) logout();
    const data = await res.json();
    setLogs(data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/stats/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setStats(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    window.location.reload();
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/faults/${selectedLogId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ password: deletePassword })
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setDeletePassword('');
        setDeleteError('');
        fetchLogs();
        fetchStats();
      } else {
        const data = await res.json();
        setDeleteError(data.detail || 'Failed to delete log');
      }
    } catch (err) {
      setDeleteError('Connection error');
    }
  };

  const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isOn, setIsOn] = useState(false);
    const cordBeadRef = useRef(null);
    const cordLineRef = useRef(null);
    const hitAreaRef = useRef(null);
    const lampBodyRef = useRef(null);

    useEffect(() => {
      // @ts-ignore - Suppress environment-specific filename casing warning for dynamic imports on Windows
      import('gsap').then(({ gsap }) => {
        // @ts-ignore
        import('gsap/Draggable').then(({ Draggable }) => {
          gsap.registerPlugin(Draggable);

          const clickSound = new Audio("https://assets.codepen.io/605876/click.mp3");

          Draggable.create(hitAreaRef.current, {
            type: "y",
            bounds: { minY: 0, maxY: 60 },
            onDrag: function() {
              gsap.set(cordBeadRef.current, { y: this.y });
              gsap.set(cordLineRef.current, { attr: { y2: 180 + this.y } });
            },
            onRelease: function() {
              if (this.y > 30) {
                setIsOn(prev => {
                  const newState = !prev;
                  clickSound.play().catch(() => {}); // Catch browser block
                  return newState;
                });
              }
              
              gsap.to([cordBeadRef.current, hitAreaRef.current], { y: 0, duration: 0.5, ease: "back.out(2.5)" });
              gsap.to(cordLineRef.current, { attr: { y2: 180 }, duration: 0.5, ease: "back.out(2.5)" });
            }
          });
        });
      });
    }, []);

    const handleLogin = async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch('/api/token', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
      } else {
        setError('Invalid credentials');
      }
    };

    return (
      <div className="lamp-login-body" data-on={isOn} style={{ '--lamp-on': isOn ? 1 : 0 }}>
        <div className="lamp-container-wrapper">
          <div className="lamp-wrapper">
            <svg className="lamp-svg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
              <ellipse className="inner-glow-path" cx="100" cy="110" rx="60" ry="30" />
              <rect className="lamp-base-path" x="92" y="100" width="16" height="160" rx="8" />
              <rect className="lamp-base-path" x="60" y="250" width="80" height="12" rx="6" />
              <g className="pull-cord">
                <line ref={cordLineRef} className="cord-line" x1="130" y1="110" x2="130" y2="180" />
                <circle ref={cordBeadRef} className="cord-bead" cx="130" cy="190" r="6" />
                <circle ref={hitAreaRef} className="cord-hit" cx="130" cy="190" r="25" fill="transparent" />
              </g>
              <path className="lamp-shade-path" d="M30 110 C 30 50, 170 50, 170 110 C 170 125, 30 125, 30 110 Z" />
            </svg>
          </div>

          <div className={`login-form-lamp ${isOn ? 'active' : ''}`}>
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="w-12 h-12 relative bg-transparent flex items-center justify-center p-1">
                {/* Subtle glow behind logo that matches lamp glow */}
                <div className="absolute inset-0 bg-accent-gold/20 blur-xl rounded-full opacity-50"></div>
                <img src="/logo.png" alt="BCC" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter" style={{ margin: 0 }}>City Of Bulawayo</h2>
              </div>
            </div>
            
            <form onSubmit={handleLogin}>
              <div className="lamp-form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. j.doe" 
                  required
                />
              </div>
              <div className="lamp-form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                />
              </div>
              {error && <p className="text-accent-red text-[10px] font-bold text-center mb-4">{error}</p>}
              <button className="lamp-login-btn">SIGN IN</button>
            </form>
            <p className="text-[9px] text-center text-text-muted uppercase tracking-widest mt-6 border-t border-white/5 pt-4">
              Protected Municipal Infrastructure
            </p>
          </div>
        </div>
        
        {!isOn && (
          <div className="lamp-hint animate-pulse">
            Pull string to light the desk
          </div>
        )}
      </div>
    );
  };

  const Sidebar = () => (
    <div className="w-72 h-screen sidebar flex flex-col p-6 fixed left-0 top-0">
      <div className="flex flex-col items-center gap-3 mb-10 px-2 text-center">
        <div className="w-24 h-24 bg-transparent flex items-center justify-center p-1 drop-shadow-sm">
          <img src="/logo.png" alt="BCC Crest" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white leading-tight">BCC NIMS</h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-accent-gold font-bold">IT Operations Desk</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={20} /> <span>Operations Dashboard</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          <AlertTriangle size={20} /> <span>Active Outages</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={20} /> <span>Incident Archive</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={20} /> <span>ISP Analytics</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <Activity size={20} /> <span>Management Reports</span>
        </div>
        <div className={`sidebar-item ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
          <Mail size={20} /> <span>Management Alerts</span>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold">
            <User size={20} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user.username}</p>
            <p className="text-xs text-accent-teal truncate">{user.role}</p>
          </div>
          <LogOut className="text-text-muted cursor-pointer hover:text-accent-red" size={18} onClick={logout} />
        </div>
      </div>
    </div>
  );

  const handleExport = (p) => {
    window.open(`/api/export/xlsx?period=${p}`, '_blank');
  };

  // ISP Analytics - KPI dashboard + Word export
  const AnalyticsView = () => {
    const fmtPct = (n, digits = 1) => `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;
    const fmtInt = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString() : '0');
    const startOfDayUtc = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const addDaysUtc = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
    const dayKeyUtc = (d) => startOfDayUtc(d).toISOString().slice(0, 10);

    const buildDailySeries = (faults, daysBack, predicate) => {
      const end = startOfDayUtc(new Date());
      const start = addDaysUtc(end, -(daysBack - 1));
      const bins = new Map();
      for (let i = 0; i < daysBack; i++) bins.set(dayKeyUtc(addDaysUtc(start, i)), 0);
      for (const f of faults) {
        const created = new Date(f.created_at);
        if (Number.isNaN(created.getTime())) continue;
        const k = dayKeyUtc(created);
        if (!bins.has(k)) continue;
        if (predicate && !predicate(f)) continue;
        bins.set(k, (bins.get(k) || 0) + 1);
      }
      return Array.from(bins.values());
    };

    const topN = (arr, n = 5) => arr.slice().sort((a, b) => b.value - a.value).slice(0, n);

    const Sparkline = ({ a = [], b = [], height = 86 }) => {
      const w = 260;
      const h = height;
      const pad = 6;
      const all = [...a, ...b].filter((v) => Number.isFinite(v));
      const min = all.length ? Math.min(...all) : 0;
      const max = all.length ? Math.max(...all) : 1;
      const scaleX = (i, n) => pad + (n <= 1 ? 0 : (i / (n - 1)) * (w - pad * 2));
      const scaleY = (v) => {
        if (max === min) return h / 2;
        const t = (v - min) / (max - min);
        return pad + (1 - t) * (h - pad * 2);
      };
      const pathFor = (arr) => {
        if (!arr.length) return '';
        return arr.map((v, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(idx, arr.length).toFixed(2)} ${scaleY(v).toFixed(2)}`).join(' ');
      };

      return (
        <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={`M ${pad} ${h - pad} L ${w - pad} ${h - pad}`} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <path d={pathFor(a)} fill="none" stroke="rgba(127,191,179,0.22)" strokeWidth="10" opacity="0.6" />
          <path d={pathFor(b)} fill="none" stroke="rgba(198,167,92,0.18)" strokeWidth="10" opacity="0.55" />
          <path d={pathFor(b)} fill="none" stroke="rgba(198,167,92,0.9)" strokeWidth="2" />
          <path d={pathFor(a)} fill="none" stroke="rgba(127,191,179,0.95)" strokeWidth="2.2" />
        </svg>
      );
    };

    const Gauge = ({ value = 0 }) => {
      const v = Math.max(0, Math.min(100, Number(value) || 0));
      const r = 44;
      const c = 2 * Math.PI * r;
      const offset = c * (1 - v / 100);
      return (
        <div className="kpi-gauge">
          <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(127,191,179,1)" />
                <stop offset="55%" stopColor="rgba(198,167,92,1)" />
                <stop offset="100%" stopColor="rgba(193,18,31,1)" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
            <circle
              cx="60"
              cy="60"
              r={r}
              stroke="url(#g)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
            />
            <circle cx="60" cy="60" r="2.5" fill="rgba(255,255,255,0.35)" />
          </svg>
          <div className="kpi-gaugeValue">{v.toFixed(1)}%</div>
        </div>
      );
    };

    const StatRow = ({ label, value }) => (
      <div className="kpi-row">
        <span className="kpi-rowLabel">{label}</span>
        <span className="kpi-rowValue">{value}</span>
      </div>
    );

    const [loading, setLoading] = useState(true);
    const [payload, setPayload] = useState(null);

    useEffect(() => {
      let mounted = true;
      Promise.all([
        fetch('/api/chart-data/', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/faults/?period=month', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      ]).then(([chartData, faults]) => {
        if (!mounted) return;

        const allFaults = Array.isArray(faults) ? faults : [];
        const isps = (chartData?.isps || []).slice();

        const now = new Date();
        const cutoff7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last7 = allFaults.filter((f) => {
          const t = new Date(f.created_at);
          return !Number.isNaN(t.getTime()) && t >= cutoff7;
        });
        const last7Resolved = last7.filter((f) => f.status === 'Resolved');
        const last7Critical = last7.filter((f) => f.severity === 'Critical');
        const last7SlaBreaches = last7.filter((f) => !!f.is_sla_breach);

        const avgResolveMin = (() => {
          const resolved = last7.filter((f) => f.status === 'Resolved' && f.resolved_at);
          const mins = resolved.map((f) => {
            const a = new Date(f.created_at).getTime();
            const b = new Date(f.resolved_at).getTime();
            if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
            return (b - a) / (60 * 1000);
          }).filter((v) => v !== null);
          if (!mins.length) return 0;
          return mins.reduce((x, y) => x + y, 0) / mins.length;
        })();

        const resolutionRate7 = last7.length ? (last7Resolved.length / last7.length) * 100 : 0;
        const breachRate7 = last7.length ? (last7SlaBreaches.length / last7.length) * 100 : 0;
        const locationsAffected7 = new Set(last7.map((f) => f.location).filter(Boolean)).size;

        const series28 = buildDailySeries(allFaults, 28);
        const seriesCurr14 = series28.slice(14);
        const seriesPrev14 = series28.slice(0, 14);
        const seriesCritical28 = buildDailySeries(allFaults, 28, (f) => f.severity === 'Critical');
        const seriesCriticalCurr14 = seriesCritical28.slice(14);
        const seriesCriticalPrev14 = seriesCritical28.slice(0, 14);

        const byLocation = (() => {
          const m = new Map();
          for (const f of last7) m.set(f.location || 'Unknown', (m.get(f.location || 'Unknown') || 0) + 1);
          return topN(Array.from(m.entries()).map(([k, v]) => ({ key: k, value: v })), 5);
        })();

        const byType = (() => {
          const m = new Map();
          for (const f of last7) m.set(f.fault_type || 'Unknown', (m.get(f.fault_type || 'Unknown') || 0) + 1);
          return topN(Array.from(m.entries()).map(([k, v]) => ({ key: k, value: v })), 5);
        })();

        const byIsp = (() => {
          const m = new Map();
          for (const f of last7) m.set(f.isp_name || 'Unknown', (m.get(f.isp_name || 'Unknown') || 0) + 1);
          return Array.from(m.entries()).map(([k, v]) => ({ key: k, value: v }))
            .sort((a, b) => b.value - a.value);
        })();

        setPayload({
          isps,
          last7: {
            total: last7.length,
            resolved: last7Resolved.length,
            critical: last7Critical.length,
            resolutionRate: resolutionRate7,
            breachRate: breachRate7,
            avgResolveMin,
            locationsAffected: locationsAffected7
          },
          series: {
            faultsCurr14: seriesCurr14,
            faultsPrev14: seriesPrev14,
            critCurr14: seriesCriticalCurr14,
            critPrev14: seriesCriticalPrev14
          },
          by: { location: byLocation, type: byType, isp: byIsp }
        });

        setLoading(false);
      }).catch(() => setLoading(false));

      return () => { mounted = false; };
    }, []);

    return (
      <div className="space-y-8 animate-in fade-in duration-500 kpi-board">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">ISP Efficiency Analysis</h2>
            <p className="text-xs text-text-muted mt-1">Live performance breakdown - Powertel vs Starlink</p>
          </div>
          <a
            href="/api/export/isp-report"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all"
          >
            <Download size={16} /> Download Word Report
          </a>
        </div>

        {loading || !payload ? (
          <div className="glass-card p-8 text-sm text-text-muted">Loading analytics...</div>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card kpi-span-4">
                <div className="kpi-head">
                  <div>
                    <div className="kpi-title">Faults</div>
                    <div className="kpi-value">{fmtInt(payload.last7.total)}</div>
                    <div className="kpi-sub">past 7 days</div>
                  </div>
                  <div className="kpi-pill">past 14 vs prev 14</div>
                </div>
                <Sparkline a={payload.series.faultsCurr14} b={payload.series.faultsPrev14} />
                <div className="kpi-legend">
                  <span><i className="kpi-dot kpi-dotA" />past 14 days</span>
                  <span><i className="kpi-dot kpi-dotB" />prev 14 days</span>
                </div>
              </div>

              <div className="kpi-card kpi-span-4">
                <div className="kpi-head">
                  <div>
                    <div className="kpi-title">Resolution rate</div>
                    <div className="kpi-value">{fmtPct(payload.last7.resolutionRate, 1)}</div>
                    <div className="kpi-sub">7 day average</div>
                  </div>
                  {payload.last7.resolutionRate < 70 && (
                    <div className="kpi-alert" title="Below target resolution rate">
                      <span className="kpi-alertDot" />!
                    </div>
                  )}
                </div>
                <div className="kpi-split">
                  <div className="kpi-mini">
                    <div className="kpi-miniLabel">Resolved</div>
                    <div className="kpi-miniValue">{fmtInt(payload.last7.resolved)}</div>
                  </div>
                  <div className="kpi-mini">
                    <div className="kpi-miniLabel">Open/other</div>
                    <div className="kpi-miniValue">{fmtInt(payload.last7.total - payload.last7.resolved)}</div>
                  </div>
                  <div className="kpi-mini">
                    <div className="kpi-miniLabel">Locations</div>
                    <div className="kpi-miniValue">{fmtInt(payload.last7.locationsAffected)}</div>
                  </div>
                </div>
                <div className="kpi-footNote">Goal: keep resolution rate above 80%.</div>
              </div>

              <div className="kpi-card kpi-span-4">
                <div className="kpi-head">
                  <div>
                    <div className="kpi-title">Critical faults</div>
                    <div className="kpi-value">{fmtInt(payload.last7.critical)}</div>
                    <div className="kpi-sub">past 7 days</div>
                  </div>
                  <div className="kpi-pill kpi-pillRed">priority</div>
                </div>
                <Sparkline a={payload.series.critCurr14} b={payload.series.critPrev14} />
                <div className="kpi-legend">
                  <span><i className="kpi-dot kpi-dotA" />past 14 days</span>
                  <span><i className="kpi-dot kpi-dotB" />prev 14 days</span>
                </div>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card kpi-span-8">
                <div className="kpi-titleRow">
                  <h3 className="kpi-sectionTitle">By ISP (past 7 days)</h3>
                  <div className="kpi-hint">Recent counts + resolution rates</div>
                </div>
                <div className="kpi-table">
                  {payload.isps.map((isp) => (
                    <div key={isp.name} className="kpi-row kpi-rowHover">
                      <span className="kpi-rowLabel">{isp.name}</span>
                      <span className="kpi-rowMeta">
                        <span className="kpi-chip">{fmtInt(isp.total_faults)} total</span>
                        <span className="kpi-chip kpi-chipTeal">{fmtInt(isp.resolved)} resolved</span>
                        <span className="kpi-chip kpi-chipRed">{fmtInt(isp.critical)} critical</span>
                      </span>
                      <span className="kpi-rowValue">{fmtPct(isp.resolution_rate, 1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kpi-card kpi-span-4">
                <h3 className="kpi-sectionTitle">SLA breach rate - 7 day</h3>
                <div className="kpi-gaugeWrap">
                  <Gauge value={payload.last7.breachRate} />
                  <div className="kpi-gaugeMeta">
                    <StatRow label="Breaches" value={fmtInt(Math.round((payload.last7.breachRate / 100) * payload.last7.total))} />
                    <StatRow label="Total faults" value={fmtInt(payload.last7.total)} />
                    <StatRow label="Avg MTTR" value={`${fmtInt(payload.last7.avgResolveMin)} min`} />
                  </div>
                </div>
                <div className="kpi-footNote">Based on `is_sla_breach` flags in logs.</div>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card kpi-span-4">
                <h3 className="kpi-sectionTitle">By location</h3>
                <div className="kpi-table">
                  {payload.by.location.map((r) => (
                    <div key={r.key} className="kpi-row kpi-rowHover">
                      <span className="kpi-rowLabel">{r.key}</span>
                      <span className="kpi-rowValue">{fmtInt(r.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kpi-card kpi-span-4">
                <h3 className="kpi-sectionTitle">By fault type</h3>
                <div className="kpi-table">
                  {payload.by.type.map((r) => (
                    <div key={r.key} className="kpi-row kpi-rowHover">
                      <span className="kpi-rowLabel">{r.key}</span>
                      <span className="kpi-rowValue">{fmtInt(r.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kpi-card kpi-span-4">
                <h3 className="kpi-sectionTitle">Operational snapshot</h3>
                <div className="kpi-split">
                  <div className="kpi-mini">
                    <div className="kpi-miniLabel">Avg resolve</div>
                    <div className="kpi-miniValue">{fmtInt(payload.last7.avgResolveMin)}m</div>
                  </div>
                  <div className="kpi-mini">
                    <div className="kpi-miniLabel">Critical</div>
                    <div className="kpi-miniValue">{fmtInt(payload.last7.critical)}</div>
                  </div>
                  <div className="kpi-mini">
                    <div className="kpi-miniLabel">Locations</div>
                    <div className="kpi-miniValue">{fmtInt(payload.last7.locationsAffected)}</div>
                  </div>
                </div>
                <div className="kpi-footNote">Management-ready KPI block.</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const AlertsView = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ tier: 'CRITICAL', email: '', is_enabled: true });

    const loadRules = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/notification-rules/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) logout();
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Failed to load rules');
        }
        const data = await res.json();
        setRules(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.message || 'Failed to load rules');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => { loadRules(); }, []);

    const addRule = async () => {
      setError('');
      const email = (form.email || '').trim();
      const tier = (form.tier || '').trim().toUpperCase();
      if (!email) return setError('Email is required');
      if (!['INFO', 'WARNING', 'CRITICAL'].includes(tier)) return setError('Tier must be INFO, WARNING, or CRITICAL');

      try {
        const res = await fetch('/api/notification-rules/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tier, email, is_enabled: true })
        });
        if (res.status === 401) logout();
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Failed to create rule');
        }
        setForm((p) => ({ ...p, email: '' }));
        await loadRules();
      } catch (e) {
        setError(e?.message || 'Failed to create rule');
      }
    };

    const toggleRule = async (rule) => {
      setError('');
      try {
        const res = await fetch(`/api/notification-rules/${rule.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ is_enabled: !rule.is_enabled })
        });
        if (res.status === 401) logout();
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Failed to update rule');
        }
        await loadRules();
      } catch (e) {
        setError(e?.message || 'Failed to update rule');
      }
    };

    const deleteRule = async (id) => {
      setError('');
      try {
        const res = await fetch(`/api/notification-rules/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) logout();
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || 'Failed to delete rule');
        }
        await loadRules();
      } catch (e) {
        setError(e?.message || 'Failed to delete rule');
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Management Alerts</h2>
            <p className="text-xs text-text-muted mt-1">Configure who gets emailed when outages are logged (INFO/WARNING/CRITICAL).</p>
          </div>
        </div>

        {error && (
          <div className="glass-card p-4 border border-accent-red/30" style={{ background: 'rgba(193,18,31,0.08)' }}>
            <p className="text-sm font-bold text-accent-red">{error}</p>
          </div>
        )}

        <div className="kpi-grid">
          <div className="glass-card p-8 kpi-span-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-muted mb-6">Add Recipient</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Tier</label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value }))}
                  className="w-full bg-[#1e293b] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:border-accent-gold outline-none transition-all"
                >
                  <option value="INFO">INFO (IT Team)</option>
                  <option value="WARNING">WARNING (IT + HOD)</option>
                  <option value="CRITICAL">CRITICAL (Upper Management)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-[#1e293b] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:border-accent-gold outline-none transition-all"
                  placeholder="name@citybyo.co.zw"
                />
              </div>

              <button
                onClick={addRule}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all"
              >
                Add Recipient
              </button>

              <div className="text-xs text-text-muted">
                Severity mapping: Minor - INFO, Major - WARNING, Critical - CRITICAL.
              </div>
            </div>
          </div>

          <div className="glass-card p-8 kpi-span-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Recipients</h3>
              <button
                onClick={loadRules}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-text-muted">Loading...</p>
            ) : rules.length === 0 ? (
              <p className="text-sm text-text-muted">No recipients configured yet.</p>
            ) : (
              <div className="kpi-table">
                {rules.map((r) => (
                  <div key={r.id} className="kpi-row kpi-rowHover">
                    <span className="kpi-rowLabel">{r.email}</span>
                    <span className="kpi-rowMeta">
                      <span className="kpi-chip">{r.tier}</span>
                      <span className={`kpi-chip ${r.is_enabled ? 'kpi-chipTeal' : ''}`}>{r.is_enabled ? 'enabled' : 'disabled'}</span>
                    </span>
                    <span className="flex gap-2">
                      <button
                        onClick={() => toggleRule(r)}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white transition-all"
                        title="Enable/Disable"
                      >
                        {r.is_enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteRule(r.id)}
                        className="px-3 py-2 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 rounded-lg text-accent-red transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Cards & Interactive Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Day Logs Interactive Button */}
        <div className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-accent-red group hover:border-accent-red/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Day logs</span>
            <AlertTriangle className="text-accent-red" size={24} />
          </div>
          <span className="text-4xl font-black text-white">{stats.day_logs_count}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPeriod('day')}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/5"
            >
              VIEW DATA
            </button>
            <button 
              onClick={() => handleExport('day')}
              className="px-3 py-2 bg-accent-red/10 hover:bg-accent-red/20 rounded-lg text-accent-red transition-all border border-accent-red/20"
              title="Download Excel"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Weekly Logs Interactive Button */}
        <div className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-accent-teal group hover:border-accent-teal/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Weekly logs</span>
            <CheckCircle className="text-accent-teal" size={24} />
          </div>
          <span className="text-4xl font-black text-white">{stats.week_logs_count}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPeriod('week')}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/5"
            >
              VIEW DATA
            </button>
            <button 
              onClick={() => handleExport('week')}
              className="px-3 py-2 bg-accent-teal/10 hover:bg-accent-teal/20 rounded-lg text-accent-teal transition-all border border-accent-teal/20"
              title="Download Excel"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Monthly Logs Interactive Button */}
        <div className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-primary-blue group hover:border-primary-blue/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Monthly logs</span>
            <History className="text-primary-blue" size={24} />
          </div>
          <span className="text-4xl font-black text-white">{stats.month_logs_count}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPeriod('month')}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/5"
            >
              VIEW DATA
            </button>
            <button 
              onClick={() => handleExport('month')}
              className="px-3 py-2 bg-primary-blue/10 hover:bg-primary-blue/20 rounded-lg text-primary-blue transition-all border border-primary-blue/20"
              title="Download Excel"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* ISP Analytics Button Card — same size as other 3 cards */}
        <div
          className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-accent-gold group hover:border-accent-gold/40 transition-all cursor-pointer"
          onClick={() => setActiveTab('analytics')}
        >
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">ISP Analytics</span>
            <BarChart3 className="text-accent-gold" size={24} />
          </div>
          <span className="text-4xl font-black text-white">View</span>
          <button
            className="w-full py-2 bg-accent-gold/10 hover:bg-accent-gold/20 rounded-lg text-[10px] font-black text-accent-gold uppercase tracking-widest transition-all border border-accent-gold/20"
          >
            OPEN DASHBOARD
          </button>
        </div>
      </div>

      {/* Main Operational Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-accent-teal" size={20} />
              Live Incident Feed
            </h3>
            <button 
              onClick={() => setShowAddModal(true)}
              className="premium-button-red flex items-center gap-2 text-sm"
            >
              <PlusCircle size={18} /> LOG INCIDENT
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-[0.1em]">
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Logged</th>
                  <th className="px-6 py-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.slice(0, 8).map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {log.attachment_path && (
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img src={`/api/${log.attachment_path}`} className="w-full h-full object-cover" alt="Log" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{log.isp_name}</span>
                          <span className="text-[10px] text-text-muted flex items-center gap-1">
                            <MapPin size={10} /> {log.location}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        log.severity === 'Critical' ? 'border-accent-red text-accent-red' : 
                        log.severity === 'Major' ? 'border-accent-gold text-accent-gold' : 'border-accent-teal text-accent-teal'
                      }`}>
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                         log.status === 'Open' ? 'status-active' : log.status === 'Investigating' ? 'status-resolving' : 'status-resolved'
                       }`}>
                         {log.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <ChevronRight size={18} className="text-text-muted group-hover:text-white cursor-pointer" />
                        <Trash2 
                          size={16} 
                          className="text-text-muted hover:text-accent-red cursor-pointer transition-colors" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogId(log.id);
                            setShowDeleteModal(true);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Alerts */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Bell className="text-accent-gold" size={20} />
            Live Notifications
          </h3>
          <div className="space-y-4">
            {notifications.length === 0 ? (
               <div className="glass-card p-8 text-center text-text-muted italic text-sm">
                 No recent activity.
               </div>
            ) : notifications.map((n, i) => (
              <div key={i} className="glass-card p-4 border-l-4 border-accent-gold flex gap-3 animate-in slide-in-from-right duration-300">
                <div className="p-2 bg-accent-gold/10 rounded text-accent-gold h-fit">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-tighter">{n.event.replace('_', ' ')}</p>
                  <p className="text-xs text-text-muted mt-1">Provider: <span className="text-white">{n.isp}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ActiveFaultsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-white uppercase tracking-tight">Active Incidents</h2>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-[0.1em]">
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Logged At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.filter(l => l.status !== 'Resolved').map(log => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold">{log.isp_name}</td>
                <td className="px-6 py-4 text-sm text-text-muted">{log.location}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                    log.severity === 'Critical' ? 'border-accent-red text-accent-red' : 'border-accent-gold text-accent-gold'
                  }`}>
                    {log.severity.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <span className="text-[10px] font-bold px-3 py-1 rounded-full status-active">
                     {log.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-xs text-white/70">
                  {formatDate(log.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleResolve(log.id)}
                    className="bg-accent-teal/20 text-accent-teal hover:bg-accent-teal hover:text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Mark Resolved
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const [newFault, setNewFault] = useState({ isp_name: 'Powertel', location: 'City Hall', severity: 'Minor', fault_type: '', description: '' });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateFault = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faults/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newFault)
      });
      if (res.ok) {
        const data = await res.json();
        
        // Handle Image Upload if selected
        if (selectedImage) {
          const formData = new FormData();
          formData.append('file', selectedImage);
          await fetch(`/api/upload/${data.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        }

        setShowAddModal(false);
        setNewFault({ isp_name: 'Powertel', location: 'City Hall', severity: 'Minor', fault_type: '', description: '' });
        setSelectedImage(null);
        setImagePreview(null);
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await fetch(`/api/faults/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!token) return <Login />;

  const FaultLogsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Fault History</h2>
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
          <input 
            type="text" 
            placeholder="Search records..." 
            className="bg-transparent border-none outline-none px-4 py-2 text-sm text-white w-64"
          />
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-[0.1em]">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Fault Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Logged At</th>
              <th className="px-6 py-4">Resolved At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-accent-gold">#{log.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {log.attachment_path && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={`/api/${log.attachment_path}`} className="w-full h-full object-cover" alt="Log" />
                      </div>
                    )}
                    <span className="font-bold">{log.isp_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{log.fault_type}</td>
                <td className="px-6 py-4">
                   <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                     log.status === 'Open' ? 'status-active' : log.status === 'Investigating' ? 'status-resolving' : 'status-resolved'
                   }`}>
                     {log.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-xs text-text-muted">{formatDate(log.created_at)}</td>
                <td className="px-6 py-4 text-xs text-text-muted">{formatDate(log.resolved_at)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Download size={16} className="text-text-muted hover:text-white cursor-pointer" />
                    <Trash2 
                      size={16} 
                      className="text-text-muted hover:text-accent-red cursor-pointer transition-colors" 
                      onClick={() => {
                        setSelectedLogId(log.id);
                        setShowDeleteModal(true);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ReportsView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-white uppercase tracking-tight">Operations Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Excel Report', desc: 'Full database export with technical metadata.', format: 'xlsx', icon: FileText },
          { title: 'PDF Summary', desc: 'Professional printable incident summary.', format: 'pdf', icon: Download },
          { title: 'Word Document', desc: 'Editable report for monthly reviews.', format: 'docx', icon: History },
        ].map((r, i) => (
          <div key={i} className="glass-card p-8 flex flex-col items-center text-center gap-4 group hover:border-accent-gold transition-all">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform">
              <r.icon size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">{r.title}</h4>
              <p className="text-sm text-text-muted mt-2">{r.desc}</p>
            </div>
            <a 
              href={`/api/export/${r.format}?period=${period}`} 
              target="_blank" 
              className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 text-white transition-all mt-4"
            >
              DOWNLOAD {r.format.toUpperCase()}
            </a>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-72 p-10 min-h-screen">
        <header className="flex justify-between items-center mb-12">
          <div className="flex flex-col">
            <h2 className="text-4xl font-black text-white uppercase tracking-tight">Council Operations</h2>
            <div className="flex items-center gap-2 text-xs text-text-muted font-bold mt-1">
              <span className="w-2 h-2 rounded-full bg-accent-teal animate-pulse"></span>
              BULAWAYO CITY COUNCIL - NETWORK MONITORING ACTIVE
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              {['day', 'week', 'month', 'all'].map(p => (
                <button 
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded text-[10px] font-black uppercase transition-all ${
                    period === p ? 'bg-accent-gold text-primary-blue shadow-lg' : 'text-text-muted hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <a 
              href={`/api/export/xlsx?period=${period}`} 
              target="_blank"
              className="p-2.5 bg-white/5 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              <Download size={20} />
            </a>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'active' && <ActiveFaultsView />}
        {activeTab === 'history' && <FaultLogsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'email' && <AlertsView />}
      </main>

      {/* Modern Add Incident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-bg-dark/80 backdrop-blur-md" onClick={() => !isLoading && setShowAddModal(false)}></div>
          <div className="glass-card w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-2 bg-gradient-to-r from-accent-red via-accent-gold to-accent-teal shrink-0"></div>
            
            {/* Modal Header */}
            <div className="px-10 py-5 border-b border-white/5 shrink-0 bg-[#070b14]/30">
               <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Log Network Incident</h3>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <div className="max-w-xl mx-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Internet Provider</label>
                    <select 
                      value={newFault.isp_name} 
                      onChange={e => setNewFault({...newFault, isp_name: e.target.value})}
                      className="w-full bg-[#1e293b] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:border-accent-gold outline-none transition-all"
                    >
                      <option value="Powertel">Powertel</option>
                      <option value="Starlink">Starlink</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Council Site / Location</label>
                    <select 
                      value={newFault.location}
                      onChange={e => setNewFault({...newFault, location: e.target.value})}
                      className="w-full bg-[#1e293b] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:border-accent-gold outline-none transition-all"
                    >
                      <option value="WHOLE COMPANY / FULL OUTAGE">🚨 WHOLE COMPANY / FULL OUTAGE</option>
                      <option value="City Hall">City Hall</option>
                      <option value="Revenue Hall">Revenue Hall</option>
                      <option value="Engineering Dept">Engineering Department</option>
                      <option value="Water Works">Water Works Offices</option>
                      <option value="Housing Dept">Housing Department</option>
                      <option value="Town Clerk">Town Clerk Offices</option>
                      <option value="Fire Dept HQ">Fire Department HQ</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Severity</label>
                    <select 
                      value={newFault.severity}
                      onChange={e => setNewFault({...newFault, severity: e.target.value})}
                      className="w-full bg-[#1e293b] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:border-accent-gold outline-none"
                    >
                      <option value="Minor">Minor</option>
                      <option value="Major">Major</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Fault Type</label>
                    <input 
                      value={newFault.fault_type}
                      onChange={e => setNewFault({...newFault, fault_type: e.target.value})}
                      className="w-full bg-[#1e293b] border border-white/20 rounded-lg p-2.5 text-sm text-white focus:border-accent-gold outline-none" 
                      placeholder="e.g. Fibre Cut" 
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-black uppercase tracking-widest text-white/70">Technical Details</label>
                      <button 
                        onClick={() => document.getElementById('image-upload').click()}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-gold hover:text-white transition-colors group"
                      >
                        <Camera size={14} className="group-hover:scale-110 transition-transform" />
                        Add Picture
                      </button>
                    </div>
                    <div className="relative group/field bg-[#1e293b] border border-white/20 rounded-xl overflow-hidden focus-within:border-accent-gold transition-all">
                      <textarea 
                        value={newFault.description}
                        onChange={e => setNewFault({...newFault, description: e.target.value})}
                        rows="5" 
                        className="w-full bg-transparent border-none p-4 pb-12 text-white outline-none text-base resize-none placeholder:text-white/20" 
                        placeholder="Enter detailed technical report..."
                      ></textarea>
                      
                      {imagePreview && (
                        <div className="absolute bottom-3 right-3 w-28 h-28 rounded-xl border-2 border-accent-gold/50 shadow-2xl overflow-hidden group/thumb animate-in zoom-in duration-300">
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Thumb" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setImagePreview(null); }}
                              className="w-8 h-8 bg-accent-red text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                              title="Remove Photo"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Hidden Input for Quick Link triggers via ID */}
                    <input 
                      id="image-upload"
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Compact & Optimized) */}
            <div className="p-5 border-t border-white/10 flex flex-col gap-3 shrink-0 bg-[#070b14] z-20">
                <button 
                  disabled={isLoading}
                  onClick={handleCreateFault} 
                  className="w-full h-14 bg-[#c1121f] hover:bg-[#db1a2a] text-white font-black rounded-xl flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-lg uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(193,18,31,0.4)] border border-white/30 group"
                  style={{ boxShadow: '0 0 30px rgba(193, 18, 31, 0.3)' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>PROCESSING RECORD...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_15px_#fff]"></div>
                      SUBMIT FAULT LOG
                    </>
                  )}
                </button>
                <button 
                  disabled={isLoading}
                  onClick={() => setShowAddModal(false)} 
                  className="w-full py-4 font-black border-2 border-white/20 rounded-xl hover:bg-white/10 transition-all text-white text-[11px] tracking-[0.3em] uppercase transition-colors flex items-center justify-center bg-black/40"
                >
                  DISCARD & CANCEL
                </button>
            </div>
          </div>
        </div>
      )}
      {/* Secure Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-bg-dark/80 backdrop-blur-md" onClick={() => {
            setShowDeleteModal(false);
            setDeletePassword('');
            setDeleteError('');
          }}></div>
          <div className="glass-card w-full max-w-md relative overflow-hidden flex flex-col border-t-4 border-t-accent-red">
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center text-accent-red">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase text-white">Confirm Deletion</h3>
                  <p className="text-sm text-text-muted mt-2">This action is permanent. Enter your password to authorize the removal of log <span className="text-accent-gold font-mono">#{selectedLogId}</span>.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                    <Lock size={12} /> Security Clearance
                  </label>
                  <input 
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    className="w-full bg-[#1e293b]/50 border border-white/20 rounded-lg p-3 text-white focus:border-accent-red outline-none transition-all" 
                    placeholder="Enter your password..."
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleDelete()}
                  />
                </div>
                {deleteError && (
                  <p className="text-accent-red text-tiny font-bold text-center animate-shake">
                    {deleteError}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteError('');
                  }} 
                  className="flex-1 py-3 font-bold border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-white"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 premium-button-red py-3 text-xs"
                >
                  DELETE PERMANENTLY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
