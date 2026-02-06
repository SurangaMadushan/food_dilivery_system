const API_BASE = "http://localhost:5050";

const statusEl = document.getElementById("status");
const menuEl = document.getElementById("menu");
const confirmationsEl = document.getElementById("confirmations");
const adminPanel = document.getElementById("admin-panel");

let token = null;
let role = null;

const updateStatus = (text) => {
  statusEl.textContent = text;
};

const renderMenu = (items) => {
  menuEl.innerHTML = "";
  if (!items.length) {
    menuEl.innerHTML = "<p class=\"muted\">No delivery items found.</p>";
    return;
  }

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.innerHTML = `
      <h3>${item.name}</h3>
      <p class="muted">${item.description}</p>
      <p><strong>ETA:</strong> ${item.etaMinutes} minutes</p>
    `;
    menuEl.appendChild(div);
  });
};

const renderConfirmations = (items) => {
  confirmationsEl.innerHTML = "";
  if (!items.length) {
    confirmationsEl.innerHTML = "<p class=\"muted\">No confirmations yet.</p>";
    return;
  }

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "confirmation-item";
    div.innerHTML = `
      <h3>Order ${item.orderId}</h3>
      <p class="muted">${item.customerName} · ${item.address}</p>
      <p><strong>Status:</strong> ${item.status}</p>
      <p class="muted">Delivered by ${item.deliveredBy?.name || "-"}</p>
    `;
    confirmationsEl.appendChild(div);
  });
};

const fetchMenu = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/deliveries/menu`);
    const data = await response.json();
    renderMenu(Array.isArray(data) ? data : []);
  } catch (error) {
    menuEl.innerHTML = "<p class=\"muted\">Unable to load delivery menu.</p>";
  }
};

const fetchConfirmations = async () => {
  if (!token || role !== "admin") {
    adminPanel.classList.add("hidden");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/admin/confirmations`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      confirmationsEl.innerHTML = "<p class=\"muted\">Unable to load confirmations.</p>";
      return;
    }

    const data = await response.json();
    renderConfirmations(Array.isArray(data) ? data : []);
  } catch (error) {
    confirmationsEl.innerHTML = "<p class=\"muted\">Unable to load confirmations.</p>";
  }
};

const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    updateStatus("Login failed. Check credentials.");
    return;
  }

  const data = await response.json();
  token = data.token;
  role = data.user.role;
  updateStatus(`Signed in as ${data.user.name} (${data.user.role})`);
  adminPanel.classList.toggle("hidden", role !== "admin");
  fetchConfirmations();
});

const confirmForm = document.getElementById("confirm-form");
confirmForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!token) {
    updateStatus("Please sign in before confirming deliveries.");
    return;
  }

  const formData = new FormData(confirmForm);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch(`${API_BASE}/api/deliveries/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    updateStatus("Delivery confirmation failed.");
    return;
  }

  confirmForm.reset();
  updateStatus("Delivery confirmed.");
  fetchConfirmations();
});

const refreshMenuButton = document.getElementById("refresh-menu");
refreshMenuButton.addEventListener("click", fetchMenu);

const refreshConfirmationsButton = document.getElementById("refresh-confirmations");
refreshConfirmationsButton.addEventListener("click", fetchConfirmations);

fetchMenu();
adminPanel.classList.add("hidden");
