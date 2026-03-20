import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const TEMPLATES_DIR = path.join(__dirname, '../../../templates');

// GET /api/templates
router.get('/', (req, res) => {
  try {
    const dirs = fs.readdirSync(TEMPLATES_DIR).filter(d => {
      const full = path.join(TEMPLATES_DIR, d);
      return fs.statSync(full).isDirectory();
    });

    const templates = dirs.map(name => {
      const schemaPath = path.join(TEMPLATES_DIR, name, 'schema.json');
      const schema = fs.existsSync(schemaPath)
        ? JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
        : {};
      return {
        id: name,
        name: schema.meta?.name || name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: schema.meta?.description || '',
        thumbnail: schema.meta?.thumbnail || null,
        tags: schema.meta?.tags || [],
        pages: Object.keys(schema.pages || {})
      };
    });

    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/templates/:name/schema
router.get('/:name/schema', (req, res) => {
  try {
    const schemaPath = path.join(TEMPLATES_DIR, req.params.name, 'schema.json');
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    res.json(schema);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/templates/:name/preview/:page
router.get('/:name/preview/:page', (req, res) => {
  try {
    const pagePath = path.join(TEMPLATES_DIR, req.params.name, 'pages', `${req.params.page}.html`);
    if (!fs.existsSync(pagePath)) {
      return res.status(404).json({ error: 'Page not found' });
    }
    const html = fs.readFileSync(pagePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
