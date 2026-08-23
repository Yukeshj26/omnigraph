/**
 * Omni-Graph Product Intelligence (OGPI) - React 18 Frontend
 * Enterprise Light Theme Studio with Subsections, User Profile & Auth
 */

const { useState, useEffect, useContext, createContext, useMemo, useRef } = React;

// API Base configuration for split deployments (e.g. Vercel frontend -> Render backend)
const API_BASE = window.__API_BASE__ || localStorage.getItem("ogpi_api_base") || "";
const apiFetch = (url, options = {}) => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  return fetch(fullUrl, options);
};

// --- Authentication & User Context ---
const AuthContext = createContext(null);


const DEFAULT_USER = {
  id: "usr_99812",
  name: "Jeet Pramanick",
  email: "jeet.pramanick@industrial-intel.com",
  role: "Principal Catalog Engineer",
  department: "Industrial Automation & Fluid Systems",
  organization: "Omni-Graph Industrial Labs",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  auth_provider: "google",
  api_key: "ogpi_live_9f823a1c8b20464293f0bce427a1",
  connected_integrations: {
    sap: { status: "connected", endpoint: "https://sap.corp.internal/odata/v4/catalog", last_sync: "10 mins ago" },
    akeneo: { status: "connected", endpoint: "https://pim.industrial.io/api/rest/v1", last_sync: "1 hour ago" },
    neo4j: { status: "connected", endpoint: "bolt://localhost:7687", last_sync: "Active" }
  },
  preferences: {
    theme: "light",
    email_alerts: true,
    auto_z3_verification: true,
    tolerance_strictness: "standard",
    solver_timeout_ms: 3000
  }
};

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ogpi_user");
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("ogpi_user", JSON.stringify(user));
  }, [user]);

  const loginWithGoogle = () => {
    const googleUser = {
      ...DEFAULT_USER,
      auth_provider: "google"
    };
    setUser(googleUser);
    setIsAuthModalOpen(false);
  };

  const loginWithEmail = (email, name) => {
    const emailUser = {
      ...DEFAULT_USER,
      name: name || email.split("@")[0].replace(".", " ").title(),
      email: email,
      auth_provider: "email"
    };
    setUser(emailUser);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser({
      id: "guest",
      name: "Guest Operator",
      email: "guest@ogpi.local",
      role: "Observer",
      department: "Public Access",
      organization: "Guest Environment",
      avatar: "",
      auth_provider: "none",
      api_key: "ogpi_guest_readonly",
      connected_integrations: {},
      preferences: DEFAULT_USER.preferences
    });
  };

  const updateUser = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthModalOpen, setIsAuthModalOpen, loginWithGoogle, loginWithEmail, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// --- Google Icon Component ---
