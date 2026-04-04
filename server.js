// ============================================================
// EditKori.com — Express Server  ✅ SECURE VERSION
// ============================================================
require('dotenv').config();

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.error('❌  ADMIN_SECRET .env-এ নেই — server বন্ধ হচ্ছে।');
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

// ── ✅ Firebase config endpoint ─────────────────────────────
// index.html এখানে থেকে config নেয় — HTML-এ আর hardcode নেই
app.get('/api/config', (req, res) => {
  res.json({
    apiKey:            process.env.FIREBASE_API_KEY,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL:       process.env.FIREBASE_DATABASE_URL,
    projectId:         process.env.FIREBASE_PROJECT_ID,
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.FIREBASE_APP_ID,
    measurementId:     process.env.FIREBASE_MEASUREMENT_ID,
  });
});

// ── Pages ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ── POST — নতুন order ────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { name, email, phone, category, length, speed, driveLink, instructions } = req.body;
  if (!name || !email || !category) {
    return res.status(400).json({ error: 'Name, email ও category আবশ্যক।' });
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
  console.log(`✅ New order: ${name} (${email}) — ${category}`);
  res.json({ success: true, orderId: order.id });
});

// ── GET — সব orders (admin only) ───────────────────────────
app.get('/api/orders', (req, res) => {
  if (!checkAuth(req, res)) return;
  res.json(readOrders());
});

// ── GET — user-এর নিজের orders (admin secret লাগে না) ─────
app.get('/api/myorders', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  const all = readOrders();
  res.json(all.filter(o => o.email === email));
});

// ── PATCH — order status update (admin only) ───────────────
app.patch('/api/orders/:id', (req, res) => {
  if (!checkAuth(req, res)) return;
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  if (req.body.status)            orders[idx].status = req.body.status;
  if (req.body.note !== undefined) orders[idx].note   = req.body.note;
  saveOrders(orders);
  res.json({ success: true, order: orders[idx] });
});

// ── DELETE — order মুছো (admin only) ──────────────────────
app.delete('/api/orders/:id', (req, res) => {
  if (!checkAuth(req, res)) return;
  let orders = readOrders();
  const before = orders.length;
  orders = orders.filter(o => o.id !== req.params.id);
  if (orders.length === before) return res.status(404).json({ error: 'Order not found' });
  saveOrders(orders);
  res.json({ success: true });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 EditKori → http://localhost:${PORT}`);
  console.log(`🔐 Admin    → http://localhost:${PORT}/admin\n`);
});
