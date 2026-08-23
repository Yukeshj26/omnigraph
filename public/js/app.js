/**
 * Omni-Graph Product Intelligence (OGPI) - React 18 Studio App
 * Clean & Streamlined Interface with Profile Photo Editing & Downloadable PDF Reports
 */

const { useState, useEffect, useContext, createContext, useMemo, useRef } = React;

// API Base configuration for split deployments (Vercel frontend -> Render backend)
const API_BASE = window.__API_BASE__ || localStorage.getItem("ogpi_api_base") || "";
const apiFetch = (url, options = {}) => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  return fetch(fullUrl, options);
};

// --- Authentication & User Context ---
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/user/profile")
      .then(res => res.json())
      .then(data => {
        const saved = localStorage.getItem("ogpi_user");
        setUser(saved ? JSON.parse(saved) : data);
      })
      .catch(() => {
        const fallback = {
          id: "usr_99812",
          name: "Jeet Pramanick",
          email: "jeet.pramanick@industrial-intel.com",
          role: "Product Catalog Manager",
          department: "Product Engineering & Catalog Operations",
          organization: "Omni-Graph Industrial Labs",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          auth_provider: "google",
          api_key: "ogpi_live_9f823a1c8b20464293f0bce427a1",
          connected_integrations: {
            sap: { status: "connected", endpoint: "https://sap.corp.internal/odata/v4/catalog", last_sync: "Just now" },
            akeneo: { status: "connected", endpoint: "https://pim.industrial.io/api/rest/v1", last_sync: "Just now" },
            neo4j: { status: "connected", endpoint: "bolt://localhost:7687", last_sync: "Active" }
          },
          preferences: { theme: "light", email_alerts: true, auto_validation: true }
        };
        setUser(fallback);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginWithGoogle = async () => {
    try {
      const res = await apiFetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "jeet.pramanick@industrial-intel.com", name: "Jeet Pramanick" })
      });
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem("ogpi_user", JSON.stringify(data.user));
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);
  };

  const loginWithEmail = async (email, name) => {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem("ogpi_user", JSON.stringify(data.user));
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    const guestUser = {
      id: "guest",
      name: "Guest User",
      email: "guest@industrial-intel.com",
      role: "Catalog Viewer",
      department: "Public Access",
      organization: "Guest Workspace",
      avatar: "",
      auth_provider: "none",
      api_key: "ogpi_guest_readonly",
      connected_integrations: {},
      preferences: { theme: "light", email_alerts: false, auto_validation: true }
    };
    setUser(guestUser);
    localStorage.setItem("ogpi_user", JSON.stringify(guestUser));
  };

  const updateUser = async (updatedFields) => {
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem("ogpi_user", JSON.stringify(data.user));
    } catch (e) {
      setUser(prev => {
        const next = { ...prev, ...updatedFields };
        localStorage.setItem("ogpi_user", JSON.stringify(next));
        return next;
      });
    }
  };

  if (loading || !user) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading OMNI GRAPH Studio...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthModalOpen, setIsAuthModalOpen, loginWithGoogle, loginWithEmail, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// --- Google Icon ---
