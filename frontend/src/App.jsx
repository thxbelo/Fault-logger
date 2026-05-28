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
  Zap,
  MessageSquare,
  Send,
  UserPlus,
  Users
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const STATUS_OPTIONS = ['Open', 'Assigned', 'Investigating', 'Waiting for ISP', 'Resolved', 'Closed'];
const ACTIVE_STATUSES = ['Open', 'Assigned', 'Investigating', 'Waiting for ISP'];

const getStatusClass = (status) => {
  if (status === 'Resolved' || status === 'Closed') return 'status-resolved';
  if (status === 'Investigating' || status === 'Waiting for ISP' || status === 'Assigned') return 'status-resolving';
  return 'status-active';
};

const formatDuration = (start, end) => {
  if (!start) return '-';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const totalMinutes = Math.max(0, Math.floor((endDate - startDate) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total_logs: 0, open_issues: 0, resolved_today: 0, avg_resolution_min: 0 });
  const [period, setPeriod] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const ws = useRef(null);
  const [user, setUser] = useState({ username: '', role: '' });
  const [assignees, setAssignees] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveLog, setResolveLog] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchMe();
      fetchAssignees();
      fetchLogs();
      fetchStats();
    }
  }, [period, token]);

  useEffect(() => {
    if (token) {
      setupWebSocket();
      return () => ws.current?.close();
    }
  }, [token]);

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = import.meta.env.DEV
      ? `${protocol}://127.0.0.1:8080/ws`
      : `${protocol}://${window.location.host}/api/ws`;

    ws.current = new WebSocket(url);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(prev => [data, ...prev].slice(0, 5));
      fetchLogs();
      fetchStats();
    };
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
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

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      if (res.ok) setUser(await res.json());
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const fetchAssignees = async () => {
    try {
      const res = await fetch('/api/users/assignees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      if (res.ok) setAssignees(await res.json());
    } catch (err) {
      console.error("Failed to fetch assignees:", err);
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









  const [newFault, setNewFault] = useState({ isp_name: 'Powertel', location: 'City Hall', severity: 'Minor', fault_type: '', description: '', assigned_to: '' });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      if (!file.type.startsWith('image/')) {
        setImagePreview(null);
        return;
      }
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
        setNewFault({ isp_name: 'Powertel', location: 'City Hall', severity: 'Minor', fault_type: '', description: '', assigned_to: '' });
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

  const handleUpdateFault = async (id, payload) => {
    try {
      const res = await fetch(`/api/faults/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) return logout();
      if (res.ok) {
        const updated = await res.json();
        fetchLogs();
        fetchStats();
        return updated;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to update fault');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const openResolveDialog = (log) => {
    setResolveLog(log);
    setResolutionNote(log?.resolution_note || '');
    setResolveError('');
    setShowResolveModal(true);
  };

  const handleResolveConfirm = async () => {
    if (!resolutionNote.trim()) {
      setResolveError('Resolution note is required.');
      return;
    }
    try {
      await handleUpdateFault(resolveLog.id, { status: 'Resolved', resolution_note: resolutionNote.trim() });
      setShowResolveModal(false);
      setResolveLog(null);
      setResolutionNote('');
      setResolveError('');
    } catch (err) {
      setResolveError(err.message || 'Failed to resolve fault');
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
        {activeTab === 'active' && <ActiveFaultsView logs={logs} formatDate={formatDate} onResolve={openResolveDialog} onUpdateFault={handleUpdateFault} assignees={assignees} />}
        {activeTab === 'history' && <FaultLogsView logs={logs} formatDate={formatDate} setSelectedLogId={setSelectedLogId} setShowDeleteModal={setShowDeleteModal} setActiveTab={setActiveTab} token={token} logout={logout} onUpdateFault={handleUpdateFault} onResolve={openResolveDialog} assignees={assignees} refreshLogs={fetchLogs} />}
        {activeTab === 'analytics' && <AnalyticsView token={token} logout={logout} />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'email' && <AlertsView token={token} logout={logout} />}
        {activeTab === 'users' && <UsersView token={token} logout={logout} currentUser={user} />}
        {activeTab === 'speed-test' && <SpeedTestView token={token} logout={logout} />}
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
            assignees={assignees}
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

      {showResolveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-bg-dark/80 backdrop-blur-md" onClick={() => {
            setShowResolveModal(false);
            setResolveLog(null);
            setResolutionNote('');
            setResolveError('');
          }}></div>
          <div className="glass-card w-full max-w-md relative overflow-hidden flex flex-col border-t-4 border-t-accent-teal">
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-accent-teal/10 rounded-full flex items-center justify-center text-accent-teal">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase text-white">Resolve Incident</h3>
                  <p className="text-sm text-text-muted mt-2">Add a resolution note for <span className="text-accent-gold font-mono">{resolveLog?.ticket_number || `#${resolveLog?.id}`}</span>.</p>
                </div>
              </div>

              <textarea
                rows="5"
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                className="w-full bg-[#1e293b]/50 border border-white/20 rounded-lg p-3 text-white focus:border-accent-teal outline-none transition-all resize-none"
                placeholder="e.g. ISP restored fiber connectivity."
                autoFocus
              />
              {resolveError && <p className="text-accent-red text-[10px] font-bold text-center animate-shake">{resolveError}</p>}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setResolveLog(null);
                    setResolutionNote('');
                    setResolveError('');
                  }}
                  className="flex-1 py-3 font-bold border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-white"
                >
                  CANCEL
                </button>
                <button onClick={handleResolveConfirm} className="flex-1 premium-button py-3 text-xs">
                  MARK RESOLVED
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
      {user.role === 'Admin' && (
        <div className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={20} /> <span>User Management</span>
        </div>
      )}
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

const AnalyticsView = ({ token, logout }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/analytics/', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { logout(); return null; } return r.json(); })
      .then(d => { if (mounted && d) { setData(d); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [token]);

  const TOOLTIP_STYLE = {
    contentStyle: { background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(198,167,92,0.3)', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' },
    labelStyle: { color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' },
    cursor: { fill: 'rgba(255,255,255,0.04)' }
  };

  const KpiCard = ({ label, value, sub, color = '#7FBFB3' }) => (
    <div className="glass-card p-6 flex flex-col gap-2" style={{ borderTop: `3px solid ${color}` }}>
      <p style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>{label}</p>
      <p style={{ fontSize: '42px', fontWeight: 900, color: '#f8fafc', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{sub}</p>}
    </div>
  );

  if (loading) return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div><h2 className="text-3xl font-black text-white uppercase tracking-tight">ISP Analytics</h2><p className="text-xs text-text-muted mt-1">Loading live data...</p></div>
      <div className="glass-card p-20 flex items-center justify-center"><Activity size={32} className="text-accent-gold animate-spin" /></div>
    </div>
  );

  if (!data) return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div><h2 className="text-3xl font-black text-white uppercase tracking-tight">ISP Analytics</h2></div>
      <div className="glass-card p-12 text-center text-text-muted text-sm">Failed to load analytics. Please refresh.</div>
    </div>
  );

  const { summary, daily_trend, by_isp, by_severity, by_type, by_location } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">ISP Analytics</h2>
          <p className="text-xs text-text-muted mt-1">30-day operational performance — Bulawayo City Council</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total Faults" value={summary.total} sub="All time" color="#7FBFB3" />
        <KpiCard label="Open Issues" value={summary.open} sub={`${summary.critical} critical`} color="#C1121F" />
        <KpiCard label="Resolution Rate" value={`${summary.resolution_rate}%`} sub={`${summary.resolved} resolved`} color="#C6A75C" />
        <KpiCard label="Avg Resolve Time" value={summary.avg_resolve_min > 0 ? `${summary.avg_resolve_min}m` : 'N/A'} sub={`${summary.sla_breaches} SLA breaches`} color="#1E3A8A" />
      </div>

      {/* 30-Day Trend */}
      <div className="glass-card p-8" style={{ borderTop: '3px solid #C6A75C' }}>
        <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '20px' }}>30-Day Fault Trend</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={daily_trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="faultsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C1121F" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#C1121F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7FBFB3" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7FBFB3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', paddingTop: '12px' }} />
            <Area type="monotone" dataKey="faults" name="Faults" stroke="#C1121F" strokeWidth={2} fill="url(#faultsGrad)" dot={false} activeDot={{ r: 4, fill: '#C1121F' }} />
            <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#7FBFB3" strokeWidth={2} fill="url(#resolvedGrad)" dot={false} activeDot={{ r: 4, fill: '#7FBFB3' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ISP Comparison + Severity Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-8 lg:col-span-2" style={{ borderTop: '3px solid #7FBFB3' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '20px' }}>ISP Fault Comparison</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={by_isp} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', paddingTop: '12px' }} />
              <Bar dataKey="total" name="Total" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#7FBFB3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="critical" name="Critical" fill="#C1121F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-8" style={{ borderTop: '3px solid #C1121F' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>Severity Breakdown</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={by_severity} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value" stroke="none">
                {by_severity.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {by_severity.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }}></span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>{s.name}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fault Type Donut + Location Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-8" style={{ borderTop: '3px solid #C6A75C' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>Fault Type Distribution</p>
          {by_type.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '12px', fontWeight: 700 }}>No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={by_type} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value" stroke="none">
                    {by_type.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-2">
                {by_type.slice(0, 4).map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }}></span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>{t.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="glass-card p-8" style={{ borderTop: '3px solid #7FBFB3' }}>
          <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '16px' }}>Location Hotspots</p>
          {by_location.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '12px', fontWeight: 700, textAlign: 'center', paddingTop: '60px' }}>No data yet</div>
          ) : (
            <div className="flex flex-col gap-1">
              {by_location.map((loc, i) => {
                const maxVal = by_location[0]?.value || 1;
                const pct = Math.round((loc.value / maxVal) * 100);
                return (
                  <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>{loc.name}</span>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: '#7FBFB3' }}>{loc.value}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                      <div style={{ height: 4, width: `${pct}%`, background: 'linear-gradient(90deg,#7FBFB3,#C6A75C)', borderRadius: 4, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ISP Leaderboard */}
      <div className="glass-card p-8" style={{ borderTop: '3px solid #1E3A8A' }}>
        <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '16px' }}>ISP Performance Leaderboard</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}>
          {['ISP', 'Total', 'Resolved', 'Critical', 'Resolution Rate'].map(h => (
            <span key={h} style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</span>
          ))}
        </div>
        {by_isp.map((isp, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>{isp.name}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>{isp.total}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#7FBFB3' }}>{isp.resolved}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#C1121F' }}>{isp.critical}</span>
            <div className="flex items-center gap-2">
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                <div style={{ height: 6, width: `${isp.resolution_rate}%`, background: isp.resolution_rate >= 80 ? '#7FBFB3' : isp.resolution_rate >= 50 ? '#C6A75C' : '#C1121F', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', minWidth: '36px' }}>{isp.resolution_rate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AlertsView = ({ token, logout }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ stakeholder_name: '', tier: 'CRITICAL', email: '', is_enabled: true });

  const tierDescriptions = {
    INFO: 'All logged network incidents',
    WARNING: 'Major and critical incidents',
    CRITICAL: 'Critical outages only'
  };

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
        setForm({ stakeholder_name: '', tier: form.tier, email: '', is_enabled: true });
        loadRules();
      }
    } catch (e) { console.error('Failed to add rule'); }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await fetch(`/api/notification-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      loadRules();
    } catch (e) { console.error('Failed to update rule'); }
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
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stakeholder Name</label>
                <input
                  value={form.stakeholder_name}
                  onChange={e => setForm({ ...form, stakeholder_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-accent-gold"
                  placeholder="e.g. ICT Manager"
                />
              </div>
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
                <p className="text-[10px] font-bold text-text-muted">{form.tier} - {tierDescriptions[form.tier]}</p>
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
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-text-muted">
                <input
                  type="checkbox"
                  checked={form.is_enabled}
                  onChange={e => setForm({ ...form, is_enabled: e.target.checked })}
                />
                Enabled
              </label>
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
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                          <Mail size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-widest">No alert rules configured</p>
                          <p className="text-xs text-text-muted mt-1">Add ICT Manager, Engineers, or NOC Desk recipients for network escalations.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white">{rule.stakeholder_name || 'Stakeholder'}</span>
                        <span className="text-[10px] text-text-muted">{rule.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        rule.tier === 'CRITICAL' ? 'border-accent-red text-accent-red' : 
                        rule.tier === 'WARNING' ? 'border-accent-gold text-accent-gold' : 'border-accent-teal text-accent-teal'
                      }`}>{rule.tier}</span>
                      <p className="text-[10px] text-text-muted mt-1">{tierDescriptions[rule.tier]}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleUpdate(rule.id, { is_enabled: !rule.is_enabled })}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full ${rule.is_enabled ? 'status-resolved' : 'bg-white/5 text-text-muted'}`}
                      >
                        {rule.is_enabled ? 'Enabled' : 'Paused'}
                      </button>
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

const Dashboard = ({ stats, setPeriod, handleExport, setActiveTab, logs, setSelectedLogId, setShowDeleteModal, notifications }) => {
  const activeLogs = logs.filter(log => ACTIVE_STATUSES.includes(log.status));
  const criticalActive = activeLogs.filter(log => log.severity === 'Critical');
  const latestIncident = logs?.[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {criticalActive.length > 0 && (
        <div className="glass-card p-4 border-t-4 border-t-accent-red flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-red/10 flex items-center justify-center text-accent-red">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-accent-red">Critical Active Fault</p>
              <p className="text-sm font-bold text-white">{criticalActive[0].location} internet outage</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('active')} className="premium-button-red text-xs py-3">VIEW ACTIVE</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 min-h-[150px] flex flex-col justify-between border-t-4 border-t-accent-red">
          <div className="flex justify-between items-start"><span className="text-sm font-bold text-text-muted uppercase tracking-wider">Active faults</span><AlertTriangle className="text-accent-red" size={24} /></div>
          <div className="flex justify-center items-center flex-1">
            <span className="text-5xl font-black text-white leading-none">{stats.active_faults ?? activeLogs.length}</span>
          </div>
          <button onClick={() => setActiveTab('active')} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase text-white tracking-widest border border-white/5">VIEW QUEUE</button>
        </div>
        <div className="glass-card p-6 min-h-[150px] flex flex-col justify-between border-t-4 border-t-accent-gold">
          <div className="flex justify-between items-start"><span className="text-sm font-bold text-text-muted uppercase tracking-wider">Critical</span><ShieldCheck className="text-accent-gold" size={24} /></div>
          <div className="flex justify-center items-center flex-1">
            <span className="text-5xl font-black text-white leading-none">{stats.critical_incidents ?? criticalActive.length}</span>
          </div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Needs fastest response</p>
        </div>
        <div className="glass-card p-6 min-h-[150px] flex flex-col justify-between border-t-4 border-t-accent-teal">
          <div className="flex justify-between items-start"><span className="text-sm font-bold text-text-muted uppercase tracking-wider">Resolved today</span><CheckCircle className="text-accent-teal" size={24} /></div>
          <div className="flex justify-center items-center flex-1">
            <span className="text-5xl font-black text-white leading-none">{stats.resolved_today}</span>
          </div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Closed operational work</p>
        </div>
        <div className="glass-card p-6 min-h-[150px] flex flex-col justify-between border-t-4 border-t-primary-blue cursor-pointer hover:bg-white/5 transition-all" onClick={() => setActiveTab('analytics')}>
          <div className="flex justify-between items-start"><span className="text-sm font-bold text-text-muted uppercase tracking-wider">Most affected ISP</span><BarChart3 className="text-primary-blue" size={24} /></div>
          <div className="flex justify-center items-center flex-1 text-center">
            <span className="text-3xl font-black text-white truncate">{stats.most_affected_isp || 'None'}</span>
          </div>
          <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/5">OPEN ANALYTICS</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[['day', stats.day_logs_count, 'Day logs', 'border-t-accent-red'], ['week', stats.week_logs_count, 'Weekly logs', 'border-t-accent-teal'], ['month', stats.month_logs_count, 'Monthly logs', 'border-t-primary-blue']].map(([key, value, label, border]) => (
          <div key={key} className={`glass-card p-6 min-h-[150px] flex flex-col justify-between border-t-4 ${border}`}>
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold text-text-muted uppercase tracking-wider">{label}</span>
              {key === 'day' ? <AlertTriangle className="text-accent-red" size={22} /> : key === 'week' ? <CheckCircle className="text-accent-teal" size={22} /> : <History className="text-primary-blue" size={22} />}
            </div>
            <div className="flex justify-center items-center flex-1">
              <span className="text-5xl font-black text-white leading-none">{value}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPeriod(key)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase text-white tracking-widest border border-white/5">VIEW</button>
              <button onClick={() => handleExport(key)} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white border border-white/5"><Download size={14} /></button>
            </div>
          </div>
        ))}
        <div className="glass-card p-6 min-h-[150px] flex flex-col justify-between border-t-4 border-t-accent-gold cursor-pointer hover:bg-white/5 transition-all" onClick={() => setActiveTab('history')}>
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Latest Incident</span>
            <Activity className="text-accent-gold" size={22} />
          </div>
          {latestIncident ? (
            <div className="flex flex-col items-center justify-center text-center flex-1">
              <span className="text-xl font-black text-white tracking-tight">{latestIncident.ticket_number || `BCC-NET-2026-${String(latestIncident.id).padStart(4, '0')}`}</span>
              <span className="text-sm font-bold text-text-muted uppercase tracking-widest mt-3">{latestIncident.location}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center flex-1">
              <span className="text-sm font-bold text-text-muted uppercase tracking-widest">No incidents yet</span>
            </div>
          )}
          <button className="w-full py-2 bg-accent-gold/10 hover:bg-accent-gold/20 rounded-lg text-[10px] font-black text-accent-gold uppercase tracking-widest border border-accent-gold/20">VIEW INCIDENT</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center"><h3 className="text-xl font-bold flex items-center gap-2"><Activity className="text-accent-teal" size={20} />Live Incident Feed</h3><button onClick={() => setActiveTab('log-incident')} className="premium-button-red flex items-center gap-2 text-sm"><PlusCircle size={18} /> LOG INCIDENT</button></div>
          <div className="glass-card overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-text-muted text-sm font-bold">No active network faults.</div>
            ) : (
              <table className="w-full text-left">
                <thead><tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-widest"><th className="px-6 py-4">Ticket</th><th className="px-6 py-4">Provider</th><th className="px-6 py-4">Severity</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Duration</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-white/5">{logs.slice(0, 8).map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-accent-gold">{log.ticket_number || `#${log.id}`}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-3">{log.attachment_path && (<div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0"><img src={`/api/${log.attachment_path}`} className="w-full h-full object-cover" alt="Log" /></div>)}<div className="flex flex-col"><span className="font-bold text-sm">{log.isp_name}</span><span className="text-[10px] text-text-muted flex items-center gap-1"><MapPin size={10} /> {log.location}</span></div></div></td>
                    <td className="px-6 py-4"><span className={`text-[10px] font-black px-2 py-0.5 rounded border ${log.severity === 'Critical' ? 'border-accent-red text-accent-red' : log.severity === 'Major' ? 'border-accent-gold text-accent-gold' : 'border-accent-teal text-accent-teal'}`}>{log.severity.toUpperCase()}</span></td>
                    <td className="px-6 py-4"><span className={`text-[10px] font-bold px-3 py-1 rounded-full ${getStatusClass(log.status)}`}>{log.status}</span></td>
                    <td className="px-6 py-4 text-xs text-text-muted">{formatDuration(log.created_at, log.resolved_at || log.closed_at)}</td>
                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-3"><button onClick={() => setActiveTab('history')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white"><ChevronRight size={16} /></button><Trash2 size={16} className="text-text-muted hover:text-accent-red cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedLogId(log.id); setShowDeleteModal(true); }} /></div></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
        <div className="space-y-6"><h3 className="text-xl font-bold flex items-center gap-2"><Bell className="text-accent-gold" size={20} />Live Notifications</h3><div className="space-y-4">{notifications.length === 0 ? (<div className="glass-card p-8 text-center text-text-muted italic text-sm">No recent activity.</div>) : notifications.map((n, i) => (<div key={i} className="glass-card p-4 border-l-4 border-accent-gold flex gap-3 animate-in slide-in-from-right duration-300"><div className="p-2 bg-accent-gold/10 rounded text-accent-gold h-fit"><Activity size={16} /></div><div><p className="text-xs font-bold text-white uppercase tracking-tighter">{n.event.replaceAll('_', ' ')}</p><p className="text-xs text-text-muted mt-1">Ref: <span className="text-white">{n.ticket || n.id || '-'}</span></p></div></div>))}</div></div>
      </div>
    </div>
  );
};

const ActiveFaultsView = ({ logs, formatDate, onResolve, onUpdateFault, assignees }) => {
  const activeLogs = logs.filter(l => ACTIVE_STATUSES.includes(l.status));

  const updateStatus = async (log, status) => {
    if (status === 'Resolved' || status === 'Closed') {
      onResolve(log);
      return;
    }
    await onUpdateFault(log.id, { status });
  };

  const updateAssignee = async (log, assigned_to) => {
    const payload = { assigned_to };
    if (assigned_to && log.status === 'Open') payload.status = 'Assigned';
    await onUpdateFault(log.id, payload);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Active Incidents</h2>
          <p className="text-xs text-text-muted mt-1">Critical faults stay sorted first for NOC visibility</p>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        {activeLogs.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm font-bold">No active network faults.</div>
        ) : (
          <table className="w-full text-left">
            <thead><tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-widest"><th className="px-6 py-4">Ticket</th><th className="px-6 py-4">Provider</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Severity</th><th className="px-6 py-4">Assigned</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Duration</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/5">{activeLogs.map(log => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-accent-gold">{log.ticket_number || `#${log.id}`}</td>
                <td className="px-6 py-4 font-bold">{log.isp_name}</td>
                <td className="px-6 py-4 text-sm text-text-muted">{log.location}</td>
                <td className="px-6 py-4"><span className={`text-[10px] font-black px-2 py-0.5 rounded border ${log.severity === 'Critical' ? 'border-accent-red text-accent-red' : log.severity === 'Major' ? 'border-accent-gold text-accent-gold' : 'border-accent-teal text-accent-teal'}`}>{log.severity.toUpperCase()}</span></td>
                <td className="px-6 py-4">
                  <select value={log.assigned_to || ''} onChange={e => updateAssignee(log, e.target.value)} className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none">
                    <option value="">Unassigned</option>
                    {assignees.map(a => <option key={a.id} value={a.username}>{a.username}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select value={log.status} onChange={e => updateStatus(log, e.target.value)} className={`text-[10px] font-bold px-3 py-2 rounded-lg border border-white/10 ${getStatusClass(log.status)}`}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4 text-xs text-white/70"><div className="flex flex-col"><span>{formatDuration(log.created_at)}</span><span className="text-[10px] text-text-muted">{formatDate(log.created_at)}</span></div></td>
                <td className="px-6 py-4 text-right"><button onClick={() => onResolve(log)} className="bg-accent-teal/20 text-accent-teal hover:bg-accent-teal hover:text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Mark Resolved</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const FaultLogsView = ({ logs, formatDate, setSelectedLogId, setShowDeleteModal, setActiveTab, token, logout, onUpdateFault, onResolve, assignees, refreshLogs }) => {
  const [viewingLog, setViewingLog] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [detailError, setDetailError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [ispFilter, setIspFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const uniqueIsps = Array.from(new Set(logs.map(l => l.isp_name).filter(Boolean))).sort();
  const uniqueLocations = Array.from(new Set(logs.map(l => l.location).filter(Boolean))).sort();

  const loadDetailData = async (faultId) => {
    try {
      const [timelineRes, commentsRes] = await Promise.all([
        fetch(`/api/faults/${faultId}/timeline`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/faults/${faultId}/comments`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (timelineRes.status === 401 || commentsRes.status === 401) return logout();
      if (timelineRes.ok) setTimeline(await timelineRes.json());
      if (commentsRes.ok) setComments(await commentsRes.json());
    } catch (err) {
      setDetailError('Failed to load incident history');
    }
  };

  useEffect(() => {
    if (viewingLog) loadDetailData(viewingLog.id);
  }, [viewingLog?.id]);

  const filteredLogs = logs.filter(log => {
    const haystack = [log.ticket_number, log.id, log.isp_name, log.location, log.fault_type, log.description, log.assigned_to, log.status].join(' ').toLowerCase();
    return (
      (!searchTerm || haystack.includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || log.status === statusFilter) &&
      (severityFilter === 'all' || log.severity === severityFilter) &&
      (ispFilter === 'all' || log.isp_name === ispFilter) &&
      (locationFilter === 'all' || log.location === locationFilter)
    );
  });

  const updateViewingLog = async (payload) => {
    try {
      const updated = await onUpdateFault(viewingLog.id, payload);
      setViewingLog(updated);
      await loadDetailData(viewingLog.id);
    } catch (err) {
      setDetailError(err.message || 'Failed to update incident');
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/faults/${viewingLog.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ comment: commentText.trim() })
      });
      if (res.status === 401) return logout();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to add comment');
      }
      setCommentText('');
      await loadDetailData(viewingLog.id);
      refreshLogs();
    } catch (err) {
      setDetailError(err.message || 'Failed to add comment');
    }
  };

  if (viewingLog) {
    const isImageAttachment = /\.(png|jpe?g|webp)$/i.test(viewingLog.attachment_path || '');

    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Incident Details</h3>
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">Ref: {viewingLog.ticket_number || `#${viewingLog.id}`}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setViewingLog(null)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-white/10">Back to Reports</button>
            <button onClick={() => { setViewingLog(null); setActiveTab('dashboard'); }} className="premium-button text-xs py-3 px-6">Dashboard</button>
          </div>
        </div>

        <div className="glass-card p-10 space-y-10 border-t-4 border-t-accent-gold">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Ticket</p><p className="font-mono text-accent-gold text-xl">{viewingLog.ticket_number || `#${viewingLog.id}`}</p></div>
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Provider</p><p className="font-bold text-white text-xl">{viewingLog.isp_name}</p></div>
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Location</p><p className="font-bold text-white text-xl">{viewingLog.location}</p></div>
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Status</p><select value={viewingLog.status} onChange={e => { if (e.target.value === 'Resolved' || e.target.value === 'Closed') onResolve(viewingLog); else updateViewingLog({ status: e.target.value }); }} className={`mt-1 text-[11px] font-bold px-4 py-2 rounded-lg border border-white/10 ${getStatusClass(viewingLog.status)}`}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Severity</p><span className={`inline-block mt-1 text-[11px] font-black px-3 py-1 rounded border ${viewingLog.severity === 'Critical' ? 'border-accent-red text-accent-red' : viewingLog.severity === 'Major' ? 'border-accent-gold text-accent-gold' : 'border-accent-teal text-accent-teal'}`}>{viewingLog.severity.toUpperCase()}</span></div>
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Assigned To</p><select value={viewingLog.assigned_to || ''} onChange={e => updateViewingLog({ assigned_to: e.target.value, status: e.target.value && viewingLog.status === 'Open' ? 'Assigned' : viewingLog.status })} className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"><option value="">Unassigned</option>{assignees.map(a => <option key={a.id} value={a.username}>{a.username}</option>)}</select></div>
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Logged At</p><p className="text-base text-text-muted font-medium">{formatDate(viewingLog.created_at)}</p></div>
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Resolved At</p><p className="text-base text-text-muted font-medium">{viewingLog.resolved_at ? formatDate(viewingLog.resolved_at) : 'Not Resolved'}</p></div>
            <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Duration</p><p className="text-base text-white font-bold">{formatDuration(viewingLog.created_at, viewingLog.resolved_at || viewingLog.closed_at)}</p></div>
          </div>

          <div>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mb-3 border-t border-white/10 pt-8">Incident Summary</p>
            <div className="p-6 bg-[#0f172a] rounded-2xl border border-white/5 text-base text-white/90 leading-relaxed whitespace-pre-wrap">{viewingLog.description || 'No description provided.'}</div>
          </div>

          {viewingLog.resolution_note && (
            <div>
              <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mb-3 border-t border-white/10 pt-8">Resolution Note</p>
              <div className="p-6 bg-accent-teal/10 rounded-2xl border border-accent-teal/20 text-base text-white/90 leading-relaxed whitespace-pre-wrap">{viewingLog.resolution_note}</div>
            </div>
          )}

          {viewingLog.attachment_path && (
            <div>
              <p className="text-[11px] font-black text-text-muted uppercase tracking-widest mb-3 border-t border-white/10 pt-8">Proof of Outage</p>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0f172a]/50 p-4 flex justify-center">
                {isImageAttachment ? <img src={`/api/${viewingLog.attachment_path}`} alt="Incident Attachment" className="max-w-full rounded-xl shadow-2xl" /> : <a href={`/api/${viewingLog.attachment_path}`} target="_blank" className="premium-button text-xs">OPEN ATTACHMENT</a>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/10 pt-8">
            <div className="space-y-4">
              <p className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><History size={14} /> Incident Timeline</p>
              <div className="space-y-3">{timeline.length === 0 ? <div className="p-6 bg-white/5 rounded-2xl text-sm text-text-muted">No timeline activity yet.</div> : timeline.map(item => <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5"><div className="flex justify-between gap-3"><p className="text-sm font-black text-white">{item.action}</p><p className="text-[10px] text-text-muted">{formatDate(item.created_at)}</p></div><p className="text-xs text-text-muted mt-1 whitespace-pre-wrap">{item.details}</p><p className="text-[10px] text-accent-gold mt-2 font-bold uppercase tracking-widest">{item.actor}</p></div>)}</div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14} /> Engineer Updates</p>
              <div className="space-y-3">{comments.length === 0 ? <div className="p-6 bg-white/5 rounded-2xl text-sm text-text-muted">No engineer updates yet.</div> : comments.map(comment => <div key={comment.id} className="p-4 bg-white/5 rounded-2xl border border-white/5"><p className="text-sm text-white whitespace-pre-wrap">{comment.comment}</p><p className="text-[10px] text-text-muted mt-2">{comment.created_by} - {formatDate(comment.created_at)}</p></div>)}</div>
              <div className="flex gap-3"><input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Add update..." className="flex-1 bg-[#1e293b]/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none" /><button onClick={addComment} className="premium-button px-4"><Send size={16} /></button></div>
              {detailError && <p className="text-[10px] text-accent-red font-bold">{detailError}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-white uppercase tracking-tight">Fault History</h2><div className="flex bg-white/5 p-1 rounded-lg border border-white/10"><Search size={16} className="text-text-muted mt-2 ml-2" /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search records..." className="bg-transparent border-none outline-none px-4 py-2 text-sm text-white w-64" /></div></div>
      <div className="glass-card p-4 flex gap-3 items-center">
        <Filter size={16} className="text-text-muted" />
        <select value={ispFilter} onChange={e => setIspFilter(e.target.value)} className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"><option value="all">All ISPs</option>{uniqueIsps.map(isp => <option key={isp} value={isp}>{isp}</option>)}</select>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"><option value="all">All Severities</option><option value="Critical">Critical</option><option value="Major">Major</option><option value="Minor">Minor</option></select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"><option value="all">All Statuses</option>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"><option value="all">All Locations</option>{uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
      </div>
      <div className="glass-card overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm font-bold">No fault records match the current filters.</div>
        ) : (
          <table className="w-full text-left">
            <thead><tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-widest"><th className="px-6 py-4">Ticket</th><th className="px-6 py-4">Provider</th><th className="px-6 py-4">Fault Type</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Assigned</th><th className="px-6 py-4">Duration</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/5">{filteredLogs.map(log => (<tr key={log.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setViewingLog(log)}><td className="px-6 py-4 text-xs font-mono text-accent-gold">{log.ticket_number || `#${log.id}`}</td><td className="px-6 py-4"><div className="flex items-center gap-3">{log.attachment_path && (<div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0"><img src={`/api/${log.attachment_path}`} className="w-full h-full object-cover" alt="Log" /></div>)}<span className="font-bold">{log.isp_name}</span></div></td><td className="px-6 py-4 text-sm">{log.fault_type}</td><td className="px-6 py-4"><span className={`text-[10px] font-bold px-3 py-1 rounded-full ${getStatusClass(log.status)}`}>{log.status}</span></td><td className="px-6 py-4 text-xs text-text-muted">{log.assigned_to || 'Unassigned'}</td><td className="px-6 py-4 text-xs text-text-muted">{formatDuration(log.created_at, log.resolved_at || log.closed_at)}</td><td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-3"><Eye size={16} className="text-text-muted hover:text-white cursor-pointer" onClick={(e) => { e.stopPropagation(); setViewingLog(log); }} /><Trash2 size={16} className="text-text-muted hover:text-accent-red cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedLogId(log.id); setShowDeleteModal(true); }} /></div></td></tr>))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const FaultLogsViewLegacy = ({ logs, formatDate, setSelectedLogId, setShowDeleteModal, setActiveTab }) => {
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
  isLoading,
  assignees
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
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8] ml-1">Assign Engineer</label>
              <div className="relative">
                <select
                  value={newFault.assigned_to}
                  onChange={e => setNewFault({ ...newFault, assigned_to: e.target.value })}
                  className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-accent-gold outline-none transition-all appearance-none font-bold"
                >
                  <option value="" className="bg-[#0f172a]">Unassigned</option>
                  {assignees.map(a => <option key={a.id} value={a.username} className="bg-[#0f172a]">{a.username}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
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
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
                <div className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                  selectedImage ? 'border-accent-teal bg-accent-teal/10' : 'border-white/10 bg-white/5 group-hover:border-accent-gold/50 group-hover:bg-accent-gold/5'
                }`}>
                  {selectedImage ? (
                    <div className="flex flex-col items-center gap-3">
                      {imagePreview ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-accent-teal shadow-xl">
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl border-2 border-accent-teal shadow-xl flex items-center justify-center bg-white/5">
                          <FileText className="text-accent-teal" size={28} />
                        </div>
                      )}
                      <p className="text-[11px] font-black uppercase tracking-widest text-accent-teal">File Attached</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-full bg-white/5">
                        <Camera size={28} className="text-text-muted group-hover:text-white transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-black uppercase tracking-widest text-white mb-1">Click to Upload</p>
                        <p className="text-[10px] font-bold text-text-muted">PNG, JPG, WEBP, PDF up to 10MB</p>
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

const UsersView = ({ token, logout }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Engineer' });
  const [resetPasswords, setResetPasswords] = useState({});
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    const res = await fetch('/api/users/', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401) return logout();
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => { loadUsers(); }, [token]);

  const createUser = async () => {
    setMessage('');
    const res = await fetch('/api/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.status === 401) return logout();
    if (res.ok) {
      setForm({ username: '', email: '', password: '', role: 'Engineer' });
      setMessage('User created.');
      loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.detail || 'Failed to create user.');
    }
  };

  const updateUser = async (id, payload) => {
    setMessage('');
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.status === 401) return logout();
    if (res.ok) {
      setMessage('User updated.');
      loadUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.detail || 'Failed to update user.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">User Management</h2>
        <p className="text-xs text-text-muted mt-1">Create accounts, assign roles, and reset passwords</p>
      </div>

      <div className="glass-card p-8 space-y-4 border-t-4 border-t-accent-gold">
        <div className="flex items-center gap-3 mb-2"><UserPlus className="text-accent-gold" size={20} /><h3 className="text-xl font-bold text-white uppercase tracking-tight">Create User</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none" />
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none" />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none" />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none"><option>Engineer</option><option>Viewer</option><option>Admin</option></select>
        </div>
        <button onClick={createUser} className="premium-button py-3 px-6 text-xs">CREATE USER</button>
        {message && <p className="text-xs font-bold text-accent-gold">{message}</p>}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-white/5 text-[10px] text-text-muted uppercase tracking-widest"><th className="px-6 py-4">Username</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Reset Password</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-white/5">{users.map(u => (
            <tr key={u.id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-bold text-white">{u.username}</td>
              <td className="px-6 py-4 text-sm text-text-muted">{u.email}</td>
              <td className="px-6 py-4"><select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })} className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"><option>Admin</option><option>Engineer</option><option>Viewer</option></select></td>
              <td className="px-6 py-4"><input type="password" value={resetPasswords[u.id] || ''} onChange={e => setResetPasswords({ ...resetPasswords, [u.id]: e.target.value })} placeholder="New password" className="bg-[#1e293b]/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none" /></td>
              <td className="px-6 py-4 text-right"><button onClick={() => updateUser(u.id, { password: resetPasswords[u.id] })} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Reset</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

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

const SpeedTestView = ({ token, logout }) => {
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
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center gap-8 border-2 border-accent-gold/20">
          <div className="w-28 h-28 bg-accent-gold/10 rounded-full flex items-center justify-center text-accent-gold animate-pulse">
            <Zap size={56} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Network Performance Test Ready</h3>
            <p className="text-text-muted max-w-sm mx-auto text-sm leading-relaxed">
              Run a live diagnostic to measure download, upload, and latency for the current gateway.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full max-w-sm">
            {['Download', 'Upload', 'Ping'].map(label => (
              <div key={label} className="network-stat-card bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="network-stat-label text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</p>
                <p className="text-lg font-black text-white mt-2">--</p>
              </div>
            ))}
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
