import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const TEMPLATES_DIR = path.join(__dirname, '../../../templates');
const TMP_DIR = path.join(__dirname, '../../tmp');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

Handlebars.registerHelper('safe', (val) => new Handlebars.SafeString(val || ''));
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('or', (a, b) => a || b);

function renderHbs(templateStr, context) {
  try {
    return Handlebars.compile(templateStr, { noEscape: false })(context);
  } catch (e) {
    console.error('Render error:', e.message);
    return templateStr;
  }
}

function injectThemeColor(css, color) {
  if (!color) return css;
  return css.replace(/(--primary:\s*)[^;]+;/, `$1${color};`);
}

function buildContext(globalContent, pageContent, seo, themeColor, schema, pageName, pageOrder) {
  const pages = schema.pages || {};
  const orderedKeys = pageOrder
    ? [...new Set([...pageOrder, ...Object.keys(pages)])]
    : Object.keys(pages);

  return {
    ...globalContent,
    ...pageContent,
    site_name: globalContent.site_name || 'My Website',
    seo_title: seo?.title || pageContent.title || globalContent.site_name || 'My Website',
    seo_description: seo?.description || pageContent.hero_description || '',
    seo_keywords: seo?.keywords || '',
    seo_author: seo?.author || '',
    theme_color: themeColor || '#4f46e5',
    current_year: new Date().getFullYear(),
    nav_links: orderedKeys.filter(p => pages[p]).map(p => ({
      name: pages[p]?.nav_label || (p.charAt(0).toUpperCase() + p.slice(1)),
      href: p === 'index' ? 'index.html' : `${p}.html`,
      active: p === pageName
    }))
  };
}

function copyWithCSSProcessing(src, dest, themeColor) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item), d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      copyWithCSSProcessing(s, d, themeColor);
    } else if (item.endsWith('.css') && themeColor) {
      let css = fs.readFileSync(s, 'utf8');
      css = injectThemeColor(css, themeColor);
      fs.writeFileSync(d, css, 'utf8');
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function createZip(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// POST /api/generate-site
router.post('/generate-site', async (req, res) => {
  const { template, content, themeColor, seo, pageOrder } = req.body;
  if (!template || !content) return res.status(400).json({ error: 'template and content are required' });

  const templateDir = path.join(TEMPLATES_DIR, template);
  if (!fs.existsSync(templateDir)) return res.status(404).json({ error: `Template "${template}" not found` });

  const jobId = uuidv4();
  const outDir = path.join(TMP_DIR, jobId);
  fs.mkdirSync(outDir, { recursive: true });

  try {
    const schemaPath = path.join(templateDir, 'schema.json');
    const schema = fs.existsSync(schemaPath)
      ? JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
      : { pages: {} };

    const pagesDir = path.join(templateDir, 'pages');
    if (fs.existsSync(pagesDir)) {
      const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
      for (const pageFile of pageFiles) {
        const pageName = path.basename(pageFile, '.html');
        const ctx = buildContext(content._global || {}, content[pageName] || {}, seo, themeColor, schema, pageName, pageOrder);
        let html = fs.readFileSync(path.join(pagesDir, pageFile), 'utf8');
        html = renderHbs(html, ctx);
        fs.writeFileSync(path.join(outDir, pageFile), html, 'utf8');
      }
    }

    const assetsDir = path.join(templateDir, 'assets');
    if (fs.existsSync(assetsDir)) copyWithCSSProcessing(assetsDir, path.join(outDir, 'assets'), themeColor);

    const siteName = (content._global?.site_name || template).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const zipPath = path.join(TMP_DIR, `${jobId}.zip`);
    await createZip(outDir, zipPath);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${siteName}-site.zip"`);
    const stream = fs.createReadStream(zipPath);
    stream.pipe(res);
    stream.on('end', () => {
      setTimeout(() => {
        fs.rmSync(outDir, { recursive: true, force: true });
        fs.rmSync(zipPath, { force: true });
      }, 5000);
    });
  } catch (err) {
    fs.rmSync(outDir, { recursive: true, force: true });
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/preview-page
router.post('/preview-page', (req, res) => {
  const { template, page, content, themeColor, seo, pageOrder } = req.body;
  const templateDir = path.join(TEMPLATES_DIR, template);
  const pagePath = path.join(templateDir, 'pages', `${page}.html`);

  if (!fs.existsSync(pagePath)) return res.status(404).json({ error: 'Page not found' });

  try {
    const schemaPath = path.join(templateDir, 'schema.json');
    const schema = fs.existsSync(schemaPath) ? JSON.parse(fs.readFileSync(schemaPath, 'utf8')) : { pages: {} };

    const ctx = buildContext(content?._global || {}, content?.[page] || {}, seo, themeColor, schema, page, pageOrder);
    let html = fs.readFileSync(pagePath, 'utf8');
    html = renderHbs(html, ctx);

    // Inline CSS
    const cssPath = path.join(templateDir, 'assets', 'css', 'style.css');
    if (fs.existsSync(cssPath)) {
      let css = fs.readFileSync(cssPath, 'utf8');
      css = injectThemeColor(css, themeColor);
      html = html.replace(/<link[^>]+href=["'](?:\.\.\/)?assets\/css\/style\.css["'][^>]*>/gi, `<style>${css}</style>`);
    }

    // Inline JS
    const jsPath = path.join(templateDir, 'assets', 'js', 'script.js');
    if (fs.existsSync(jsPath)) {
      const js = fs.readFileSync(jsPath, 'utf8');
      html = html.replace(/<script[^>]+src=["'](?:\.\.\/)?assets\/js\/script\.js["'][^>]*><\/script>/gi, `<script>${js}</script>`);
    }

    // ── CRITICAL: Inject link-interceptor before </body> ──────────────────────
    // All internal anchor clicks (index.html, about.html, etc.) are caught and
    // sent via postMessage to the parent React app instead of navigating the
    // parent frame. External links (http/https) open in a new tab.
    const interceptScript = `
<script>
(function() {
  function intercept(e) {
    var el = e.target.closest('a[href]');
    if (!el) return;
    var href = el.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    // External link → open in new tab, don't interfere
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
      return;
    }
    // Internal .html link → notify parent to load that page
    e.preventDefault();
    e.stopPropagation();
    var pageName = href.replace(/\\.html$/, '').replace(/^.*\\//, '');
    try { window.parent.postMessage({ type: 'PREVIEW_NAVIGATE', page: pageName }, '*'); } catch(_) {}
  }
  document.addEventListener('click', intercept, true);
  // Also notify parent when fully loaded (for height sync)
  window.addEventListener('load', function() {
    try { window.parent.postMessage({ type: 'PREVIEW_LOADED', height: document.body.scrollHeight }, '*'); } catch(_) {}
  });
})();
</script>`;

    html = html.replace(/<\/body>/i, interceptScript + '\n</body>');

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
