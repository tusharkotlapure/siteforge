import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const TEMPLATES_DIR = path.join(__dirname, '../../../templates');
const TMP_DIR = path.join(__dirname, '../../tmp');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// POST /api/deploy/netlify
// Generates a Netlify-ready ZIP with netlify.toml + _redirects
router.post('/netlify', async (req, res) => {
  await generateDeployZip(req, res, 'netlify');
});

// POST /api/deploy/vercel
// Generates a Vercel-ready ZIP with vercel.json
router.post('/vercel', async (req, res) => {
  await generateDeployZip(req, res, 'vercel');
});

// POST /api/deploy/github-pages
// Generates a GitHub Pages ready ZIP with .nojekyll
router.post('/github-pages', async (req, res) => {
  await generateDeployZip(req, res, 'github-pages');
});

async function generateDeployZip(req, res, target) {
  const { template, content, themeColor, seo, pageOrder, customPages } = req.body;
  if (!template || !content) return res.status(400).json({ error: 'template and content are required' });

  const templateDir = path.join(TEMPLATES_DIR, template);
  if (!fs.existsSync(templateDir)) return res.status(404).json({ error: 'Template not found' });

  const jobId = uuidv4();
  const outDir = path.join(TMP_DIR, jobId);
  fs.mkdirSync(outDir, { recursive: true });

  try {
    const schemaPath = path.join(templateDir, 'schema.json');
    const schema = fs.existsSync(schemaPath)
      ? JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
      : { pages: {} };

    const siteNameSlug = (content._global?.site_name || 'my-site').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Build pages with navigation order support
    const pagesDir = path.join(templateDir, 'pages');
    let pageFiles = fs.existsSync(pagesDir)
      ? fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'))
      : [];

    // Respect custom page order if provided
    if (pageOrder && Array.isArray(pageOrder)) {
      pageFiles.sort((a, b) => {
        const ai = pageOrder.indexOf(path.basename(a, '.html'));
        const bi = pageOrder.indexOf(path.basename(b, '.html'));
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }

    for (const pageFile of pageFiles) {
      const pageName = path.basename(pageFile, '.html');
      const pageContent = content[pageName] || {};
      const globalContent = content._global || {};

      const ctx = buildContext(globalContent, pageContent, seo, themeColor, schema, pageName, pageOrder);
      let html = fs.readFileSync(path.join(pagesDir, pageFile), 'utf8');
      html = renderHbs(html, ctx);
      fs.writeFileSync(path.join(outDir, pageFile), html, 'utf8');
    }

    // Copy + process assets
    const assetsDir = path.join(templateDir, 'assets');
    if (fs.existsSync(assetsDir)) copyWithCSSProcessing(assetsDir, path.join(outDir, 'assets'), themeColor);

    // Add platform-specific config files
    switch (target) {
      case 'netlify':
        writeNetlifyConfig(outDir, siteNameSlug, pageFiles.map(f => path.basename(f, '.html')));
        break;
      case 'vercel':
        writeVercelConfig(outDir, siteNameSlug);
        break;
      case 'github-pages':
        writeGithubPagesConfig(outDir, siteNameSlug);
        break;
    }

    // Create zip
    const zipPath = path.join(TMP_DIR, `${jobId}.zip`);
    await zipDir(outDir, zipPath);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${siteNameSlug}-${target}-deploy.zip"`);
    const stream = fs.createReadStream(zipPath);
    stream.pipe(res);
    stream.on('end', () => {
      setTimeout(() => {
        fs.rmSync(outDir, { recursive: true, force: true });
        fs.rmSync(zipPath, { force: true });
      }, 8000);
    });
  } catch (err) {
    fs.rmSync(outDir, { recursive: true, force: true });
    console.error('Deploy export error:', err);
    res.status(500).json({ error: err.message });
  }
}

function writeNetlifyConfig(outDir, name, pages) {
  // netlify.toml
  fs.writeFileSync(path.join(outDir, 'netlify.toml'), `[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
`);

  // _redirects (Netlify SPA fallback)
  fs.writeFileSync(path.join(outDir, '_redirects'), `/*    /index.html   200\n`);

  // _headers (security headers)
  fs.writeFileSync(path.join(outDir, '_headers'), `/*
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer-when-downgrade
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`);

  // README
  fs.writeFileSync(path.join(outDir, 'DEPLOY-NETLIFY.md'), `# Deploy to Netlify

## Option 1: Drag & Drop (Fastest)
1. Visit https://app.netlify.com
2. Drag this entire folder to the "Deploy" zone
3. Your site is live in seconds!

## Option 2: Netlify CLI
\`\`\`bash
npm install -g netlify-cli
netlify deploy --prod --dir .
\`\`\`

## Option 3: GitHub Integration
1. Push this folder to a GitHub repo
2. Connect repo in Netlify dashboard
3. Auto-deploy on every push

## Custom Domain
Set your custom domain in: Site Settings → Domain Management
`);
}

function writeVercelConfig(outDir, name) {
  fs.writeFileSync(path.join(outDir, 'vercel.json'), JSON.stringify({
    version: 2,
    name: name,
    builds: [{ src: "**/*.html", use: "@vercel/static" }],
    routes: [
      { src: "/assets/(.*)", dest: "/assets/$1" },
      { src: "/(.*)\\.html", dest: "/$1.html" },
      { src: "/(.*)", dest: "/index.html" }
    ],
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" }
        ]
      },
      {
        source: "/assets/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(outDir, 'DEPLOY-VERCEL.md'), `# Deploy to Vercel

## Option 1: Vercel CLI
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

## Option 2: Vercel Dashboard
1. Visit https://vercel.com/new
2. Import this project folder
3. Click Deploy

## Custom Domain
Settings → Domains → Add your domain
`);
}

function writeGithubPagesConfig(outDir, name) {
  // .nojekyll prevents Jekyll processing
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

  fs.writeFileSync(path.join(outDir, 'DEPLOY-GITHUB-PAGES.md'), `# Deploy to GitHub Pages

## Steps
1. Create a new GitHub repository
2. Push this folder contents:
\`\`\`bash
git init
git add .
git commit -m "Initial site deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/${name}.git
git push -u origin main
\`\`\`
3. Go to Settings → Pages → Source: Deploy from branch (main)
4. Your site: https://YOUR_USERNAME.github.io/${name}

## Custom Domain
Add a CNAME file with your domain name to this folder.
`);
}

function buildContext(globalContent, pageContent, seo, themeColor, schema, pageName, pageOrder) {
  const pages = schema.pages || {};
  const orderedPages = pageOrder
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
    nav_links: orderedPages.filter(p => pages[p]).map(p => ({
      name: pages[p]?.nav_label || (p.charAt(0).toUpperCase() + p.slice(1)),
      href: p === 'index' ? 'index.html' : `${p}.html`,
      active: p === pageName
    }))
  };
}

function renderHbs(templateStr, context) {
  try {
    return Handlebars.compile(templateStr, { noEscape: false })(context);
  } catch (e) {
    return templateStr;
  }
}

function copyWithCSSProcessing(src, dest, themeColor) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item), d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      copyWithCSSProcessing(s, d, themeColor);
    } else if (item.endsWith('.css') && themeColor) {
      let css = fs.readFileSync(s, 'utf8');
      css = css.replace(/(--primary:\s*)[^;]+;/, `$1${themeColor};`);
      fs.writeFileSync(d, css, 'utf8');
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function zipDir(sourceDir, outPath) {
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

export default router;