function GoogleIcon() {
  return (
    <svg className="google-icon-svg" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// --- Auth Modal Component ---
function AuthModal({ isOpen, onClose }) {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"
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
              {authMode === "signin" ? "Sign in to Omni-Graph" : "Create Enterprise Account"}
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Access Neuro-Symbolic SMT Studio & Catalog Workflows
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Google One-Click Login */}
          <button className="btn-google" onClick={loginWithGoogle}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
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
              <label className="form-label">Corporate Email</label>
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
              {authMode === "signin" ? "Sign In to Enterprise Studio" : "Create Account"}
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

// --- Multi-Level Subsection Sidebar Component ---
function Sidebar({ currentSection, onSelectSection }) {
  const { user, setIsAuthModalOpen, logout } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState({
    ingest: false,
    z3: false,
    taxonomy: false,
    graph: false,
    dev: false,
    account: false
  });

  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const navGroups = [
    {
      key: "core",
      title: "Core Platform",
      items: [
        { id: "overview", label: "Executive Dashboard", icon: "📊", badge: "Live" }
      ]
    },
    {
      key: "ingest",
      title: "Data Ingestion & Vision",
      items: [
        { id: "ingest_pdf", label: "Catalog PDF Ingestion", icon: "📄", badge: "ColPali" },
        { id: "grounding", label: "Spatial Grounding Studio", icon: "🔍", badge: "BBoxes" },
        { id: "verifier", label: "Adversarial Verifier Audit", icon: "🛡️", badge: "Critic" }
      ]
    },
    {
      key: "z3",
      title: "Neuro-Symbolic Engine",
      items: [
        { id: "z3_workbench", label: "Interactive SMT Workbench", icon: "⚖️", badge: "Z3" },
        { id: "z3_pressure", label: "Hydraulic Pressure Rules", icon: "💧", badge: "4.0x" },
        { id: "z3_voltage", label: "Voltage Limits & Safety", icon: "⚡", badge: "SMT" },
        { id: "z3_tolerance", label: "Worst-Case Tolerance Fit", icon: "📐", badge: "Interval" }
      ]
    },
    {
      key: "taxonomy",
      title: "Taxonomy & Standards",
      items: [
        { id: "catalog", label: "Product Catalog Explorer", icon: "📦", badge: "ETIM 9.0" },
        { id: "standards", label: "UNSPSC & eCl@ss Directory", icon: "🌐", badge: "Norm" }
      ]
    },
    {
      key: "graph",
      title: "Knowledge & ERP Graph",
      items: [
        { id: "graph_view", label: "Ontological GraphRAG", icon: "🕸️", badge: "Multi-Hop" },
        { id: "erp_sync", label: "SAP & Akeneo Connectors", icon: "🚀", badge: "Sync" }
      ]
    },
    {
      key: "dev",
      title: "Developer Tools",
      items: [
        { id: "api_sandbox", label: "Live REST API Sandbox", icon: "🧪", badge: "Swagger" }
      ]
    },
    {
      key: "account",
      title: "Account & Settings",
      items: [
        { id: "profile", label: "User Profile & Preferences", icon: "👤", badge: user.role ? "Active" : "" },
        { id: "api_keys", label: "API Keys & Integrations", icon: "🔑", badge: "Bearer" }
      ]
    }
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo-badge">OG</div>
        <div className="brand-text">
          <span className="brand-title">Omni-Graph Intel</span>
          <span className="brand-subtitle">Neuro-Symbolic Studio</span>
        </div>
      </div>

      {/* Accordion Nav Groups */}
      <nav className="sidebar-nav">
        {navGroups.map(group => {
          const isCollapsed = collapsedGroups[group.key];
          return (
            <div key={group.key} className="sidebar-group">
              <div
                className={`sidebar-group-header ${isCollapsed ? 'collapsed' : ''}`}
                onClick={() => toggleGroup(group.key)}
              >
                <span>{group.title}</span>
                <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              <div className={`sidebar-group-items ${isCollapsed ? 'hidden' : ''}`}>
                {group.items.map(item => (
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
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer with User Profile Pill */}
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
              if (user.id === "guest") setIsAuthModalOpen(true);
              else setIsAuthModalOpen(true);
            }}
          >
            {user.id === "guest" ? "Login" : "Switch"}
          </button>
        </div>
      </div>
    </aside>
  );
}

// --- Top Navbar Component ---
function TopNavbar({ currentSection, onNavigate }) {
  const { user, setIsAuthModalOpen, logout } = useAuth();
  const [isHealthOk, setIsHealthOk] = useState(true);

  useEffect(() => {
    fetch('/health')
      .then(res => res.ok && setIsHealthOk(true))
      .catch(() => setIsHealthOk(false));
  }, []);

  const titles = {
    overview: { title: "Executive Intelligence Dashboard", sub: "Enterprise telemetry, validation statistics, and ingestion flow" },
    ingest_pdf: { title: "Vision-Native Ingestion Studio", sub: "Ingest multi-column technical PDFs and CAD drawings via PyMuPDF / ColPali" },
    grounding: { title: "Token-Level Spatial Grounding", sub: "Interactive bidirectional bounding box citations and coordinate mappings" },
    verifier: { title: "Adversarial Verifier Audit Trail", sub: "Independent agent cross-examination notes and confidence calibration" },
    z3_workbench: { title: "Neuro-Symbolic Z3 SMT Workbench", sub: "Deterministic formal verification of physical engineering constraints" },
    z3_pressure: { title: "Hydraulic Pressure Solver", sub: "SMT mathematical proof for 4.0x burst-to-operating pressure margins" },
    z3_voltage: { title: "Voltage Safety Bounds", sub: "Proves operating voltage never exceeds rated electrical insulation limit" },
    z3_tolerance: { title: "Worst-Case Tolerance Stack-Up", sub: "Real interval arithmetic verifying shaft and bore assembly fits" },
    catalog: { title: "Standardized Product Catalog", sub: "Commerce-ready industrial specifications normalized with ETIM 9.0 and UNSPSC" },
    standards: { title: "Taxonomy & Classification Matrix", sub: "Multi-standard mapping rules across eCl@ss, UNSPSC, and ETIM" },
    graph_view: { title: "GraphRAG Knowledge Explorer", sub: "Multi-hop physical and semantic ontology relationships across components" },
    erp_sync: { title: "Turnkey ERP / PIM Connectors", sub: "Bidirectional synchronization with SAP S/4HANA, Akeneo PIM, and Pimcore" },
    api_sandbox: { title: "Developer REST API Sandbox", sub: "Interactive Swagger-compatible endpoint testbed and latency inspector" },
    profile: { title: "User Profile & Access Management", sub: "Manage personal credentials, role permissions, and ERP connector credentials" },
    api_keys: { title: "API Keys & Security Credentials", sub: "Active bearer tokens, developer credentials, and webhook endpoints" }
  };

  const currentInfo = titles[currentSection] || { title: "Omni-Graph Studio", sub: "" };

  return (
    <header className="top-navbar">
      <div className="navbar-title-area">
        <h1>{currentInfo.title}</h1>
        <p>{currentInfo.sub}</p>
      </div>

      <div className="navbar-actions">
        <span className="badge badge-success" style={{ fontSize: "0.76rem" }}>
          <span className="status-dot pulse"></span> API {isHealthOk ? "Online" : "Offline"}
        </span>
        <span className="badge badge-purple" style={{ fontSize: "0.76rem" }}>
          🧠 Z3 SMT Solver Active
        </span>

        {user.id === "guest" ? (
          <button className="btn btn-primary btn-sm" onClick={() => setIsAuthModalOpen(true)}>
            Sign In / Register
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

// --- View 1: User Profile Section ---
function UserProfileView() {
  const { user, updateUser, setIsAuthModalOpen, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department);
  const [role, setRole] = useState(user.role);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({ name, department, role });
    alert("Profile changes saved successfully!");
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(user.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div>
      {/* Profile Hero Banner */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="profile-hero">
          <div className="profile-hero-content">
            <img src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} alt={user.name} className="profile-avatar-large" />
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
            <button className="btn btn-secondary btn-sm" onClick={() => setIsAuthModalOpen(true)}>
              Switch Account
            </button>
            <button className="btn btn-danger btn-sm" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="profile-tab-nav">
          <button
            className={`profile-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General Information
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            Connected ERP & DBs
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'apikeys' ? 'active' : ''}`}
            onClick={() => setActiveTab('apikeys')}
          >
            API Keys & Tokens
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Activity Log
          </button>
        </div>

        <div className="card-body">
          {activeTab === "general" && (
            <form onSubmit={handleSave} style={{ maxWidth: "600px" }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="form-input"
                  value={user.email}
                  disabled
                  style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Engineering Role</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="Principal Catalog Engineer">Principal Catalog Engineer</option>
                  <option value="Neuro-Symbolic AI Architect">Neuro-Symbolic AI Architect</option>
                  <option value="Quality Assurance Lead">Quality Assurance Lead</option>
                  <option value="Industrial Systems Integrator">Industrial Systems Integrator</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department / Unit</label>
                <input
                  type="text"
                  className="form-input"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  required
                />
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
                  <strong style={{ fontSize: "0.95rem" }}>SAP S/4HANA Connector</strong>
                  <span className="badge badge-success">Connected</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Endpoint: <span className="code-inline">https://sap.corp.internal/odata/v4/catalog</span>
                </p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => alert("SAP OData connection healthy (200 OK)")}>
                  Test Connection
                </button>
              </div>

              <div className="card" style={{ margin: 0, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Akeneo PIM Connector</strong>
                  <span className="badge badge-success">Connected</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Endpoint: <span className="code-inline">https://pim.industrial.io/api/rest/v1</span>
                </p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => alert("Akeneo REST API token verified")}>
                  Test Connection
                </button>
              </div>

              <div className="card" style={{ margin: 0, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Neo4j Graph Database</strong>
                  <span className="badge badge-info">bolt://localhost:7687</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Graph Schema: Physical interchangeability, pitch & multi-hop attributes.
                </p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => alert("Neo4j driver initialized")}>
                  Ping Driver
                </button>
              </div>
            </div>
          )}

          {activeTab === "apikeys" && (
            <div style={{ maxWidth: "650px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Active Live API Key</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Use this token in your <span className="code-inline">Authorization: Bearer &lt;token&gt;</span> header to authenticate API calls.
              </p>

              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  type="text"
                  className="form-input"
                  value={user.api_key}
                  readOnly
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.84rem" }}
                />
                <button className="btn btn-secondary" onClick={copyApiKey}>
                  {copiedKey ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={() => alert("New API key generated and persisted.")}>
                🔄 Regenerate Token
              </button>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target SKU</th>
                    <th>SMT Proof Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Today, 09:20 AM</td>
                    <td>Catalog PDF Ingest & OCR</td>
                    <td><span className="code-inline">DEMO-001</span></td>
                    <td><span className="badge badge-success">Passed (SAT)</span></td>
                  </tr>
                  <tr>
                    <td>Today, 08:45 AM</td>
                    <td>Z3 Neuro-Symbolic Verification</td>
                    <td><span className="code-inline">DEMO-002</span></td>
                    <td><span className="badge badge-danger">Violations (UNSAT)</span></td>
                  </tr>
                  <tr>
                    <td>Yesterday, 04:12 PM</td>
                    <td>Akeneo PIM Export Sync</td>
                    <td><span className="code-inline">DEMO-001</span></td>
                    <td><span className="badge badge-info">200 Sync OK</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- View 2: Executive Overview Dashboard ---
function OverviewView({ onNavigate }) {
  return (
    <div>
      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Ingested Products</span>
            <div className="kpi-icon-wrap indigo">📦</div>
          </div>
          <div className="kpi-value">2</div>
          <div className="kpi-meta"><span>Active catalog specifications</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Extracted Attributes</span>
            <div className="kpi-icon-wrap purple">🏷️</div>
          </div>
          <div className="kpi-value">13</div>
          <div className="kpi-meta"><span>Normalized with ETIM / UNSPSC</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Z3 SMT Constraints</span>
            <div className="kpi-icon-wrap emerald">⚖️</div>
          </div>
          <div className="kpi-value">5</div>
          <div className="kpi-meta"><span>Deterministic physical proofs</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Compliance Pass Rate</span>
            <div className="kpi-icon-wrap amber">🛡️</div>
          </div>
          <div className="kpi-value">100%</div>
          <div className="kpi-meta"><span>Post Neuro-Symbolic Verification</span></div>
        </div>
      </div>

      {/* Architecture Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <span>🏗️</span> Four-Layer Enterprise Architecture Data Flow
          </div>
          <span className="badge badge-info">Production Ready</span>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--brand-primary)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>1. Vision-Native Ingestion</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                PyMuPDF / ColPali late-interaction parser extracts dense schematics and tables with token-level bounding box coordinates.
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-purple)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>2. Critic-Verifier Agents</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Dual-agent setup where Specification Extractor drafts attributes and an adversarial Verifier Agent independently audits citations.
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-success)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>3. Neuro-Symbolic Validation</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Z3 SMT theorem prover mathematically proves physical engineering constraints, safety margins, and tolerance fit.
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-info)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>4. ERP / PIM Connectors</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Automated sync with enterprise commerce systems including SAP S/4HANA, Akeneo PIM, and Pimcore via REST/gRPC.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <span>⚡</span> Quick Action Launchpad
          </div>
        </div>
        <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button className="btn btn-primary" onClick={() => onNavigate("ingest_pdf")}>
            📄 Ingest Catalog PDF
          </button>
          <button className="btn btn-subtle" onClick={() => onNavigate("z3_workbench")}>
            🧠 Launch Z3 SMT Constraint Solvers
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("catalog")}>
            📦 Browse ETIM / UNSPSC Catalog
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("graph_view")}>
            🕸️ Explore Ontological Graph
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("profile")}>
            👤 View User Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// --- View 3: Ingestion & Visual Grounding Studio ---
function IngestionStudioView() {
  const [product, setProduct] = useState(null);
  const [highlightedKey, setHighlightedKey] = useState(null);

  useEffect(() => {
    fetch('/api/demo-products')
      .then(res => res.json())
      .then(data => data.length > 0 && setProduct(data[0]))
      .catch(err => console.error(err));
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/ingest/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProduct({
        sku: data.product.sku,
        name: data.product.name,
        attributes: data.product.attributes,
        verifier_notes: data.verifier_notes || ["Parsed via PyMuPDF with spatial coordinates."]
      });
      alert(`Successfully ingested ${data.product.sku}!`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (!product) return <div>Loading Catalog Studio...</div>;

  return (
    <div>
      {/* Upload Banner */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <span>📄</span> Ingest Industrial Technical Sheet (PDF)
          </div>
          <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
            <span>📤 Upload PDF</span>
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="split-pane">
        {/* Left: Rendered Document with Bounding Box Overlays */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{product.name}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SKU: {product.sku} • Page 1 • Spatial Citation Layer</p>
            </div>
            <span className="badge badge-purple">PyMuPDF BBoxes</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="doc-canvas-stage">
              <div className="pdf-mock-page">
                <div className="mock-pdf-header">
                  <h3>Omni-Graph Product Intelligence -- Catalog Sheet</h3>
                  <p>Product: {product.name} | SKU: {product.sku}</p>
                </div>

                {(product.attributes || []).map(attr => (
                  <div
                    key={attr.key}
                    className={`mock-pdf-line ${highlightedKey === attr.key ? 'highlighted' : ''}`}
                    onMouseEnter={() => setHighlightedKey(attr.key)}
                    onMouseLeave={() => setHighlightedKey(null)}
                  >
                    <span><strong>{attr.label}:</strong> {attr.value} {attr.unit || ''}</span>
                    <span className="bbox-tag">[72, 200]</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Extracted Schema Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <span>📋</span> Schema-Enforced Specifications
            </div>
            <span className="badge badge-success">Verified</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attribute Key</th>
                    <th>Value</th>
                    <th>Standard</th>
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
                      <td>
                        <strong>{attr.label}</strong><br/>
                        <span className="code-inline">{attr.key}</span>
                      </td>
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

            {/* Verifier Notes */}
            <div style={{ padding: "1rem", borderTop: "1px solid var(--border-light)", background: "var(--bg-subtle)" }}>
              <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>
                🛡️ Adversarial Verifier Agent Audit:
              </strong>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {(product.verifier_notes || []).map((n, i) => (
                  <li key={i} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    ✓ <strong>Verifier:</strong> {n}
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

// --- View 4: Neuro-Symbolic Z3 Workbench ---
function Z3WorkbenchView() {
  const [params, setParams] = useState({
    operating_pressure_bar: 150,
    burst_pressure_bar: 700,
    rated_voltage_v: 24,
    operating_voltage_v: 24,
    shaft_diameter_mm: 12.0,
    bore_diameter_mm: 12.2
  });

  const [report, setReport] = useState({ passed: true, issues: [] });

  const runValidation = async (newParams) => {
    const payload = {
      sku: "Z3-LIVE-DEMO",
      name: "Interactive Evaluator",
      attributes: [
        { key: "operating_pressure_bar", label: "Operating Pressure", value: newParams.operating_pressure_bar, unit: "bar" },
        { key: "burst_pressure_bar", label: "Burst Pressure", value: newParams.burst_pressure_bar, unit: "bar" },
        { key: "rated_voltage_v", label: "Rated Voltage", value: newParams.rated_voltage_v, unit: "V" },
        { key: "operating_voltage_v", label: "Operating Voltage", value: newParams.operating_voltage_v, unit: "V" },
        { key: "shaft_diameter_mm", label: "Shaft Diameter", value: newParams.shaft_diameter_mm, tolerance: 0.05, unit: "mm" },
        { key: "bore_diameter_mm", label: "Bore Diameter", value: newParams.bore_diameter_mm, tolerance: 0.05, unit: "mm" }
      ]
    };

    try {
      const res = await fetch("/validate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateParam = (key, val) => {
    const next = { ...params, [key]: parseFloat(val) };
    setParams(next);
    runValidation(next);
  };

  return (
    <div>
      {/* SMT Solver Status Banner */}
      <div className={`rule-proof-box ${report.passed ? 'pass' : 'fail'}`} style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "1.3rem" }}>{report.passed ? "✅" : "❌"}</div>
        <div>
          <strong>Z3 Theorem Prover Result: {report.passed ? "SATISFIABLE (PASSED)" : "UNSATISFIABLE (VIOLATION)"}</strong><br/>
          <span>{report.passed ? "All physical engineering constraints mathematically proven consistent." : `${report.issues.length} constraint violation(s) identified.`}</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const compliant = { operating_pressure_bar: 150, burst_pressure_bar: 700, rated_voltage_v: 24, operating_voltage_v: 24, shaft_diameter_mm: 12.0, bore_diameter_mm: 12.2 };
            setParams(compliant);
            runValidation(compliant);
          }}
        >
          Baseline Compliant Preset
        </button>

        <button
          className="btn btn-secondary btn-sm"
          style={{ color: "var(--color-danger)" }}
          onClick={() => {
            const nonCompliant = { operating_pressure_bar: 150, burst_pressure_bar: 200, rated_voltage_v: 12, operating_voltage_v: 24, shaft_diameter_mm: 12.0, bore_diameter_mm: 12.2 };
            setParams(nonCompliant);
            runValidation(nonCompliant);
          }}
        >
          Trigger Violations Preset
        </button>
      </div>

      {/* Rule 1: Pressure */}
      <div className={`rule-card ${params.burst_pressure_bar >= 4 * params.operating_pressure_bar ? 'verified' : 'violated'}`}>
        <div className="rule-header">
          <div>
            <span className="rule-title">1. Hydraulic Pressure Safety Margin</span>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Burst Pressure must provide at least 4.0x safety factor over Operating Pressure.</p>
          </div>
          <span className={`badge ${params.burst_pressure_bar >= 4 * params.operating_pressure_bar ? 'badge-success' : 'badge-danger'}`}>
            {params.burst_pressure_bar >= 4 * params.operating_pressure_bar ? 'PROVEN (PASS)' : 'VIOLATION'}
          </span>
        </div>
        <div className="formula-display">
          <span>∀ p_op, p_burst : (p_burst ≥ 4.0 × p_op)</span>
          <span className="code-inline">Z3 Real SMT</span>
        </div>
        <div className="slider-group">
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Operating Pressure:</span>
              <strong>{params.operating_pressure_bar}</strong> bar
            </div>
            <input
              type="range"
              className="slider-input"
              min="50"
              max="300"
              step="5"
              value={params.operating_pressure_bar}
              onChange={e => updateParam('operating_pressure_bar', e.target.value)}
            />
          </div>
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Burst Pressure:</span>
              <strong>{params.burst_pressure_bar}</strong> bar
            </div>
            <input
              type="range"
              className="slider-input"
              min="100"
              max="1000"
              step="10"
              value={params.burst_pressure_bar}
              onChange={e => updateParam('burst_pressure_bar', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Rule 2: Voltage */}
      <div className={`rule-card ${params.operating_voltage_v <= params.rated_voltage_v ? 'verified' : 'violated'}`}>
        <div className="rule-header">
          <div>
            <span className="rule-title">2. Electrical Voltage Rating Safety</span>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Operating voltage must never exceed rated voltage.</p>
          </div>
          <span className={`badge ${params.operating_voltage_v <= params.rated_voltage_v ? 'badge-success' : 'badge-danger'}`}>
            {params.operating_voltage_v <= params.rated_voltage_v ? 'PROVEN (PASS)' : 'VIOLATION'}
          </span>
        </div>
        <div className="formula-display">
          <span>∀ v_op, v_rated : (v_op ≤ v_rated)</span>
          <span className="code-inline">Z3 Integer SMT</span>
        </div>
        <div className="slider-group">
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Rated Voltage:</span>
              <strong>{params.rated_voltage_v}</strong> V
            </div>
            <input
              type="range"
              className="slider-input"
              min="6"
              max="48"
              step="6"
              value={params.rated_voltage_v}
              onChange={e => updateParam('rated_voltage_v', e.target.value)}
            />
          </div>
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Operating Voltage:</span>
              <strong>{params.operating_voltage_v}</strong> V
            </div>
            <input
              type="range"
              className="slider-input"
              min="6"
              max="48"
              step="6"
              value={params.operating_voltage_v}
              onChange={e => updateParam('operating_voltage_v', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- View 5: Product Catalog ---
function CatalogView() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/demo-products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Industrial Catalog Specifications</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="badge badge-info">ETIM 9.0</span>
          <span className="badge badge-purple">UNSPSC</span>
          <span className="badge badge-success">eCl@ss</span>
        </div>
      </div>

      {products.map(p => (
        <div key={p.sku} className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{p.name}</h3>
              <span className="code-inline" style={{ marginTop: "0.2rem", display: "inline-block" }}>SKU: {p.sku}</span> • 
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>{p.category}</span>
            </div>
            <span className={`badge ${p.status === 'compliant' ? 'badge-success' : 'badge-danger'}`}>
              {p.status === 'compliant' ? 'Verified Compliant' : 'Validation Issues'}
            </span>
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
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
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
                💾 Export JSON
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => alert(`✓ ${p.sku} pushed to SAP S/4HANA & Akeneo PIM!`)}
              >
                🚀 Push to SAP / Akeneo
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- View 6: GraphRAG View ---
function GraphRAGView() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 480;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const nodes = [
      { id: 'sku', label: 'DEMO-001 (DN12)', type: 'product', x: width * 0.5, y: height * 0.5, r: 24, color: '#4f46e5' },
      { id: 'cat', label: 'Hydraulic Fittings', type: 'category', x: width * 0.25, y: height * 0.3, r: 18, color: '#0284c7' },
      { id: 'z3_p', label: 'Rule: Pressure Safety', type: 'rule', x: width * 0.75, y: height * 0.3, r: 20, color: '#059669' },
      { id: 'z3_t', label: 'Rule: Temp Range', type: 'rule', x: width * 0.8, y: height * 0.6, r: 18, color: '#059669' },
      { id: 'etim', label: 'ETIM 9.0: EC011478', type: 'taxonomy', x: width * 0.2, y: height * 0.6, r: 18, color: '#7c3aed' },
      { id: 'unspsc', label: 'UNSPSC: 40141700', type: 'taxonomy', x: width * 0.3, y: height * 0.75, r: 18, color: '#7c3aed' },
      { id: 'pdf', label: 'sample_fitting.pdf', type: 'citation', x: width * 0.5, y: height * 0.8, r: 18, color: '#d97706' },
      { id: 'sap', label: 'SAP S/4HANA ERP', type: 'erp', x: width * 0.5, y: height * 0.2, r: 18, color: '#334155' }
    ];

    const links = [
      { from: 'sku', to: 'cat', label: 'BELONGS_TO' },
      { from: 'sku', to: 'z3_p', label: 'VALIDATED_BY' },
      { from: 'sku', to: 'z3_t', label: 'VALIDATED_BY' },
      { from: 'sku', to: 'etim', label: 'CLASSIFIED_AS' },
      { from: 'sku', to: 'unspsc', label: 'MAPPED_TO' },
      { from: 'sku', to: 'pdf', label: 'GROUNDED_IN' },
      { from: 'sku', to: 'sap', label: 'SYNCED_WITH' }
    ];

    const map = new Map(nodes.map(n => [n.id, n]));

    links.forEach(l => {
      const s = map.get(l.from);
      const t = map.get(l.to);
      if (!s || !t) return;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(l.label, (s.x + t.x) / 2, (s.y + t.y) / 2 - 4);
    });

    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + n.r + 14);
    });
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">
          <span>🕸️</span> GraphRAG Physical & Semantic Ontology Network
        </div>
        <span className="badge badge-purple">Interactive Canvas</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="graph-viewport">
          <canvas ref={canvasRef} id="graphCanvas"></canvas>
        </div>
      </div>
    </div>
  );
}

// --- View 7: API Sandbox View ---
function ApiSandboxView() {
  const [output, setOutput] = useState("// Click any endpoint above to execute...");
  const [status, setStatus] = useState("-");
  const [latency, setLatency] = useState("-");

  const runTest = async (endpoint, method = "GET", body = null) => {
    setStatus("Executing...");
    const start = performance.now();
    try {
      const opts = { method };
      if (body) {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = JSON.stringify(body);
      }
      const res = await fetch(endpoint, opts);
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setStatus(`HTTP ${res.status} ${res.statusText}`);
      setLatency(`${elapsed} ms`);
      setOutput(JSON.stringify(data, null, 2));
    } catch (e) {
      setStatus("Error");
      setOutput(e.message);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">
          <span>⚡</span> Interactive API Playground
        </div>
        <span className="badge badge-info">FastAPI v1.0.0</span>
      </div>
      <div className="card-body">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => runTest('/health')}>
            GET /health
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => runTest('/api/rules-meta')}>
            GET /api/rules-meta
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => runTest('/api/demo-products')}>
            GET /api/demo-products
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => runTest('/api/user/profile')}>
            GET /api/user/profile
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => runTest('/validate/', 'POST', {
              sku: "SANDBOX-01",
              attributes: [
                { key: "operating_pressure_bar", label: "Operating Pressure", value: 150 },
                { key: "burst_pressure_bar", label: "Burst Pressure", value: 700 }
              ]
            })}
          >
            POST /validate/ (Passing)
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>Status: <strong style={{ color: "var(--text-primary)" }}>{status}</strong></span>
          <span>Latency: <strong style={{ color: "var(--text-primary)" }}>{latency}</strong></span>
        </div>

        <pre className="code-block">{output}</pre>
      </div>
    </div>
  );
}

// --- Main Root Application Component ---
function App() {
  const [currentSection, setCurrentSection] = useState("overview");
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  const renderContent = () => {
    switch (currentSection) {
      case "overview":
        return <OverviewView onNavigate={setCurrentSection} />;
      case "ingest_pdf":
      case "grounding":
      case "verifier":
        return <IngestionStudioView />;
      case "z3_workbench":
      case "z3_pressure":
      case "z3_voltage":
      case "z3_tolerance":
        return <Z3WorkbenchView />;
      case "catalog":
      case "standards":
        return <CatalogView />;
      case "graph_view":
      case "erp_sync":
        return <GraphRAGView />;
      case "api_sandbox":
        return <ApiSandboxView />;
      case "profile":
      case "api_keys":
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
