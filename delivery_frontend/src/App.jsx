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
  const [status, setStatus] = useState("Not signed in");
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [menuError, setMenuError] = useState("");
  const [confirmations, setConfirmations] = useState([]);
  const [confirmationsError, setConfirmationsError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [confirmForm, setConfirmForm] = useState({
    orderId: "",
    customerName: "",
    address: ""
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
      fetchConfirmations();
    } catch (error) {
      setStatus("Login failed. Check credentials.");
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

  useEffect(() => {
    fetchMenu();
  }, []);

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
      </main>
    </div>
  );
};

export default App;
