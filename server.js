const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3005;
const DATA_DIR = path.join(__dirname, 'data', 'gardens');

// Ensure data directory exists
[path.join(__dirname, 'data'), DATA_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const DEFAULT_DATA = { garden: [], journal: [], tasks: {}, stages: {}, inventory: [] };

function gardenPath(code) {
  // Sanitize code to prevent path traversal
  const safe = code.replace(/[^a-zA-Z0-9]/g, '');
  return path.join(DATA_DIR, `${safe}.json`);
}

function readGarden(code) {
  try {
    const p = gardenPath(code);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading garden:', e.message);
  }
  return null;
}

function writeGarden(code, data) {
  fs.writeFileSync(gardenPath(code), JSON.stringify(data, null, 2), 'utf8');
}

function generateCode() {
  // 6 chars, easy to type/share
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, { index: 'index.html' }));

// POST /api/garden/create — create a new garden, returns { code }
app.post('/api/garden/create', (req, res) => {
  const name = (req.body.name || 'Mon Potager').slice(0, 50);
  let code;
  // Ensure unique code
  do { code = generateCode(); } while (fs.existsSync(gardenPath(code)));

  writeGarden(code, { ...DEFAULT_DATA, name, createdAt: Date.now() });
  res.json({ code, name });
});

// GET /api/garden/:code — check if garden exists + get data
app.get('/api/garden/:code', (req, res) => {
  const data = readGarden(req.params.code);
  if (!data) return res.status(404).json({ error: 'Jardin introuvable' });
  res.json(data);
});

// POST /api/garden/:code — save data to a garden
app.post('/api/garden/:code', (req, res) => {
  const code = req.params.code.replace(/[^a-zA-Z0-9]/g, '');
  const existing = readGarden(code);
  if (!existing) return res.status(404).json({ error: 'Jardin introuvable' });

  const { garden, journal, tasks, stages, inventory } = req.body;
  if (Array.isArray(garden)) existing.garden = garden;
  if (Array.isArray(journal)) existing.journal = journal;
  if (tasks && typeof tasks === 'object') existing.tasks = tasks;
  if (stages && typeof stages === 'object') existing.stages = stages;
  if (Array.isArray(inventory)) existing.inventory = inventory;
  existing.updatedAt = Date.now();

  writeGarden(code, existing);
  res.json({ ok: true, ts: Date.now() });
});

// ── Legacy compat: redirect old /api/data to default garden ──
app.get('/api/data', (req, res) => {
  res.json(DEFAULT_DATA);
});
app.post('/api/data', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Le Potager Malin running on port ${PORT}`);
});