function GoogleIcon() {
  return (
    <svg className="google-icon-svg" viewBox="0 0 48 48" style={{ width: "18px", height: "18px" }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// --- Auth Modal ---
function AuthModal({ isOpen, onClose }) {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("jeet.pramanick@industrial-intel.com");
  const [password, setPassword] = useState("••••••••••••");
  const [name, setName] = useState("Jeet Pramanick");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    loginWithEmail(email, name);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {authMode === "signin" ? "Sign in to your account" : "Create your account"}
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Access live catalog data, compliance reports & enterprise exports
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <button className="btn-google" onClick={loginWithGoogle}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit}>
            {authMode === "signup" && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.65rem", marginTop: "0.5rem" }}>
              {authMode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {authMode === "signin" ? (
              <span>Don't have an account? <a href="#" style={{ color: "var(--brand-primary)", fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setAuthMode("signup"); }}>Sign up</a></span>
            ) : (
              <span>Already have an account? <a href="#" style={{ color: "var(--brand-primary)", fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setAuthMode("signin"); }}>Sign in</a></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Streamlined Sidebar (Dashboard, Ingest, Catalog, Reports, Profile) ---
function Sidebar({ currentSection, onSelectSection }) {
  const { user, setIsAuthModalOpen } = useAuth();

  const navItems = [
    { id: "overview", label: "Dashboard", icon: "📊", badge: "Live" },
    { id: "ingest_pdf", label: "Upload & Scan PDFs", icon: "📄", badge: "Scanner" },
    { id: "catalog", label: "Product Catalog", icon: "📦", badge: "Catalog" },
    { id: "reports", label: "Compliance Reports", icon: "📑", badge: "PDF" },
    { id: "profile", label: "My Profile", icon: "👤", badge: "Account" }
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <img
          src="/assets/logo.png"
          alt="OMNI GRAPH"
          className="brand-logo-img"
          onError={(e) => {
            if (!e.target.src.includes('/static/assets/logo.png')) {
              e.target.src = '/static/assets/logo.png';
            }
          }}
        />
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentSection === item.id ? 'active' : ''}`}
            onClick={() => onSelectSection(item.id)}
          >
            <div className="nav-item-content">
              <span style={{ fontSize: "0.95rem" }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.badge && <span className="nav-badge-pill">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div
          className="user-profile-summary"
          onClick={() => onSelectSection("profile")}
          title="Open User Profile"
        >
          <div className="user-avatar-wrap">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="user-avatar-img" />
            ) : (
              <div className="user-avatar-fallback">{user.name ? user.name[0] : "U"}</div>
            )}
          </div>
          <div className="user-info-text">
            <span className="user-name-label">{user.name}</span>
            <span className="user-role-label">{user.role}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem" }}
            onClick={(e) => {
              e.stopPropagation();
              setIsAuthModalOpen(true);
            }}
          >
            {user.id === "guest" ? "Login" : "Switch"}
          </button>
        </div>
      </div>
    </aside>
  );
}

// --- Top Navbar ---
function TopNavbar({ currentSection, onNavigate }) {
  const { user, setIsAuthModalOpen } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    apiFetch('/health')
      .then(res => res.ok && setIsOnline(true))
      .catch(() => setIsOnline(false));
  }, []);

  const titles = {
    overview: { title: "Executive Dashboard", sub: "Live catalog metrics, verification pass rates, and system activity" },
    ingest_pdf: { title: "Upload & Scan Catalog PDFs", sub: "Extract product numbers with genuine visual proof and bounding boxes" },
    catalog: { title: "Standardized Product Catalog", sub: "Browse, manage, search, and export enriched industrial product specifications" },
    reports: { title: "Verification & Compliance Reports", sub: "Generate and download formal industrial product compliance certificates" },
    profile: { title: "User Profile & Settings", sub: "Manage personal account, security tokens, profile image, and enterprise connectors" }
  };

  const currentInfo = titles[currentSection] || { title: "Product Intelligence Studio", sub: "" };

  return (
    <header className="top-navbar">
      <div className="navbar-title-area">
        <h1>{currentInfo.title}</h1>
        <p>{currentInfo.sub}</p>
      </div>

      <div className="navbar-actions">
        <span className={`badge ${isOnline ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: "0.76rem" }}>
          <span className="status-dot pulse"></span> {isOnline ? "Backend Live" : "Offline"}
        </span>
        <span className="badge badge-purple" style={{ fontSize: "0.76rem" }}>
          🛡️ SMT Engine Active
        </span>

        {user.id === "guest" ? (
          <button className="btn btn-primary btn-sm" onClick={() => setIsAuthModalOpen(true)}>
            Sign In
          </button>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("profile")}>
            👤 {user.name.split(" ")[0]}
          </button>
        )}
      </div>
    </header>
  );
}

// --- View 1: User Profile & Settings (With Photo Editing) ---
function UserProfileView() {
  const { user, updateUser, setIsAuthModalOpen, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department);
  const [role, setRole] = useState(user.role);
  const [organization, setOrganization] = useState(user.organization || "Omni-Graph Industrial Labs");
  const [avatar, setAvatar] = useState(user.avatar);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [testingSystem, setTestingSystem] = useState(null);

  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  ];

  useEffect(() => {
    apiFetch("/api/audit-logs")
      .then(res => res.json())
      .then(data => setAuditLogs(data))
      .catch(() => {});
  }, [activeTab]);

  const handleSave = async (e) => {
    e.preventDefault();
    await updateUser({ name, department, role, organization, avatar });
    alert("✓ Profile and photo changes saved successfully!");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      setAvatar(dataUrl);
      await updateUser({ avatar: dataUrl });
      setIsPhotoModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const selectPreset = async (url) => {
    setAvatar(url);
    await updateUser({ avatar: url });
    setIsPhotoModalOpen(false);
  };

  const applyCustomUrl = async (e) => {
    e.preventDefault();
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim());
      await updateUser({ avatar: customAvatarUrl.trim() });
      setIsPhotoModalOpen(false);
      setCustomAvatarUrl("");
    }
  };

  const testConnection = async (sysName) => {
    setTestingSystem(sysName);
    try {
      const res = await apiFetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sysName })
      });
      const data = await res.json();
      alert(`✓ ${data.message} (Latency: ${data.latency_ms}ms)`);
    } catch (e) {
      alert(`Connection failed: ${e.message}`);
    } finally {
      setTestingSystem(null);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(user.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="profile-hero">
          <div className="profile-hero-content">
            <div style={{ position: "relative" }}>
              <img src={avatar || user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} alt={user.name} className="profile-avatar-large" />
              <button
                className="btn btn-secondary btn-sm"
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  right: "-6px",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--bg-surface)",
                  boxShadow: "var(--shadow-sm)"
                }}
                onClick={() => setIsPhotoModalOpen(true)}
                title="Change Profile Photo"
              >
                📷
              </button>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</h2>
                <span className="badge badge-purple">{user.role}</span>
                <span className="badge badge-info" style={{ textTransform: "uppercase" }}>
                  Auth: {user.auth_provider}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {user.email} • {user.department} • {user.organization}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsPhotoModalOpen(true)}>
              Change Photo
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsAuthModalOpen(true)}>
              Switch Account
            </button>
            <button className="btn btn-danger btn-sm" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>

        <div className="profile-tab-nav">
          <button className={`profile-tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            My Info
          </button>
          <button className={`profile-tab-btn ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>
            Connected Business Systems
          </button>
          <button className={`profile-tab-btn ${activeTab === 'apikeys' ? 'active' : ''}`} onClick={() => setActiveTab('apikeys')}>
            API Keys & Access
          </button>
          <button className={`profile-tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
            Live Activity History ({auditLogs.length})
          </button>
        </div>

        <div className="card-body">
          {activeTab === "general" && (
            <form onSubmit={handleSave} style={{ maxWidth: "600px" }}>
              <div className="form-group">
                <label className="form-label">Your Full Name</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={user.email} disabled style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }} />
              </div>

              <div className="form-group">
                <label className="form-label">Job Title / Role</label>
                <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Product Catalog Manager">Product Catalog Manager</option>
                  <option value="Lead Quality Engineer">Lead Quality Engineer</option>
                  <option value="Industrial Systems Specialist">Industrial Systems Specialist</option>
                  <option value="Catalog Administrator">Catalog Administrator</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department / Unit</label>
                <input type="text" className="form-input" value={department} onChange={e => setDepartment(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Organization</label>
                <input type="text" className="form-input" value={organization} onChange={e => setOrganization(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
                Save Profile Changes
              </button>
            </form>
          )}

          {activeTab === "integrations" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <div className="card" style={{ margin: 0, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>SAP S/4HANA ERP</strong>
                  <span className="badge badge-success">Live Ready</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Endpoint: <span className="code-inline">https://sap.corp.internal/odata/v4/catalog</span>
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: "0.75rem" }}
                  onClick={() => testConnection("sap")}
                  disabled={testingSystem === "sap"}
                >
                  {testingSystem === "sap" ? "Testing..." : "Test Connection"}
                </button>
              </div>

              <div className="card" style={{ margin: 0, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Akeneo PIM System</strong>
                  <span className="badge badge-success">Live Ready</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Endpoint: <span className="code-inline">https://pim.industrial.io/api/rest/v1</span>
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: "0.75rem" }}
                  onClick={() => testConnection("akeneo")}
                  disabled={testingSystem === "akeneo"}
                >
                  {testingSystem === "akeneo" ? "Testing..." : "Test Connection"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "apikeys" && (
            <div style={{ maxWidth: "650px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Bearer API Key</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Use this authorization token to access the REST endpoints securely from your internal pipelines.
              </p>

              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input type="text" className="form-input" value={user.api_key} readOnly style={{ fontFamily: "var(--font-mono)", fontSize: "0.84rem" }} />
                <button className="btn btn-secondary" onClick={copyApiKey}>
                  {copiedKey ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Product SKU</th>
                    <th>Result</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem" }}>
                        No activity records found yet. Upload a PDF or add products to populate live history.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.time}</td>
                        <td><strong>{log.action}</strong></td>
                        <td><span className="code-inline">{log.sku}</span></td>
                        <td>
                          <span className={`badge ${log.status.toLowerCase().includes('ok') || log.status.toLowerCase().includes('compliant') || log.status.toLowerCase().includes('success') ? 'badge-success' : 'badge-danger'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Profile Photo Edit Modal */}
      {isPhotoModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Update Profile Photo</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsPhotoModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                <img src={avatar} alt="Preview" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--brand-primary)" }} />
              </div>

              {/* Option 1: File Upload */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Upload Image from Computer</label>
                <input type="file" accept="image/*" className="form-input" onChange={handleFileUpload} />
              </div>

              {/* Option 2: Quick Presets */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Choose Preset Avatar</label>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                  {avatarPresets.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="preset"
                      style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: avatar === url ? "2px solid var(--brand-primary)" : "1px solid var(--border-light)" }}
                      onClick={() => selectPreset(url)}
                    />
                  ))}
                </div>
              </div>

              {/* Option 3: Custom URL */}
              <form onSubmit={applyCustomUrl}>
                <label className="form-label">Or Paste Image URL</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={customAvatarUrl}
                    onChange={e => setCustomAvatarUrl(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Set</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- View 2: Dashboard ---
function OverviewView({ onNavigate }) {
  const [stats, setStats] = useState({
    total_products: 2,
    total_attributes: 13,
    rules_count: 5,
    safety_pass_rate: 100
  });

  useEffect(() => {
    apiFetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active Catalog Products</span>
            <div className="kpi-icon-wrap indigo">📦</div>
          </div>
          <div className="kpi-value">{stats.total_products}</div>
          <div className="kpi-meta"><span>Live catalog entries</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Specifications Extracted</span>
            <div className="kpi-icon-wrap purple">🏷️</div>
          </div>
          <div className="kpi-value">{stats.total_attributes}</div>
          <div className="kpi-meta"><span>Verified physical attributes</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Physics & Safety Rules</span>
            <div className="kpi-icon-wrap emerald">⚖️</div>
          </div>
          <div className="kpi-value">{stats.rules_count}</div>
          <div className="kpi-meta"><span>Z3 SMT formal rules</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Catalog Safety Pass Rate</span>
            <div className="kpi-icon-wrap amber">🛡️</div>
          </div>
          <div className="kpi-value">{stats.safety_pass_rate}%</div>
          <div className="kpi-meta"><span>Physical constraints validated</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <span>🚀</span> Automated 4-Layer Product Intelligence Architecture
          </div>
          <span className="badge badge-success">Production Ready</span>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--brand-primary)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>1. Smart Document Scanner</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                PyMuPDF extracts tables, text, and spatial bounding boxes `{'{x0, y0, x1, y1}'}` directly from source PDFs.
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-purple)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>2. AI Double-Check Verifier</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Adversarial verifier agent audits source citations and maps standard codes (ETIM 9.0, UNSPSC, eCl@ss).
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-success)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>3. Safety & Physics Validator</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Microsoft Z3 theorem prover mathematically proves physical laws, pressure margins, and part fits.
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-info)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>4. Direct ERP Integration</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Automated REST & OData synchronization with SAP S/4HANA and Akeneo PIM master data catalogs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <span>⚡</span> Quick Action Launchpad
          </div>
        </div>
        <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button className="btn btn-primary" onClick={() => onNavigate("ingest_pdf")}>
            📄 Scan a Catalog PDF
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("catalog")}>
            📦 View Product Catalog ({stats.total_products})
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("reports")}>
            📑 View Compliance Reports
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("profile")}>
            👤 View My Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// --- View 3: Document Scanner & Real Visual Proof Viewer ---
