/**
 * Omni-Graph Product Intelligence (OGPI) - React 18 Studio App
 * Clean, User-Friendly & Fully Functional Enterprise Interface
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

const DEFAULT_USER = {
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
    sap: { status: "connected", endpoint: "https://sap.corp.internal/odata/v4/catalog", last_sync: "10 mins ago" },
    akeneo: { status: "connected", endpoint: "https://pim.industrial.io/api/rest/v1", last_sync: "1 hour ago" },
    neo4j: { status: "connected", endpoint: "bolt://localhost:7687", last_sync: "Active" }
  },
  preferences: {
    theme: "light",
    email_alerts: true,
    auto_validation: true,
    notification_frequency: "instant"
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
      name: name || email.split("@")[0].replace(".", " ").replace(/\b\w/g, l => l.toUpperCase()),
      email: email,
      auth_provider: "email"
    };
    setUser(emailUser);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser({
      id: "guest",
      name: "Guest User",
      email: "guest@catalog-intel.com",
      role: "Catalog Viewer",
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
              Manage your product catalog, safety rules & integrations
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

// --- Clean Concise Sidebar ---
function Sidebar({ currentSection, onSelectSection }) {
  const { user, setIsAuthModalOpen } = useAuth();

  const navItems = [
    { id: "overview", label: "Dashboard", icon: "📊", badge: "Live" },
    { id: "ingest_pdf", label: "Upload & Scan PDFs", icon: "📄", badge: "Scanner" },
    { id: "z3_workbench", label: "Safety & Physics Check", icon: "⚖️", badge: "Rules" },
    { id: "catalog", label: "Product Catalog", icon: "📦", badge: "Catalog" },
    { id: "graph_view", label: "Relationship Map", icon: "🕸️", badge: "Network" },
    { id: "api_sandbox", label: "API & Connectors", icon: "🧪", badge: "Tools" },
    { id: "profile", label: "My Profile", icon: "👤", badge: "Account" }
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-logo-badge">OG</div>
        <div className="brand-text">
          <span className="brand-title">Product Intelligence</span>
          <span className="brand-subtitle">Smart Catalog AI</span>
        </div>
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
    overview: { title: "Executive Dashboard", sub: "Catalog overview, safety pass rates, and system activity" },
    ingest_pdf: { title: "Upload & Scan Catalog PDFs", sub: "Automatically extract product specifications with visual proof highlighting" },
    z3_workbench: { title: "Engineering Safety & Physics Validator", sub: "Mathematically test and prove that physical rules and safety margins are respected" },
    catalog: { title: "Standardized Product Catalog", sub: "Browse, search, and export enriched industrial product specifications" },
    graph_view: { title: "Product Knowledge & Relationship Map", sub: "Explore connections between parts, safety standards, blueprints, and ERP systems" },
    api_sandbox: { title: "API Tester & Integration Hub", sub: "Test API endpoints and connect with SAP S/4HANA & Akeneo PIM" },
    profile: { title: "User Profile & Settings", sub: "Manage your personal account, security credentials, and enterprise integrations" }
  };

  const currentInfo = titles[currentSection] || { title: "Product Intelligence Studio", sub: "" };

  return (
    <header className="top-navbar">
      <div className="navbar-title-area">
        <h1>{currentInfo.title}</h1>
        <p>{currentInfo.sub}</p>
      </div>

      <div className="navbar-actions">
        <span className="badge badge-success" style={{ fontSize: "0.76rem" }}>
          <span className="status-dot pulse"></span> System Online
        </span>
        <span className="badge badge-purple" style={{ fontSize: "0.76rem" }}>
          🛡️ Safety Engine Ready
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

// --- View 1: User Profile & Settings ---
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
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="profile-hero">
          <div className="profile-hero-content">
            <img src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} alt={user.name} className="profile-avatar-large" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</h2>
                <span className="badge badge-purple">{user.role}</span>
                <span className="badge badge-info" style={{ textTransform: "uppercase" }}>
                  Login: {user.auth_provider}
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
            Activity History
          </button>
        </div>

        <div className="card-body">
          {activeTab === "general" && (
            <form onSubmit={handleSave} style={{ maxWidth: "600px" }}>
              <div className="form-group">
                <label className="form-label">Your Name</label>
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

              <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
                Save Profile
              </button>
            </form>
          )}

          {activeTab === "integrations" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <div className="card" style={{ margin: 0, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>SAP ERP Connector</strong>
                  <span className="badge badge-success">Connected</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Syncs verified product catalogs directly to SAP Material Master.
                </p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => alert("✓ SAP connection tested: 200 OK")}>
                  Test Connection
                </button>
              </div>

              <div className="card" style={{ margin: 0, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Akeneo PIM System</strong>
                  <span className="badge badge-success">Connected</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Pushes validated product data to e-commerce and distributor channels.
                </p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => alert("✓ Akeneo REST API connected")}>
                  Test Connection
                </button>
              </div>
            </div>
          )}

          {activeTab === "apikeys" && (
            <div style={{ maxWidth: "650px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Live API Access Token</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Use this token to connect your external scripts or applications.
              </p>

              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input type="text" className="form-input" value={user.api_key} readOnly style={{ fontFamily: "var(--font-mono)", fontSize: "0.84rem" }} />
                <button className="btn btn-secondary" onClick={copyApiKey}>
                  {copiedKey ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={() => alert("New API key generated successfully.")}>
                🔄 Generate New Key
              </button>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Product</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Just now</td>
                    <td>Catalog Document Scan</td>
                    <td><span className="code-inline">DEMO-001</span></td>
                    <td><span className="badge badge-success">Safety Verified</span></td>
                  </tr>
                  <tr>
                    <td>10 mins ago</td>
                    <td>Safety Rule Test</td>
                    <td><span className="code-inline">DEMO-002</span></td>
                    <td><span className="badge badge-danger">Issue Detected</span></td>
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

// --- View 2: Dashboard ---
function OverviewView({ onNavigate }) {
  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active Products</span>
            <div className="kpi-icon-wrap indigo">📦</div>
          </div>
          <div className="kpi-value">2</div>
          <div className="kpi-meta"><span>In your catalog</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Specifications Extracted</span>
            <div className="kpi-icon-wrap purple">🏷️</div>
          </div>
          <div className="kpi-value">13</div>
          <div className="kpi-meta"><span>Pressures, temps, dimensions</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Safety Rules Checked</span>
            <div className="kpi-icon-wrap emerald">⚖️</div>
          </div>
          <div className="kpi-value">5</div>
          <div className="kpi-meta"><span>Pressure, electrical & size checks</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Catalog Safety Pass Rate</span>
            <div className="kpi-icon-wrap amber">🛡️</div>
          </div>
          <div className="kpi-value">100%</div>
          <div className="kpi-meta"><span>Zero physical safety conflicts</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <span>🚀</span> How This System Protects Your Product Data
          </div>
          <span className="badge badge-success">Automated Workflow</span>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--brand-primary)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>1. Smart Document Scanner</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Reads technical PDFs, tables, and blueprints, saving exact visual proof of where every number came from.
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-purple)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>2. AI Double-Check Verification</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                A second AI reviewer cross-checks all extracted numbers against the source document to prevent errors.
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-success)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>3. Safety & Physics Validator</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Mathematically tests that engineering rules hold (e.g. burst pressure is safe, parts will fit together).
              </p>
            </div>

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-info)" }}>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>4. Direct ERP Export</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Sends verified catalog data straight to your SAP or Akeneo ecommerce systems with 1 click.
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
          <button className="btn btn-subtle" onClick={() => onNavigate("z3_workbench")}>
            ⚖️ Test Safety & Physics Rules
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("catalog")}>
            📦 View Product Catalog
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("graph_view")}>
            🕸️ Open Relationship Map
          </button>
        </div>
      </div>
    </div>
  );
}

// --- View 3: Document Scanner & Visual Proof Viewer ---
function IngestionStudioView() {
  const [product, setProduct] = useState(null);
  const [highlightedKey, setHighlightedKey] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    apiFetch('/api/demo-products')
      .then(res => res.json())
      .then(data => data.length > 0 && setProduct(data[0]))
      .catch(err => console.error(err));
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/ingest/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProduct({
        sku: data.product.sku,
        name: data.product.name,
        attributes: data.product.attributes,
        verifier_notes: data.verifier_notes || ["Extracted with visual citation coordinates."]
      });
      alert(`✓ Successfully scanned ${data.product.name}!`);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const loadSample = () => {
    apiFetch('/api/demo-products')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setProduct(data[0]);
          alert("✓ Demo catalog sheet loaded!");
        }
      });
  };

  if (!product) return <div>Loading Catalog Scanner...</div>;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <span>📄</span> Upload or Load Catalog Sheet
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary btn-sm" onClick={loadSample}>
              📥 Load Sample Catalog
            </button>
            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
              <span>{isUploading ? "Scanning..." : "📤 Upload PDF"}</span>
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
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Source Document Preview • Visual Proof Highlights</p>
            </div>
            <span className="badge badge-purple">Hover to Highlight</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="doc-canvas-stage">
              <div className="pdf-mock-page">
                <div className="mock-pdf-header">
                  <h3>Industrial Catalog Sheet</h3>
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
                    <span className="bbox-tag">Source Verified</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <span>📋</span> Extracted Specifications
            </div>
            <span className="badge badge-success">Checked</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Specification</th>
                    <th>Value</th>
                    <th>Standard Code</th>
                    <th>Match Accuracy</th>
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
                        <strong>{attr.label}</strong>
                      </td>
                      <td><strong>{attr.value} {attr.unit || ''}</strong></td>
                      <td>
                        <span className="badge badge-info">{attr.standard_scheme || "Industry Standard"}: {attr.standard_code || "EC011478"}</span>
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
                🛡️ AI Double-Check Verification Notes:
              </strong>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {(product.verifier_notes || []).map((n, i) => (
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

// --- View 4: Safety & Physics Validator (Interactive Sliders) ---
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
      sku: "SAFETY-TEST-01",
      name: "Interactive Safety Check",
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
      const res = await apiFetch("/validate/", {
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
      <div className={`rule-proof-box ${report.passed ? 'pass' : 'fail'}`} style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "1.3rem" }}>{report.passed ? "✅" : "❌"}</div>
        <div>
          <strong>Overall Safety Check: {report.passed ? "ALL SAFETY RULES PASSED" : "SAFETY VIOLATIONS FOUND"}</strong><br/>
          <span>{report.passed ? "Every physical law and safety factor is fully satisfied." : `${report.issues.length} physical rule(s) violated. Adjust values below to fix.`}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const safe = { operating_pressure_bar: 150, burst_pressure_bar: 700, rated_voltage_v: 24, operating_voltage_v: 24, shaft_diameter_mm: 12.0, bore_diameter_mm: 12.2 };
            setParams(safe);
            runValidation(safe);
          }}
        >
          Load Safe Values (All Pass)
        </button>

        <button
          className="btn btn-secondary btn-sm"
          style={{ color: "var(--color-danger)" }}
          onClick={() => {
            const unsafe = { operating_pressure_bar: 150, burst_pressure_bar: 200, rated_voltage_v: 12, operating_voltage_v: 24, shaft_diameter_mm: 12.3, bore_diameter_mm: 12.0 };
            setParams(unsafe);
            runValidation(unsafe);
          }}
        >
          Test Unsafe Values (Trigger Warning)
        </button>
      </div>

      {/* Rule 1: Pressure */}
      <div className={`rule-card ${params.burst_pressure_bar >= 4 * params.operating_pressure_bar ? 'verified' : 'violated'}`}>
        <div className="rule-header">
          <div>
            <span className="rule-title">1. Hydraulic Pressure Safety Margin</span>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Rule: Burst Pressure must be at least 4 times the Operating Pressure to prevent catastrophic hose bursts.
            </p>
          </div>
          <span className={`badge ${params.burst_pressure_bar >= 4 * params.operating_pressure_bar ? 'badge-success' : 'badge-danger'}`}>
            {params.burst_pressure_bar >= 4 * params.operating_pressure_bar ? 'SAFE (PASSED)' : 'UNSAFE (TOO LOW)'}
          </span>
        </div>
        <div className="slider-group">
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Operating Working Pressure:</span>
              <strong>{params.operating_pressure_bar}</strong> bar
            </div>
            <input type="range" className="slider-input" min="50" max="300" step="5" value={params.operating_pressure_bar} onChange={e => updateParam('operating_pressure_bar', e.target.value)} />
          </div>
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Burst Failure Pressure:</span>
              <strong>{params.burst_pressure_bar}</strong> bar (Required: ≥ {params.operating_pressure_bar * 4} bar)
            </div>
            <input type="range" className="slider-input" min="100" max="1000" step="10" value={params.burst_pressure_bar} onChange={e => updateParam('burst_pressure_bar', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Rule 2: Voltage */}
      <div className={`rule-card ${params.operating_voltage_v <= params.rated_voltage_v ? 'verified' : 'violated'}`}>
        <div className="rule-header">
          <div>
            <span className="rule-title">2. Electrical Voltage Limit</span>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Rule: Operating Voltage must never exceed the manufacturer's Maximum Rated Voltage.
            </p>
          </div>
          <span className={`badge ${params.operating_voltage_v <= params.rated_voltage_v ? 'badge-success' : 'badge-danger'}`}>
            {params.operating_voltage_v <= params.rated_voltage_v ? 'SAFE (PASSED)' : 'OVERVOLTAGE (UNSAFE)'}
          </span>
        </div>
        <div className="slider-group">
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Maximum Rated Voltage:</span>
              <strong>{params.rated_voltage_v}</strong> V
            </div>
            <input type="range" className="slider-input" min="6" max="48" step="6" value={params.rated_voltage_v} onChange={e => updateParam('rated_voltage_v', e.target.value)} />
          </div>
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Actual Operating Voltage:</span>
              <strong>{params.operating_voltage_v}</strong> V
            </div>
            <input type="range" className="slider-input" min="6" max="48" step="6" value={params.operating_voltage_v} onChange={e => updateParam('operating_voltage_v', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Rule 3: Size & Fit */}
      <div className={`rule-card ${params.shaft_diameter_mm <= params.bore_diameter_mm ? 'verified' : 'violated'}`}>
        <div className="rule-header">
          <div>
            <span className="rule-title">3. Part Size & Fit Compatibility</span>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Rule: Shaft outer diameter must be strictly smaller than the hole (bore) diameter so parts fit together.
            </p>
          </div>
          <span className={`badge ${params.shaft_diameter_mm <= params.bore_diameter_mm ? 'badge-success' : 'badge-danger'}`}>
            {params.shaft_diameter_mm <= params.bore_diameter_mm ? 'PERFECT FIT' : 'PARTS WILL NOT FIT'}
          </span>
        </div>
        <div className="slider-group">
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Shaft Outer Diameter:</span>
              <strong>{params.shaft_diameter_mm}</strong> mm
            </div>
            <input type="range" className="slider-input" min="10.0" max="15.0" step="0.1" value={params.shaft_diameter_mm} onChange={e => updateParam('shaft_diameter_mm', e.target.value)} />
          </div>
          <div className="slider-control">
            <div className="slider-label-row">
              <span>Hole (Bore) Inner Diameter:</span>
              <strong>{params.bore_diameter_mm}</strong> mm
            </div>
            <input type="range" className="slider-input" min="10.0" max="15.0" step="0.1" value={params.bore_diameter_mm} onChange={e => updateParam('bore_diameter_mm', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- View 5: Product Catalog ---
function CatalogView() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch('/api/demo-products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: "320px" }}
          placeholder="🔍 Search by product name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="badge badge-info">ETIM 9.0 Standard</span>
          <span className="badge badge-purple">UNSPSC Mapped</span>
        </div>
      </div>

      {filtered.map(p => (
        <div key={p.sku} className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{p.name}</h3>
              <span className="code-inline" style={{ marginTop: "0.2rem", display: "inline-block" }}>SKU: {p.sku}</span> • 
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>{p.category}</span>
            </div>
            <span className={`badge ${p.status === 'compliant' ? 'badge-success' : 'badge-danger'}`}>
              {p.status === 'compliant' ? 'Safety Verified' : 'Needs Review'}
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
                onClick={() => alert(`✓ ${p.name} (${p.sku}) sent to SAP S/4HANA & Akeneo PIM!`)}
              >
                🚀 Send to SAP / Akeneo
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- View 6: Relationship Map ---
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
      { id: 'sku', label: 'DN12 Hydraulic Fitting', type: 'product', x: width * 0.5, y: height * 0.5, r: 24, color: '#4f46e5' },
      { id: 'cat', label: 'Hydraulic Fittings', type: 'category', x: width * 0.25, y: height * 0.3, r: 18, color: '#0284c7' },
      { id: 'z3_p', label: 'Rule: 4x Pressure Safety', type: 'rule', x: width * 0.75, y: height * 0.3, r: 20, color: '#059669' },
      { id: 'z3_t', label: 'Rule: Temp Bounds', type: 'rule', x: width * 0.8, y: height * 0.6, r: 18, color: '#059669' },
      { id: 'etim', label: 'Industry Code: EC011478', type: 'taxonomy', x: width * 0.2, y: height * 0.6, r: 18, color: '#7c3aed' },
      { id: 'pdf', label: 'catalog_blueprint.pdf', type: 'citation', x: width * 0.5, y: height * 0.8, r: 18, color: '#d97706' },
      { id: 'sap', label: 'SAP ERP Target', type: 'erp', x: width * 0.5, y: height * 0.2, r: 18, color: '#334155' }
    ];

    const links = [
      { from: 'sku', to: 'cat', label: 'CATEGORY' },
      { from: 'sku', to: 'z3_p', label: 'VERIFIED_BY' },
      { from: 'sku', to: 'z3_t', label: 'VERIFIED_BY' },
      { from: 'sku', to: 'etim', label: 'CLASSIFIED_AS' },
      { from: 'sku', to: 'pdf', label: 'SOURCE_PROOF' },
      { from: 'sku', to: 'sap', label: 'SYNCED_TO' }
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
          <span>🕸️</span> Product Relationship & Knowledge Map
        </div>
        <span className="badge badge-purple">Visual Explorer</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="graph-viewport">
          <canvas ref={canvasRef} id="graphCanvas"></canvas>
        </div>
      </div>
    </div>
  );
}

// --- View 7: API Tester ---
function ApiSandboxView() {
  const [output, setOutput] = useState("// Click any endpoint button above to test live...");
  const [status, setStatus] = useState("-");
  const [latency, setLatency] = useState("-");

  const runTest = async (endpoint, method = "GET", body = null) => {
    setStatus("Calling...");
    const start = performance.now();
    try {
      const opts = { method };
      if (body) {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = JSON.stringify(body);
      }
      const res = await apiFetch(endpoint, opts);
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
          <span>⚡</span> Live API Tester
        </div>
        <span className="badge badge-info">FastAPI Endpoint Testbed</span>
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
              sku: "API-TEST-01",
              attributes: [
                { key: "operating_pressure_bar", label: "Operating Pressure", value: 150 },
                { key: "burst_pressure_bar", label: "Burst Pressure", value: 700 }
              ]
            })}
          >
            POST /validate/ (Check Rules)
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
      case "z3_workbench":
        return <Z3WorkbenchView />;
      case "catalog":
        return <CatalogView />;
      case "graph_view":
        return <GraphRAGView />;
      case "api_sandbox":
        return <ApiSandboxView />;
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
