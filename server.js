const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;
const DATA_FILE = path.join(__dirname, 'data', 'garden.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Default data structure
const DEFAULT_DATA = { garden: [], journal: [], tasks: {} };

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading data:', e.message);
  }
  return { ...DEFAULT_DATA };
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Init file if missing
if (!fs.existsSync(DATA_FILE)) writeData(DEFAULT_DATA);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, { index: 'index.html' }));

// GET — fetch all shared data
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// POST — save all shared data
app.post('/api/data', (req, res) => {
  const { garden, journal, tasks } = req.body;
  const data = {};
  if (Array.isArray(garden)) data.garden = garden;
  if (Array.isArray(journal)) data.journal = journal;
  if (tasks && typeof tasks === 'object') data.tasks = tasks;

  const current = readData();
  const merged = { ...current, ...data };
  writeData(merged);
  res.json({ ok: true, ts: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Le Potager Malin running on port ${PORT}`);
});
