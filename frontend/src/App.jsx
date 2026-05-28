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
  X,
  ChevronDown,
  Eye,
  Zap
} from 'lucide-react';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total_logs: 0, open_issues: 0, resolved_today: 0, avg_resolution_min: 0 });
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
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

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
    try {
      const res = await fetch(`/api/faults/?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
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
      if (res.status === 401) return logout();
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





  const handleExport = (p) => {
    window.open(`/api/export/xlsx?period=${p}`, '_blank');
  };









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

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/faults/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newFault)
      });
      if (res.status === 401) return logout();
      if (res.ok) {
        const data = await res.json();
        
        // Handle Image Upload if selected
        if (selectedImage) {
          const formData = new FormData();
          formData.append('file', selectedImage);
          const uploadRes = await fetch(`/api/upload/${data.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          if (uploadRes.status === 401) return logout();
        }

        setActiveTab('dashboard');
        setNewFault({ isp_name: 'Powertel', location: 'City Hall', severity: 'Minor', fault_type: '', description: '' });
        setSelectedImage(null);
        setImagePreview(null);
        fetchLogs();
        fetchStats();
      } else {
        const errData = await res.json().catch(() => ({}));
        setSubmitError(errData.detail || 'Failed to create fault log. Please check your connection.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError('Network error occurred during submission.');
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
      if (res.status === 401) return logout();
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

  if (!token) return <Login setToken={setToken} />;

  return (
    <div className="flex">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        logout={logout} 
      />
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

        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            setPeriod={setPeriod} 
            handleExport={handleExport} 
            setActiveTab={setActiveTab} 
            logs={logs} 
            setSelectedLogId={setSelectedLogId} 
            setShowDeleteModal={setShowDeleteModal} 
            notifications={notifications} 
          />
        )}
        {activeTab === 'active' && <ActiveFaultsView logs={logs} formatDate={formatDate} handleResolve={handleResolve} />}
        {activeTab === 'history' && <FaultLogsView logs={logs} formatDate={formatDate} setSelectedLogId={setSelectedLogId} setShowDeleteModal={setShowDeleteModal} setActiveTab={setActiveTab} />}
        {activeTab === 'analytics' && <AnalyticsView token={token} />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'email' && <AlertsView token={token} logout={logout} />}
        {activeTab === 'speed-test' && <SpeedTestView token={token} />}
        {activeTab === 'log-incident' && (
          <LogIncidentView 
            newFault={newFault} 
            setNewFault={setNewFault} 
            selectedImage={selectedImage} 
            handleImageChange={handleImageChange} 
            imagePreview={imagePreview}
            handleSubmit={handleSubmit} 
            setActiveTab={setActiveTab} 
            submitError={submitError}
            isLoading={isLoading}
          />
        )}
      </main>


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

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isOn, setIsOn] = useState(false);
  const cordBeadRef = useRef(null);
  const cordLineRef = useRef(null);
  const hitAreaRef = useRef(null);

  useEffect(() => {
    // @ts-ignore
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
                clickSound.play().catch(() => {});
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
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const res = await fetch('/api/token', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params 
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
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. j.doe" required />
            </div>
            <div className="lamp-form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="text-accent-red text-[10px] font-bold text-center mb-4">{error}</p>}
            <button className="lamp-login-btn">SIGN IN</button>
          </form>
          <p className="text-[9px] text-center text-text-muted uppercase tracking-widest mt-6 border-t border-white/5 pt-4">
            Protected Municipal Infrastructure
          </p>
        </div>
      </div>
      {!isOn && <div className="lamp-hint animate-pulse">Pull string to light the desk</div>}
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, user, logout }) => (
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
      <div className={`sidebar-item ${activeTab === 'log-incident' ? 'active' : ''}`} onClick={() => setActiveTab('log-incident')}>
        <PlusCircle size={20} /> <span>Log New Incident</span>
      </div>
      <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
        <LayoutDashboard size={20} /> <span>Operations Dashboard</span>
      </div>
      <div className={`sidebar-item ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
        <AlertTriangle size={20} /> <span>Active Outages</span>
      </div>
      <div className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
        <History size={20} /> <span>Report Management</span>
      </div>
      <div className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
        <BarChart3 size={20} /> <span>ISP Analytics</span>
      </div>
      <div className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
        <Activity size={20} /> <span>Download Reports</span>
      </div>
      <div className={`sidebar-item ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
        <Mail size={20} /> <span>Management Alerts</span>
      </div>
      <div className={`sidebar-item ${activeTab === 'speed-test' ? 'active' : ''}`} onClick={() => setActiveTab('speed-test')}>
        <Zap size={20} /> <span>Internet Speed Test</span>
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

const AnalyticsView = ({ token }) => {
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
          <circle cx="60" cy="60" r={r} stroke="url(#g)" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 60 60)" />
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
      fetch('/api/faults/?period=all', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([chartData, faults]) => {
      if (!mounted) return;
      const allFaults = Array.isArray(faults) ? faults : [];
      const series50 = buildDailySeries(allFaults, 50);
      setPayload({
        isps: (chartData?.isps || []),
        last7: {
          total: allFaults.length,
          resolved: allFaults.filter(f => f.status === 'Resolved').length,
          critical: allFaults.filter(f => f.severity === 'Critical').length,
          resolutionRate: allFaults.length ? (allFaults.filter(f => f.status === 'Resolved').length / allFaults.length) * 100 : 0,
          breachRate: allFaults.length ? (allFaults.filter(f => !!f.is_sla_breach).length / allFaults.length) * 100 : 0,
          avgResolveMin: 0,
          locationsAffected: new Set(allFaults.map(f => f.location)).size
        },
        series: {
          faultsCurr25: series50.slice(25),
          faultsPrev25: series50.slice(0, 25),
          critCurr25: buildDailySeries(allFaults, 25, f => f.severity === 'Critical'),
          critPrev25: []
        },
        by: { location: [], type: [], isp: [] }
      });
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { mounted = false; };
  }, [token]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 kpi-board">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">ISP Efficiency Analysis</h2>
          <p className="text-xs text-text-muted mt-1">Live performance breakdown</p>
        </div>
      </div>
      {loading || !payload ? <div className="glass-card p-8 text-sm text-text-muted">Loading analytics...</div> : (
        <div className="kpi-grid">
          <div className="kpi-card kpi-span-4">
            <div className="kpi-head">
              <div><div className="kpi-title">Faults</div><div className="kpi-value">{fmtInt(payload.last7.total)}</div></div>
            </div>
            <Sparkline a={payload.series.faultsCurr25} b={payload.series.faultsPrev25} />
          </div>
          <div className="kpi-card kpi-span-4">
            <div className="kpi-head"><div><div className="kpi-title">Resolution rate</div><div className="kpi-value">{fmtPct(payload.last7.resolutionRate)}</div></div></div>
            <div className="kpi-mini">Resolved: {fmtInt(payload.last7.resolved)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const AlertsView = ({ token, logout }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ tier: 'CRITICAL', email: '', is_enabled: true });

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notification-rules/', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) logout();
      const data = await res.json();
      setRules(Array.isArray(data) ? data : []);
    } catch (e) { console.error('Failed to load rules'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.email) return;
    try {
      const res = await fetch('/api/notification-rules/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ ...form, email: '' });
        loadRules();
      }
    } catch (e) { console.error('Failed to add rule'); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/notification-rules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadRules();
    } catch (e) { console.error('Failed to delete rule'); }
  };

  useEffect(() => { loadRules(); }, [token]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Management Alerts</h2>
          <p className="text-xs text-text-muted mt-1">Configure automated incident escalations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><PlusCircle size={18} className="text-accent-teal" /> Add Alert Rule</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Threshold Tier</label>
                <select 
                  value={form.tier}
                  onChange={e => setForm({ ...form, tier: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-accent-gold"
                >
                  <option value="INFO" className="bg-[#0f172a]">INFO (All logs)</option>
                  <option value="WARNING" className="bg-[#0f172a]">WARNING (Major+)</option>
                  <option value="CRITICAL" className="bg-[#0f172a]">CRITICAL (Outages)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stakeholder Email</label>
                <input 
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-accent-teal"
                  placeholder="e.g. manager@bcc.gov.zw"
                  required
                />
              </div>
              <button className="premium-button w-full py-4 text-xs font-black">SAVE ALERT RULE</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-widest">
                  <th className="px-6 py-4">Stakeholder</th>
                  <th className="px-6 py-4">Trigger</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rules.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-text-muted italic text-sm">No alert rules configured.</td></tr>
                ) : rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm">{rule.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        rule.tier === 'CRITICAL' ? 'border-accent-red text-accent-red' : 
                        rule.tier === 'WARNING' ? 'border-accent-gold text-accent-gold' : 'border-accent-teal text-accent-teal'
                      }`}>{rule.tier}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full status-active">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Trash2 size={16} className="text-text-muted hover:text-accent-red cursor-pointer inline-block" onClick={() => handleDelete(rule.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ stats, setPeriod, handleExport, setActiveTab, logs, setSelectedLogId, setShowDeleteModal, notifications }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-accent-red">
        <div className="flex justify-between items-start"><span className="text-sm font-bold text-text-muted uppercase tracking-wider">Day logs</span><AlertTriangle className="text-accent-red" size={24} /></div>
        <span className="text-4xl font-black text-white">{stats.day_logs_count}</span>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('day')} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase text-white tracking-widest border border-white/5">VIEW DATA</button>
          <button onClick={() => handleExport('day')} className="px-3 py-2 bg-accent-red/10 hover:bg-accent-red/20 rounded-lg text-accent-red border border-accent-red/20"><Download size={14} /></button>
        </div>
      </div>
      <div className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-accent-teal">
        <div className="flex justify-between items-start"><span className="text-sm font-bold text-text-muted uppercase tracking-wider">Weekly logs</span><CheckCircle className="text-accent-teal" size={24} /></div>
        <span className="text-4xl font-black text-white">{stats.week_logs_count}</span>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('week')} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase text-white tracking-widest border border-white/5">VIEW DATA</button>
          <button onClick={() => handleExport('week')} className="px-3 py-2 bg-accent-teal/10 hover:bg-accent-teal/20 rounded-lg text-accent-teal border border-accent-teal/20"><Download size={14} /></button>
        </div>
      </div>
      <div className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-primary-blue">
        <div className="flex justify-between items-start"><span className="text-sm font-bold text-text-muted uppercase tracking-wider">Monthly logs</span><History className="text-primary-blue" size={24} /></div>
        <span className="text-4xl font-black text-white">{stats.month_logs_count}</span>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('month')} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase text-white tracking-widest border border-white/5">VIEW DATA</button>
          <button onClick={() => handleExport('month')} className="px-3 py-2 bg-primary-blue/10 hover:bg-primary-blue/20 rounded-lg text-primary-blue border border-primary-blue/20"><Download size={14} /></button>
        </div>
      </div>
      <div className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-accent-gold cursor-pointer" onClick={() => setActiveTab('analytics')}>
        <div className="flex justify-between items-start"><span className="text-sm font-bold text-text-muted uppercase tracking-wider">ISP Analytics</span><BarChart3 className="text-accent-gold" size={24} /></div>
        <span className="text-4xl font-black text-white">View</span>
        <button className="w-full py-2 bg-accent-gold/10 hover:bg-accent-gold/20 rounded-lg text-[10px] font-black text-accent-gold uppercase tracking-widest border border-accent-gold/20">OPEN DASHBOARD</button>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center"><h3 className="text-xl font-bold flex items-center gap-2"><Activity className="text-accent-teal" size={20} />Live Incident Feed</h3><button onClick={() => setActiveTab('log-incident')} className="premium-button-red flex items-center gap-2 text-sm"><PlusCircle size={18} /> LOG INCIDENT</button></div>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-widest"><th className="px-6 py-4">Provider</th><th className="px-6 py-4">Severity</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Logged</th><th className="px-6 py-4 text-right">View</th></tr></thead>
            <tbody className="divide-y divide-white/5">{logs.slice(0, 8).map(log => (<tr key={log.id} className="hover:bg-white/5 transition-colors group"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 p-1 bg-white/5 rounded-lg border border-white/5 shrink-0 flex items-center justify-center"><img src="/logo.png" className="w-full h-full object-contain" alt="BCC" /></div>{log.attachment_path && (<div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0"><img src={`/api/${log.attachment_path}`} className="w-full h-full object-cover" alt="Log" /></div>)}<div className="flex flex-col"><span className="font-bold text-sm">{log.isp_name}</span><span className="text-[10px] text-text-muted flex items-center gap-1"><MapPin size={10} /> {log.location}</span></div></div></td><td className="px-6 py-4"><span className={`text-[10px] font-black px-2 py-0.5 rounded border ${log.severity === 'Critical' ? 'border-accent-red text-accent-red' : log.severity === 'Major' ? 'border-accent-gold text-accent-gold' : 'border-accent-teal text-accent-teal'}`}>{log.severity.toUpperCase()}</span></td><td className="px-6 py-4"><span className={`text-[10px] font-bold px-3 py-1 rounded-full ${log.status === 'Open' ? 'status-active' : log.status === 'Investigating' ? 'status-resolving' : 'status-resolved'}`}>{log.status}</span></td><td className="px-6 py-4 text-xs text-text-muted">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-3"><ChevronRight size={18} className="text-text-muted group-hover:text-white cursor-pointer" /><Trash2 size={16} className="text-text-muted hover:text-accent-red cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedLogId(log.id); setShowDeleteModal(true); }} /></div></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <div className="space-y-6"><h3 className="text-xl font-bold flex items-center gap-2"><Bell className="text-accent-gold" size={20} />Live Notifications</h3><div className="space-y-4">{notifications.length === 0 ? (<div className="glass-card p-8 text-center text-text-muted italic text-sm">No recent activity.</div>) : notifications.map((n, i) => (<div key={i} className="glass-card p-4 border-l-4 border-accent-gold flex gap-3 animate-in slide-in-from-right duration-300"><div className="p-2 bg-accent-gold/10 rounded text-accent-gold h-fit"><Activity size={16} /></div><div><p className="text-xs font-bold text-white uppercase tracking-tighter">{n.event.replace('_', ' ')}</p><p className="text-xs text-text-muted mt-1">Provider: <span className="text-white">{n.isp}</span></p></div></div>))}</div></div>
    </div>
  </div>
);

const ActiveFaultsView = ({ logs, formatDate, handleResolve }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Active Incidents</h2>
    <div className="glass-card overflow-hidden">
      <table className="w-full text-left">
        <thead><tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-widest"><th className="px-6 py-4">Provider</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Severity</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Logged At</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-white/5">{logs.filter(l => l.status !== 'Resolved').map(log => (<tr key={log.id} className="hover:bg-white/5 transition-colors"><td className="px-6 py-4 font-bold">{log.isp_name}</td><td className="px-6 py-4 text-sm text-text-muted">{log.location}</td><td className="px-6 py-4"><span className={`text-[10px] font-black px-2 py-0.5 rounded border ${log.severity === 'Critical' ? 'border-accent-red text-accent-red' : 'border-accent-gold text-accent-gold'}`}>{log.severity.toUpperCase()}</span></td><td className="px-6 py-4"><span className="text-[10px] font-bold px-3 py-1 rounded-full status-active">{log.status}</span></td><td className="px-6 py-4 text-xs text-white/70">{formatDate(log.created_at)}</td><td className="px-6 py-4 text-right"><button onClick={() => handleResolve(log.id)} className="bg-accent-teal/20 text-accent-teal hover:bg-accent-teal hover:text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Mark Resolved</button></td></tr>))}</tbody>
      </table>
    </div>
  </div>
);

const FaultLogsView = ({ logs, formatDate, setSelectedLogId, setShowDeleteModal, setActiveTab }) => {
  const [viewingLog, setViewingLog] = useState(null);

  if (viewingLog) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Incident Details</h3>
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">ID: #{viewingLog.id}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setViewingLog(null)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-white/10">← Back to Reports</button>
            <button onClick={() => { setViewingLog(null); setActiveTab('dashboard'); }} className="premium-button text-xs py-3 px-6">← Back to Dashboard</button>
          </div>
        </div>

        <div className="glass-card p-10 space-y-10 border-t-4 border-t-accent-gold">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Provider</p>
              <p className="font-bold text-white text-xl">{viewingLog.isp_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Location</p>
              <p className="font-bold text-white text-xl">{viewingLog.location}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Status</p>
              <span className={`inline-block mt-1 text-[11px] font-bold px-4 py-1.5 rounded-full ${viewingLog.status === 'Open' ? 'status-active' : viewingLog.status === 'Investigating' ? 'status-resolving' : 'status-resolved'}`}>{viewingLog.status}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Severity</p>
              <span className={`inline-block mt-1 text-[11px] font-black px-3 py-1 rounded border ${viewingLog.severity === 'Critical' ? 'border-accent-red text-accent-red' : viewingLog.severity === 'Major' ? 'border-accent-gold text-accent-gold' : 'border-accent-teal text-accent-teal'}`}>{viewingLog.severity.toUpperCase()}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Logged At</p>
              <p className="text-base text-text-muted font-medium">{formatDate(viewingLog.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Resolved At</p>
              <p className="text-base text-text-muted font-medium">{viewingLog.resolved_at ? formatDate(viewingLog.resolved_at) : 'Not Resolved'}</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mb-3 border-t border-white/10 pt-8">Incident Summary & Comments</p>
            <div className="p-6 bg-[#0f172a] rounded-2xl border border-white/5 text-base text-white/90 leading-relaxed whitespace-pre-wrap">
              {viewingLog.description || 'No description provided.'}
            </div>
          </div>

          {viewingLog.attachment_path && (
            <div>
              <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mb-3 border-t border-white/10 pt-8">Proof of Outage</p>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0f172a]/50 p-4 flex justify-center">
                <img src={`/api/${viewingLog.attachment_path}`} alt="Incident Attachment" className="max-w-full rounded-xl shadow-2xl" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-white uppercase tracking-tight">Fault History</h2><div className="flex bg-white/5 p-1 rounded-lg border border-white/10"><input type="text" placeholder="Search records..." className="bg-transparent border-none outline-none px-4 py-2 text-sm text-white w-64" /></div></div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-widest"><th className="px-6 py-4">ID</th><th className="px-6 py-4">Provider</th><th className="px-6 py-4">Fault Type</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Logged At</th><th className="px-6 py-4">Resolved At</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-white/5">{logs.map(log => (<tr key={log.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setViewingLog(log)}><td className="px-6 py-4 text-xs font-mono text-accent-gold">#{log.id}</td><td className="px-6 py-4"><div className="flex items-center gap-3">{log.attachment_path && (<div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0"><img src={`/api/${log.attachment_path}`} className="w-full h-full object-cover" alt="Log" /></div>)}<span className="font-bold">{log.isp_name}</span></div></td><td className="px-6 py-4 text-sm">{log.fault_type}</td><td className="px-6 py-4"><span className={`text-[10px] font-bold px-3 py-1 rounded-full ${log.status === 'Open' ? 'status-active' : log.status === 'Investigating' ? 'status-resolving' : 'status-resolved'}`}>{log.status}</span></td><td className="px-6 py-4 text-xs text-text-muted">{formatDate(log.created_at)}</td><td className="px-6 py-4 text-xs text-text-muted">{formatDate(log.resolved_at)}</td><td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-3"><Eye size={16} className="text-text-muted hover:text-white cursor-pointer" onClick={(e) => { e.stopPropagation(); setViewingLog(log); }} /><Trash2 size={16} className="text-text-muted hover:text-accent-red cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedLogId(log.id); setShowDeleteModal(true); }} /></div></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

const LogIncidentView = ({ 
  newFault, 
  setNewFault, 
  selectedImage, 
  handleImageChange, 
  imagePreview,
  handleSubmit, 
  setActiveTab,
  submitError,
  isLoading
}) => (
  <div className="max-w-4xl mx-auto animate-in zoom-in duration-500 pb-20">
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Log Incident</h2>
          <p className="text-xs text-text-muted mt-2 font-bold uppercase tracking-widest bg-white/5 py-1.5 px-4 rounded-full w-fit flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse"></span> Operations Center / New Entry
          </p>
        </div>
        <button onClick={() => setActiveTab('dashboard')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
          <X size={20} className="text-text-muted group-hover:text-white" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-10 space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8] ml-1">Service Provider</label>
                <div className="relative">
                  <select 
                    value={newFault.isp_name}
                    onChange={e => setNewFault({ ...newFault, isp_name: e.target.value })}
                    className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-accent-gold outline-none transition-all appearance-none font-bold"
                  >
                    <option value="Powertel" className="bg-[#0f172a]">Powertel</option>
                    <option value="Starlink" className="bg-[#0f172a]">Starlink</option>
                    <option value="Liquid" className="bg-[#0f172a]">Liquid Intelligent</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8] ml-1">Impact Location</label>
                <div className="relative">
                  <select 
                    value={newFault.location}
                    onChange={e => setNewFault({ ...newFault, location: e.target.value })}
                    className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-accent-gold outline-none transition-all appearance-none font-bold"
                  >
                    <option value="City Hall" className="bg-[#0f172a]">City Hall</option>
                    <option value="Tower Block" className="bg-[#0f172a]">Tower Block</option>
                    <option value="Revenue Hall" className="bg-[#0f172a]">Revenue Hall</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8] ml-1">Fault Category</label>
              <input 
                placeholder="e.g. Total Outage, Slow Connection..."
                value={newFault.fault_type}
                onChange={e => setNewFault({ ...newFault, fault_type: e.target.value })}
                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-accent-gold outline-none transition-all font-bold placeholder:text-white/20"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8] ml-1">Incident Summary</label>
              <textarea 
                rows="6"
                placeholder="Clearly state what is happening and any technical details..."
                value={newFault.description}
                onChange={e => setNewFault({ ...newFault, description: e.target.value })}
                className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-accent-gold outline-none transition-all font-medium resize-none placeholder:text-white/20"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8] ml-1">Severity Priority</label>
              <div className="grid grid-cols-1 gap-3">
                {['Minor', 'Major', 'Critical'].map(level => {
                  const isSelected = newFault.severity === level;
                  let colorClasses = '';
                  
                  if (level === 'Critical') {
                    colorClasses = isSelected 
                      ? 'bg-accent-red border-accent-red text-white shadow-[0_0_15px_rgba(193,18,31,0.5)]' 
                      : 'bg-accent-red/10 border-accent-red/30 text-accent-red hover:bg-accent-red/20 hover:border-accent-red/50';
                  } else if (level === 'Major') {
                    colorClasses = isSelected 
                      ? 'bg-accent-gold border-accent-gold text-white shadow-[0_0_15px_rgba(198,167,92,0.5)]' 
                      : 'bg-accent-gold/10 border-accent-gold/30 text-accent-gold hover:bg-accent-gold/20 hover:border-accent-gold/50';
                  } else {
                    colorClasses = isSelected 
                      ? 'bg-accent-teal border-accent-teal text-white shadow-[0_0_15px_rgba(127,191,179,0.5)]' 
                      : 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal hover:bg-accent-teal/20 hover:border-accent-teal/50';
                  }

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewFault({ ...newFault, severity: level })}
                      className={`group relative overflow-hidden py-4 px-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border transition-all text-left flex items-center justify-between ${colorClasses}`}
                    >
                      <span className="relative z-10">{level}</span>
                      {isSelected ? (
                        <CheckCircle size={16} className="relative z-10" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${level === 'Critical' ? 'bg-accent-red' : level === 'Major' ? 'bg-accent-gold' : 'bg-accent-teal'} opacity-50`}></span>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8] ml-1">Proof of Outage</label>
              <div className="relative group overflow-hidden rounded-2xl">
                <input 
                  type="file" 
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
                <div className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                  selectedImage ? 'border-accent-teal bg-accent-teal/10' : 'border-white/10 bg-white/5 group-hover:border-accent-gold/50 group-hover:bg-accent-gold/5'
                }`}>
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-accent-teal shadow-xl">
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-accent-teal">File Attached</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-full bg-white/5">
                        <Camera size={28} className="text-text-muted group-hover:text-white transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-black uppercase tracking-widest text-white mb-1">Click to Upload</p>
                        <p className="text-[10px] font-bold text-text-muted">PNG, JPG up to 10MB</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {submitError && (
              <p className="text-[10px] font-black text-accent-red uppercase tracking-widest text-center animate-shake p-3 bg-accent-red/10 rounded-xl border border-accent-red/20">
                {submitError}
              </p>
            )}
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="premium-button-red group relative overflow-hidden w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_-15px_rgba(193,18,31,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <PlusCircle size={22} className="text-white" /> <span className="text-white">{isLoading ? 'Processing...' : 'Submit Log Entry'}</span>
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="w-full py-5 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold hover:bg-accent-gold/20 rounded-2xl font-black uppercase tracking-[0.2em] transition-all text-xs"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ReportsView = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div>
      <h2 className="text-3xl font-black text-white uppercase tracking-tight">Download Reports</h2>
      <p className="text-xs text-text-muted mt-1">Generate and export institutional performance data</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="glass-card p-10 flex flex-col items-center text-center gap-6 border-t-4 border-t-accent-gold">
        <div className="w-20 h-20 bg-accent-gold/10 rounded-3xl flex items-center justify-center text-accent-gold">
          <FileText size={40} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">ISP Performance Analysis</h3>
          <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
            Comprehensive Word document containing resolution rates, fault trends, and ISP uptime metrics for the current period.
          </p>
        </div>
        <a 
          href="/api/export/isp-report" 
          target="_blank"
          className="premium-button-gold w-full py-4 text-xs font-black flex items-center justify-center gap-3"
        >
          <Download size={18} /> DOWNLOAD PERFORMANCE DOCX
        </a>
      </div>

      <div className="glass-card p-10 flex flex-col items-center text-center gap-6 border-t-4 border-t-accent-teal">
        <div className="w-20 h-20 bg-accent-teal/10 rounded-3xl flex items-center justify-center text-accent-teal">
          <Activity size={40} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">Raw Incident Data</h3>
          <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
            Export the complete incident archive as an Excel spreadsheet for advanced data filtering and auditing.
          </p>
        </div>
        <a 
          href="/api/export/xlsx" 
          target="_blank"
          className="premium-button w-full py-4 text-xs font-black flex items-center justify-center gap-3"
        >
          <Download size={18} /> EXPORT FAULT LOGS XLSX
        </a>
      </div>
    </div>
  </div>
);

const SpeedTestView = ({ token }) => {
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const runTest = async () => {
    setIsRunning(true);
    setResults(null);
    setError('');
    try {
      const res = await fetch('/api/speedtest', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || 'Speed test failed. Please try again later.');
      }
    } catch (err) {
      setError('Network error occurred during test.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Network Performance</h2>
          <p className="text-xs text-text-muted mt-1">Live internet speed analysis for City Hall Gateway</p>
        </div>
        <button 
          onClick={runTest} 
          disabled={isRunning}
          className={`premium-button flex items-center gap-3 px-10 py-5 group ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRunning ? <Activity className="animate-spin" size={20} /> : <Zap size={20} className="group-hover:text-accent-gold transition-colors" />}
          <span className="font-black uppercase tracking-widest">{isRunning ? 'ANALYZING...' : 'START PERFORMANCE TEST'}</span>
        </button>
      </div>

      {error && (
        <div className="p-6 bg-accent-red/10 border border-accent-red/20 rounded-2xl text-accent-red text-sm font-bold flex items-center gap-3 animate-shake">
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {!results && !isRunning && (
        <div className="glass-card p-24 flex flex-col items-center justify-center text-center gap-8 border-dashed border-2 border-white/10">
          <div className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center text-white/10 group-hover:text-white/20 transition-all">
            <Zap size={56} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Ready to Benchmark</h3>
            <p className="text-text-muted max-w-sm mx-auto text-sm leading-relaxed">
              Click the button above to measure your current bandwidth. This will check download, upload, and server latency.
            </p>
          </div>
        </div>
      )}

      {isRunning && (
        <div className="glass-card p-24 flex flex-col items-center justify-center text-center gap-10 border-t-4 border-t-accent-gold overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
             <div className="h-full bg-accent-gold animate-progress w-[60%]"></div>
          </div>
          <div className="relative w-56 h-56">
            <div className="absolute inset-0 border-[6px] border-white/5 rounded-full"></div>
            <div className="absolute inset-0 border-[6px] border-t-accent-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin duration-700"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Activity size={40} className="text-accent-gold animate-pulse mb-3" />
              <span className="text-2xl font-black text-white tracking-tighter">MEASURING</span>
              <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.2em] mt-1">Live Stream</span>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-white font-bold uppercase tracking-widest">Optimizing Server Connection...</p>
            <div className="flex gap-2 justify-center">
               <span className="w-2 h-2 rounded-full bg-accent-gold animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-2 h-2 rounded-full bg-accent-gold animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-2 h-2 rounded-full bg-accent-gold animate-bounce"></span>
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card p-10 flex flex-col items-center gap-6 border-t-4 border-t-accent-teal hover:bg-white/5 transition-all group">
            <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">Downstream</span>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black text-white tracking-tighter group-hover:text-accent-teal transition-colors">{Math.floor(results.download)}</span>
                <span className="text-lg font-black text-accent-teal uppercase tracking-tighter">Mbps</span>
              </div>
              <p className="text-[10px] text-text-muted font-bold mt-2">PEAK: {results.download} MBPS</p>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-accent-teal shadow-[0_0_15px_rgba(127,191,179,0.5)]" style={{ width: `${Math.min((results.download/50)*100, 100)}%` }}></div>
            </div>
          </div>

          <div className="glass-card p-10 flex flex-col items-center gap-6 border-t-4 border-t-accent-gold hover:bg-white/5 transition-all group">
            <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">Upstream</span>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black text-white tracking-tighter group-hover:text-accent-gold transition-colors">{Math.floor(results.upload)}</span>
                <span className="text-lg font-black text-accent-gold uppercase tracking-tighter">Mbps</span>
              </div>
              <p className="text-[10px] text-text-muted font-bold mt-2">PEAK: {results.upload} MBPS</p>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-accent-gold shadow-[0_0_15px_rgba(198,167,92,0.5)]" style={{ width: `${Math.min((results.upload/50)*100, 100)}%` }}></div>
            </div>
          </div>

          <div className="glass-card p-10 flex flex-col items-center gap-6 border-t-4 border-t-primary-blue hover:bg-white/5 transition-all group">
            <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">Latency</span>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black text-white tracking-tighter group-hover:text-primary-blue transition-colors">{Math.round(results.ping)}</span>
                <span className="text-lg font-black text-primary-blue uppercase tracking-tighter">ms</span>
              </div>
              <p className="text-[10px] text-text-muted font-bold mt-2">PING DURATION</p>
            </div>
            <div className="mt-6 p-4 bg-white/5 rounded-2xl w-full text-center">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Testing Server</p>
              <p className="text-xs text-white font-bold truncate">{results.server}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
