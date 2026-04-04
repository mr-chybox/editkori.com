// ============================================================
// EditKori.com — Node.js Express Server
// Run: node server.js
// ============================================================

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Change this to a strong secret password! ────────────────
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'editkori2025';

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── File-based order storage ────────────────────────────────
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

function readOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); }
  catch(e) { return []; }
}

function saveOrders(orders) {
  fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function checkAuth(req, res) {
  const secret = req.query.secret || req.headers['x-admin-secret'];
  if (secret !== ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ── Routes ──────────────────────────────────────────────────

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// POST — submit new order
app.post('/api/orders', (req, res) => {
  const { name, email, phone, category, length, speed, driveLink, instructions } = req.body;
  if (!name || !email || !category) {
    return res.status(400).json({ error: 'Name, email and category are required.' });
  }
  const order = {
    id:           Date.now().toString(),
    name, email,
    phone:        phone || '',
    category,
    length:       length || '',
    speed:        speed || 'Standard (48h)',
    driveLink:    driveLink || '',
    instructions: instructions || '',
    status:       'new',
    createdAt:    new Date().toISOString(),
  };
  const orders = readOrders();
  orders.unshift(order);
  saveOrders(orders);
  console.log(`✅ New order from ${name} (${email}) — ${category}`);
  res.json({ success: true, orderId: order.id });
});

// GET — all orders (admin only)
app.get('/api/orders', (req, res) => {
  if (!checkAuth(req, res)) return;
  res.json(readOrders());
});

// PATCH — update order status (admin only)
app.patch('/api/orders/:id', (req, res) => {
  if (!checkAuth(req, res)) return;
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  if (req.body.status) orders[idx].status = req.body.status;
  if (req.body.note !== undefined) orders[idx].note = req.body.note;
  saveOrders(orders);
  res.json({ success: true, order: orders[idx] });
});

// DELETE — remove order (admin only)
app.delete('/api/orders/:id', (req, res) => {
  if (!checkAuth(req, res)) return;
  let orders = readOrders();
  const before = orders.length;
  orders = orders.filter(o => o.id !== req.params.id);
  if (orders.length === before) return res.status(404).json({ error: 'Order not found' });
  saveOrders(orders);
  console.log(`🗑️  Deleted order ${req.params.id}`);
  res.json({ success: true });
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 EditKori server → http://localhost:${PORT}`);
  console.log(`🔐 Admin panel   → http://localhost:${PORT}/admin`);
  console.log(`📦 Orders API    → http://localhost:${PORT}/api/orders?secret=${ADMIN_SECRET}\n`);
});