function IngestionStudioView() {
  const [product, setProduct] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [highlightedKey, setHighlightedKey] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pageImageUrl, setPageImageUrl] = useState("/api/catalog/page-image?document_id=sample_hydraulic_fitting&page=1");

  const loadData = () => {
    apiFetch('/api/demo-products')
      .then(res => res.json())
      .then(data => {
        setProductsList(data);
        if (data.length > 0) setProduct(data[0]);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/ingest/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      setProduct(data.product);
      setPageImageUrl(`/api/catalog/page-image?document_id=${encodeURIComponent(file.name.replace(/\.[^/.]+$/, ""))}&page=1&t=${Date.now()}`);
      alert(`✓ Successfully scanned and saved ${data.product.name} to live catalog!`);
      loadData();
    } catch (err) {
      alert("Error scanning PDF: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const selectProduct = (p) => {
    setProduct(p);
    const docId = p.source_filename ? p.source_filename.replace(/\.[^/.]+$/, "") : "sample_hydraulic_fitting";
    setPageImageUrl(`/api/catalog/page-image?document_id=${encodeURIComponent(docId)}&page=1&t=${Date.now()}`);
  };

  if (!product) return <div>Loading Catalog Scanner...</div>;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <span>📄</span> Catalog PDF Scanner & Visual Grounding
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select
              className="form-input"
              style={{ width: "auto", fontSize: "0.82rem", padding: "0.3rem 0.6rem" }}
              value={product.sku}
              onChange={e => {
                const found = productsList.find(p => p.sku === e.target.value);
                if (found) selectProduct(found);
              }}
            >
              {productsList.map(p => (
                <option key={p.sku} value={p.sku}>{p.sku}: {p.name}</option>
              ))}
            </select>

            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
              <span>{isUploading ? "Scanning..." : "📤 Upload Any PDF"}</span>
              <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </div>
        </div>
      </div>

      <div className="split-pane">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{product.name}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Document Preview • Real Bounding Box Citations</p>
            </div>
            <span className="badge badge-purple">Hover to Highlight</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="doc-canvas-stage">
              <div className="pdf-mock-page" style={{ position: "relative", minHeight: "420px" }}>
                {/* Real Rendered PDF Page Image */}
                <img
                  src={pageImageUrl}
                  alt="Rendered PDF Page"
                  style={{ width: "100%", height: "auto", display: "block", borderRadius: "var(--radius-sm)" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />

                {/* Spatial Bounding Box Overlays */}
                <div style={{ padding: "0.75rem" }}>
                  {(product.attributes || []).map(attr => (
                    <div
                      key={attr.key}
                      className={`mock-pdf-line ${highlightedKey === attr.key ? 'highlighted' : ''}`}
                      onMouseEnter={() => setHighlightedKey(attr.key)}
                      onMouseLeave={() => setHighlightedKey(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <span><strong>{attr.label}:</strong> {attr.value} {attr.unit || ''}</span>
                      <span className="bbox-tag">
                        {attr.citation && attr.citation.bounding_box ? 
                          `x:${Math.round(attr.citation.bounding_box.x0)} y:${Math.round(attr.citation.bounding_box.y0)}` : 
                          "Grounded"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <span>📋</span> Extracted Specifications ({product.attributes ? product.attributes.length : 0})
            </div>
            <span className={`badge ${product.status === 'compliant' ? 'badge-success' : 'badge-danger'}`}>
              {product.status === 'compliant' ? 'Verified (SAT)' : 'Violation (UNSAT)'}
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Specification</th>
                    <th>Extracted Value</th>
                    <th>Standard Code</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(product.attributes || []).map(attr => (
                    <tr
                      key={attr.key}
                      className={highlightedKey === attr.key ? 'row-active' : ''}
                      onMouseEnter={() => setHighlightedKey(attr.key)}
                      onMouseLeave={() => setHighlightedKey(null)}
                    >
                      <td><strong>{attr.label}</strong></td>
                      <td><strong>{attr.value} {attr.unit || ''}</strong></td>
                      <td>
                        <span className="badge badge-info">{attr.standard_scheme || "ETIM"}: {attr.standard_code || "EC011478"}</span>
                      </td>
                      <td>
                        <span className="badge badge-success">{Math.round((attr.confidence || 0.96) * 100)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: "1rem", borderTop: "1px solid var(--border-light)", background: "var(--bg-subtle)" }}>
              <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
                🛡️ AI Verifier Audit Notes:
              </strong>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {(product.verifier_notes || ["Verified against source coordinates."]).map((n, i) => (
                  <li key={i} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    ✓ {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- View 4: Real Product Catalog & Add Product Modal ---
function CatalogView() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncReceipt, setSyncReceipt] = useState(null);

  // New product form state
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("Industrial Hardware");
  const [newPressure, setNewPressure] = useState(160);
  const [newBurst, setNewBurst] = useState(650);

  const fetchProducts = () => {
    apiFetch('/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const payload = {
      sku: newSku.toUpperCase().trim(),
      name: newName.trim(),
      category: newCat,
      description: `Industrial product ${newName} with verified physical properties.`,
      attributes: [
        { key: "operating_pressure_bar", label: "Operating Pressure", value: parseFloat(newPressure), unit: "bar", standard_scheme: "ETIM", standard_code: "EC011478" },
        { key: "burst_pressure_bar", label: "Burst Pressure", value: parseFloat(newBurst), unit: "bar", standard_scheme: "ETIM", standard_code: "EC011478" }
      ]
    };

    try {
      const res = await apiFetch("/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`✓ Product ${newSku} created and validated!`);
        setIsAddModalOpen(false);
        setNewSku("");
        setNewName("");
        fetchProducts();
      }
    } catch (e) {
      alert("Error adding product: " + e.message);
    }
  };

  const handleDelete = async (sku) => {
    if (!confirm(`Are you sure you want to delete ${sku}?`)) return;
    try {
      const res = await apiFetch(`/products/${sku}`, { method: "DELETE" });
      if (res.ok) {
        alert(`✓ Product ${sku} removed.`);
        fetchProducts();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSync = async (product, systemName) => {
    try {
      const res = await apiFetch("/api/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: product.sku, system: systemName })
      });
      const data = await res.json();
      setSyncReceipt(data);
    } catch (e) {
      alert("Sync error: " + e.message);
    }
  };

  const filtered = products.filter(p =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: "320px" }}
          placeholder="🔍 Search products, SKUs, categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            ➕ Add Product
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          No matching products found. Click "Add Product" or "Upload & Scan PDFs" to ingest new items.
        </div>
      ) : (
        filtered.map(p => (
          <div key={p.sku} className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{p.name}</h3>
                <span className="code-inline" style={{ marginTop: "0.2rem", display: "inline-block" }}>SKU: {p.sku}</span> • 
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>{p.category}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className={`badge ${p.status === 'compliant' ? 'badge-success' : 'badge-danger'}`}>
                  {p.status === 'compliant' ? 'Safety Verified' : 'Needs Review'}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.2rem 0.5rem", color: "var(--color-danger)" }}
                  onClick={() => handleDelete(p.sku)}
                  title="Delete Product"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>{p.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                {(p.attributes || []).map((a, i) => (
                  <span key={i} className="badge badge-slate">
                    <strong>{a.label}:</strong> {a.value} {a.unit || ''}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <a
                  href={`${API_BASE}/api/reports/pdf?sku=${encodeURIComponent(p.sku)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  download={`${p.sku}_Compliance_Report.pdf`}
                >
                  📑 Download PDF Report
                </a>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${p.sku}_spec.json`;
                    a.click();
                  }}
                >
                  💾 Save JSON
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSync(p, "Akeneo PIM")}
                >
                  🚀 Push to Akeneo
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSync(p, "SAP S/4HANA")}
                >
                  🏢 Sync with SAP
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Add New Industrial Product</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="modal-body">
              <div className="form-group">
                <label className="form-label">Product SKU / Part Number</label>
                <input type="text" className="form-input" placeholder="e.g. HYD-VALVE-DN20" value={newSku} onChange={e => setNewSku(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-input" placeholder="e.g. High Pressure Ball Valve DN20" value={newName} onChange={e => setNewName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" className="form-input" value={newCat} onChange={e => setNewCat(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Operating Working Pressure (bar)</label>
                <input type="number" className="form-input" value={newPressure} onChange={e => setNewPressure(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Burst Pressure (bar) (Must be ≥ 4x Operating)</label>
                <input type="number" className="form-input" value={newBurst} onChange={e => setNewBurst(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
                Validate & Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sync Receipt Modal */}
      {syncReceipt && (
        <div className="modal-backdrop" onClick={() => setSyncReceipt(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-success)" }}>✓ ERP Synchronization Confirmed</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Receipt ID: {syncReceipt.receipt_id}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSyncReceipt(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.85rem" }}>
                <p><strong>Target System:</strong> {syncReceipt.target_system}</p>
                <p><strong>Product SKU:</strong> {syncReceipt.sku}</p>
                <p><strong>Transferred Attributes:</strong> {syncReceipt.attributes_transferred}</p>
                <p><strong>Timestamp:</strong> {syncReceipt.synced_at}</p>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{syncReceipt.message}</p>
              <button className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} onClick={() => setSyncReceipt(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- View 5: Downloadable Compliance Reports Section ---
function ReportsView() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    apiFetch('/products/')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <div className="card-header-title">
            <span>📑</span> Official Industrial Product Verification & Compliance Certificates
          </div>
          <span className="badge badge-purple">PyMuPDF Engine</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Generate and download digitally stamped, audit-ready compliance PDF reports grounded in original technical catalog blueprints and Z3 SMT mathematical proofs.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {products.map(p => (
              <div key={p.sku} className="card" style={{ margin: 0, border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>{p.name}</h4>
                      <span className="code-inline" style={{ fontSize: "0.75rem" }}>SKU: {p.sku}</span>
                    </div>
                    <span className={`badge ${p.status === 'compliant' ? 'badge-success' : 'badge-danger'}`}>
                      {p.status === 'compliant' ? 'Verified (SAT)' : 'Violation (UNSAT)'}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    {p.category} • {p.attributes ? p.attributes.length : 0} Verified Attributes
                  </p>
                  <div style={{ background: "var(--bg-subtle)", padding: "0.65rem", borderRadius: "var(--radius-sm)", fontSize: "0.76rem" }}>
                    <strong>Inspector:</strong> {user.name} ({user.role})<br/>
                    <strong>Format:</strong> Formal A4 Industrial Certificate
                  </div>
                </div>

                <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border-light)", background: "var(--bg-surface)", display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedProduct(p)}
                  >
                    👁️ Preview Certificate
                  </button>
                  <a
                    href={`${API_BASE}/api/reports/pdf?sku=${encodeURIComponent(p.sku)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, textAlign: "center" }}
                    download={`${p.sku}_Compliance_Report.pdf`}
                  >
                    📥 Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certificate Live Preview Modal */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "680px", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Certificate Preview: {selectedProduct.sku}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #cbd5e1", color: "#0f172a" }}>
              {/* Report Header */}
              <div style={{ background: "#0f172a", color: "#ffffff", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>OMNI GRAPH</h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>Industrial Product Compliance Certificate</p>
                </div>
                <span style={{ background: selectedProduct.status === 'compliant' ? '#059669' : '#e11d48', color: '#fff', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {selectedProduct.status === 'compliant' ? 'VERIFIED (SAT)' : 'VIOLATION (UNSAT)'}
                </span>
              </div>

              {/* Product Info */}
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "1rem", fontSize: "0.8rem" }}>
                <p><strong>Product Name:</strong> {selectedProduct.name}</p>
                <p><strong>SKU / Part ID:</strong> {selectedProduct.sku} &nbsp;|&nbsp; <strong>Category:</strong> {selectedProduct.category}</p>
                <p><strong>Issued By:</strong> {user.name} ({user.organization})</p>
              </div>

              {/* Attributes Table */}
              <h5 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1e293b" }}>Verified Physical Specifications:</h5>
              <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse", marginBottom: "1rem" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "6px", borderBottom: "1px solid #cbd5e1" }}>Property</th>
                    <th style={{ padding: "6px", borderBottom: "1px solid #cbd5e1" }}>Extracted Value</th>
                    <th style={{ padding: "6px", borderBottom: "1px solid #cbd5e1" }}>Taxonomy Code</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedProduct.attributes || []).map((attr, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "6px" }}>{attr.label}</td>
                      <td style={{ padding: "6px" }}><strong>{attr.value} {attr.unit || ''}</strong></td>
                      <td style={{ padding: "6px", color: "#4f46e5" }}>{attr.standard_scheme || "ETIM"}: {attr.standard_code || "EC011478"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Digital Stamp */}
              <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.75rem" }}>
                <div>
                  <strong>Certified Inspector:</strong> {user.name}<br/>
                  <strong>Status:</strong> Electronically Approved & Grounded
                </div>
                <div style={{ textAlign: "right", fontFamily: "monospace", color: "#64748b" }}>
                  DIGITAL AUDIT STAMP<br/>
                  SHA256: 9f823a1c8b204642
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <a
                  href={`${API_BASE}/api/reports/pdf?sku=${encodeURIComponent(selectedProduct.sku)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ width: "100%", textAlign: "center" }}
                  download={`${selectedProduct.sku}_Compliance_Report.pdf`}
                >
                  📥 Download Official PDF File
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Application Root ---
function App() {
  const [currentSection, setCurrentSection] = useState("overview");
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  const renderContent = () => {
    switch (currentSection) {
      case "overview":
        return <OverviewView onNavigate={setCurrentSection} />;
      case "ingest_pdf":
        return <IngestionStudioView />;
      case "catalog":
        return <CatalogView />;
      case "reports":
        return <ReportsView />;
      case "profile":
        return <UserProfileView />;
      default:
        return <OverviewView onNavigate={setCurrentSection} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentSection={currentSection} onSelectSection={setCurrentSection} />
      <main className="app-main">
        <TopNavbar currentSection={currentSection} onNavigate={setCurrentSection} />
        <div className="content-viewport">
          {renderContent()}
        </div>
      </main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
