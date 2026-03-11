const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3005;
const DATA_DIR = path.join(__dirname, 'data', 'gardens');
const PHOTOS_DIR = path.join(__dirname, 'data', 'photos');

// Ensure data directories exist
[path.join(__dirname, 'data'), DATA_DIR, PHOTOS_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const DEFAULT_DATA = { garden: [], journal: [], tasks: {}, stages: {}, inventory: {} };

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

// ═══════ PHOTO UPLOAD ═══════
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PHOTOS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      if (!allowed.includes(ext)) return cb(new Error('Type non autorisé'));
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont autorisées'));
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, { index: 'index.html' }));

// Serve photos statically
app.use('/photos', express.static(PHOTOS_DIR));

// POST /api/photo — upload a photo, returns { url }
app.post('/api/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucune image' });
  res.json({ url: `/photos/${req.file.filename}` });
}, (err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Erreur upload' });
});

// DELETE /api/photo/:filename — delete a photo
app.delete('/api/photo/:filename', (req, res) => {
  const filename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const filepath = path.join(PHOTOS_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
  res.json({ ok: true });
});

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
  if (inventory && typeof inventory === 'object') existing.inventory = inventory;
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
