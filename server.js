// ============================================================
// EditKori.com — Node.js Express Server
// Run: node server.js
// ============================================================

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Simple file-based order storage (no DB needed for start) ──
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
function readOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
}
function saveOrders(orders) {
  fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ── Routes ──────────────────────────────────────────────────

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST new order
app.post('/api/orders', (req, res) => {
  const { name, email, phone, category, length, speed, driveLink, instructions } = req.body;
  if (!name || !email || !category) {
    return res.status(400).json({ error: 'Name, email and category are required.' });
  }
  const order = {
    id:           Date.now().toString(),
    name, email, phone, category, length, speed, driveLink, instructions,
    status:       'Pending',
    createdAt:    new Date().toISOString(),
  };
  const orders = readOrders();
  orders.unshift(order);
  saveOrders(orders);
  console.log(`✅ New order from ${name} (${email}) — ${category}`);
  res.json({ success: true, orderId: order.id, message: 'Order received! We will contact you within 2 hours.' });
});

// GET all orders (admin)
app.get('/api/orders', (req, res) => {
  const { secret } = req.query;
  if (secret !== process.env.ADMIN_SECRET && secret !== 'editkori2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(readOrders());
});

// PATCH update order status (admin)
app.patch('/api/orders/:id', (req, res) => {
  const { secret } = req.query;
  if (secret !== process.env.ADMIN_SECRET && secret !== 'editkori2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  orders[idx].status = req.body.status || orders[idx].status;
  saveOrders(orders);
  res.json({ success: true, order: orders[idx] });
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 EditKori server running at http://localhost:${PORT}`);
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders?secret=editkori2025\n`);
});
