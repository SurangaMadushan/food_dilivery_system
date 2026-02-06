import { useEffect, useMemo, useState } from "react";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8081";

const StatusBadge = ({ text }) => <div className="status">{text}</div>;

const MenuCard = ({ item }) => (
  <div className="menu-item">
    <h3>{item.name}</h3>
    <p className="muted">{item.description}</p>
    <p>
      <strong>ETA:</strong> {item.etaMinutes} minutes
    </p>
    <p className="muted">{item.active ? "Active" : "Inactive"}</p>
  </div>
);

const ConfirmationCard = ({ item }) => (
  <div className="confirmation-item">
    <h3>Order {item.orderId}</h3>
    <p className="muted">
      {item.customerName} · {item.address}
    </p>
    <p>
      <strong>Status:</strong> {item.status}
    </p>
    <p className="muted">Delivered by {item.deliveredBy?.name || "-"}</p>
  </div>
);

const App = () => {
  const [activePage, setActivePage] = useState("login");
  const [status, setStatus] = useState("Not signed in");
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [menuError, setMenuError] = useState("");
  const [confirmations, setConfirmations] = useState([]);
  const [confirmationsError, setConfirmationsError] = useState("");
  const [adminItems, setAdminItems] = useState([]);
  const [adminItemsError, setAdminItemsError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [confirmForm, setConfirmForm] = useState({
    orderId: "",
    customerName: "",
    address: ""
  });
  const [adminForm, setAdminForm] = useState({
    id: "",
    name: "",
    description: "",
    etaMinutes: "",
    active: true
  });

  const isAdmin = useMemo(() => role === "admin", [role]);

  const fetchMenu = async () => {
    try {
      setMenuError("");
      const response = await fetch(`${apiBase}/api/deliveries/menu`);
      const data = await response.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setMenuError("Unable to load delivery menu.");
    }
  };

  const fetchConfirmations = async () => {
    if (!token || !isAdmin) {
      return;
    }

    try {
      setConfirmationsError("");
      const response = await fetch(`${apiBase}/api/admin/confirmations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        setConfirmationsError("Unable to load confirmations.");
        return;
      }
      const data = await response.json();
      setConfirmations(Array.isArray(data) ? data : []);
    } catch (error) {
      setConfirmationsError("Unable to load confirmations.");
    }
  };

  const fetchAdminItems = async () => {
    if (!token || !isAdmin) {
      return;
    }

    try {
      setAdminItemsError("");
      const response = await fetch(`${apiBase}/api/admin/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        setAdminItemsError("Unable to load delivery items.");
        return;
      }
      const data = await response.json();
      setAdminItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setAdminItemsError("Unable to load delivery items.");
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      if (!response.ok) {
        setStatus("Login failed. Check credentials.");
        return;
      }

      const data = await response.json();
      setToken(data.token);
      setRole(data.user.role);
      setStatus(`Signed in as ${data.user.name} (${data.user.role})`);
      setActivePage("dashboard");
      fetchConfirmations();
      fetchAdminItems();
    } catch (error) {
      setStatus("Login failed. Check credentials.");
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm)
      });

      if (!response.ok) {
        setStatus("Registration failed. Try a different email.");
        return;
      }

      setStatus("Delivery account created. Please login.");
      setRegisterForm({ name: "", email: "", password: "" });
      setActivePage("login");
    } catch (error) {
      setStatus("Registration failed. Try again.");
    }
  };

  const handleConfirmSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setStatus("Please sign in before confirming deliveries.");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/deliveries/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(confirmForm)
      });

      if (!response.ok) {
        setStatus("Delivery confirmation failed.");
        return;
      }

      setConfirmForm({ orderId: "", customerName: "", address: "" });
      setStatus("Delivery confirmed.");
      fetchConfirmations();
    } catch (error) {
      setStatus("Delivery confirmation failed.");
    }
  };

  const handleAdminItemSubmit = async (event) => {
    event.preventDefault();
    if (!token || !isAdmin) {
      setStatus("Admin access required.");
      return;
    }

    const payload = {
      name: adminForm.name,
      description: adminForm.description,
      etaMinutes: Number(adminForm.etaMinutes),
      active: adminForm.active
    };

    try {
      const url = adminForm.id
        ? `${apiBase}/api/admin/items/${adminForm.id}`
        : `${apiBase}/api/admin/items`;
      const method = adminForm.id ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setStatus("Unable to save delivery item.");
        return;
      }

      setStatus(adminForm.id ? "Delivery item updated." : "Delivery item added.");
      setAdminForm({
        id: "",
        name: "",
        description: "",
        etaMinutes: "",
        active: true
      });
      fetchAdminItems();
      fetchMenu();
    } catch (error) {
      setStatus("Unable to save delivery item.");
    }
  };

  const handleEditItem = (item) => {
    setAdminForm({
      id: item._id,
      name: item.name || "",
      description: item.description || "",
      etaMinutes: item.etaMinutes || "",
      active: Boolean(item.active)
    });
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminItems();
    }
  }, [isAdmin]);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Delivery Unit</p>
          <h1>Delivery Portal</h1>
          <p className="subtitle">
            Dedicated login, delivery menu, and confirmation workflow for the
            delivery team.
          </p>
        </div>
        <StatusBadge text={status} />
      </header>

      <nav className="nav">
        <button
          type="button"
          className={activePage === "login" ? "nav-button active" : "nav-button"}
          onClick={() => setActivePage("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={activePage === "register" ? "nav-button active" : "nav-button"}
          onClick={() => setActivePage("register")}
        >
          Register
        </button>
        <button
          type="button"
          className={activePage === "dashboard" ? "nav-button active" : "nav-button"}
          onClick={() => setActivePage("dashboard")}
        >
          Dashboard
        </button>
      </nav>

      {activePage === "login" && (
        <main className="grid">
          <section className="card">
            <h2>Login</h2>
            <form onSubmit={handleLoginSubmit}>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="delivery@company.lk"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      email: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      password: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <button type="submit">Sign in</button>
              <p className="helper">Use the delivery admin or delivery staff account.</p>
            </form>
          </section>
        </main>
      )}

      {activePage === "register" && (
        <main className="grid">
          <section className="card">
            <h2>Register Delivery Staff</h2>
            <form onSubmit={handleRegisterSubmit}>
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  placeholder="Kumara"
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      name: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="delivery@company.lk"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      email: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      password: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <button type="submit">Create Account</button>
            </form>
          </section>
        </main>
      )}

      {activePage === "dashboard" && (
        <main className="grid">
          <section className="card">
            <h2>Delivery Menu</h2>
            <div className="menu">
              {menuError && <p className="muted">{menuError}</p>}
              {!menuError && menuItems.length === 0 && (
                <p className="muted">No delivery items found.</p>
              )}
              {menuItems.map((item) => (
                <MenuCard key={item._id || item.name} item={item} />
              ))}
            </div>
            <button className="secondary" type="button" onClick={fetchMenu}>
              Refresh Menu
            </button>
          </section>

          <section className="card">
            <h2>Confirm Delivery</h2>
            <form onSubmit={handleConfirmSubmit}>
              <label>
                Order ID
                <input
                  type="text"
                  name="orderId"
                  placeholder="ORD-1007"
                  value={confirmForm.orderId}
                  onChange={(event) =>
                    setConfirmForm((prev) => ({
                      ...prev,
                      orderId: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <label>
                Customer Name
                <input
                  type="text"
                  name="customerName"
                  placeholder="Saman"
                  value={confirmForm.customerName}
                  onChange={(event) =>
                    setConfirmForm((prev) => ({
                      ...prev,
                      customerName: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <label>
                Address
                <textarea
                  name="address"
                  rows="3"
                  placeholder="123, Main Road, Colombo"
                  value={confirmForm.address}
                  onChange={(event) =>
                    setConfirmForm((prev) => ({
                      ...prev,
                      address: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <button type="submit">Confirm Delivery</button>
            </form>
          </section>

          <section className={`card ${isAdmin ? "" : "hidden"}`}>
            <h2>Admin Confirmations</h2>
            <div className="confirmations">
              {confirmationsError && <p className="muted">{confirmationsError}</p>}
              {!confirmationsError && confirmations.length === 0 && (
                <p className="muted">No confirmations yet.</p>
              )}
              {confirmations.map((item) => (
                <ConfirmationCard key={item._id} item={item} />
              ))}
            </div>
            <button
              className="secondary"
              type="button"
              onClick={fetchConfirmations}
            >
              Refresh Confirmations
            </button>
          </section>

          <section className={`card ${isAdmin ? "" : "hidden"}`}>
            <h2>Admin Delivery Updates</h2>
            <form onSubmit={handleAdminItemSubmit}>
              <label>
                Service Name
                <input
                  type="text"
                  name="name"
                  placeholder="Express Delivery"
                  value={adminForm.name}
                  onChange={(event) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      name: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <label>
                Description
                <input
                  type="text"
                  name="description"
                  placeholder="Deliver within 30 minutes."
                  value={adminForm.description}
                  onChange={(event) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      description: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <label>
                ETA Minutes
                <input
                  type="number"
                  name="etaMinutes"
                  placeholder="45"
                  value={adminForm.etaMinutes}
                  onChange={(event) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      etaMinutes: event.target.value
                    }))
                  }
                  required
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={adminForm.active}
                  onChange={(event) =>
                    setAdminForm((prev) => ({
                      ...prev,
                      active: event.target.checked
                    }))
                  }
                />
                Active
              </label>
              <button type="submit">
                {adminForm.id ? "Update Delivery Item" : "Add Delivery Item"}
              </button>
            </form>

            <div className="admin-list">
              {adminItemsError && <p className="muted">{adminItemsError}</p>}
              {!adminItemsError && adminItems.length === 0 && (
                <p className="muted">No delivery items yet.</p>
              )}
              {adminItems.map((item) => (
                <div className="admin-item" key={item._id}>
                  <div>
                    <p className="admin-title">{item.name}</p>
                    <p className="muted">{item.description}</p>
                    <p className="muted">ETA: {item.etaMinutes} min</p>
                  </div>
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => handleEditItem(item)}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
};

export default App;
