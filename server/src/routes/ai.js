import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const TEMPLATES_DIR = path.join(__dirname, '../../../templates');

// POST /api/ai/generate-content
// Calls Claude API to fill in all content fields from a user prompt
router.post('/generate-content', async (req, res) => {
  const { templateId, prompt, fields } = req.body;

  if (!templateId || !prompt) {
    return res.status(400).json({ error: 'templateId and prompt are required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Return smart mock data when no API key is configured
    return res.json({ content: generateMockContent(templateId, fields, prompt) });
  }

  try {
    const schemaPath = path.join(TEMPLATES_DIR, templateId, 'schema.json');
    const schema = fs.existsSync(schemaPath)
      ? JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
      : { pages: {}, global: {} };

    // Flatten all fields from schema for the AI
    const allFields = {};
    if (schema.global) {
      Object.entries(schema.global).forEach(([k, v]) => { allFields[`_global.${k}`] = v.label; });
    }
    if (schema.pages) {
      Object.entries(schema.pages).forEach(([page, pf]) => {
        Object.entries(pf).forEach(([k, v]) => { allFields[`${page}.${k}`] = v.label; });
      });
    }

    const systemPrompt = `You are a professional copywriter creating website content. 
Given a business/project description, generate compelling, professional content for all website fields.
Return ONLY a valid JSON object mapping "page.field_key" to the generated string value.
Be concise but impactful. No markdown, no explanations, just the JSON object.`;

    const userPrompt = `Business description: "${prompt}"
Template: ${schema.meta?.name || templateId}

Generate content for these fields:
${Object.entries(allFields).map(([k, label]) => `- ${k}: ${label}`).join('\n')}

Return a JSON object with all field keys mapped to generated string values.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Claude API error');
    }

    const data = await response.json();
    const text = data.content[0]?.text || '{}';

    // Parse generated JSON
    let generated = {};
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      generated = JSON.parse(clean);
    } catch {
      return res.json({ content: generateMockContent(templateId, fields, prompt) });
    }

    // Restructure flat keys into nested content object
    const content = {};
    Object.entries(generated).forEach(([key, value]) => {
      const [page, ...fieldParts] = key.split('.');
      const field = fieldParts.join('.');
      if (!content[page]) content[page] = {};
      content[page][field] = value;
    });

    res.json({ content, source: 'claude' });
  } catch (err) {
    console.error('AI generation error:', err.message);
    // Fallback to mock
    res.json({ content: generateMockContent(templateId, fields, prompt), source: 'mock', note: err.message });
  }
});

// POST /api/ai/improve-text
router.post('/improve-text', async (req, res) => {
  const { text, instruction, fieldType } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.json({ improved: improveMockText(text, instruction) });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `${instruction || 'Improve this website copy to be more professional and engaging'}:\n\n"${text}"\n\nReturn ONLY the improved text, no quotes or explanation.`
        }]
      })
    });

    const data = await response.json();
    res.json({ improved: data.content[0]?.text?.trim() || text });
  } catch (err) {
    res.json({ improved: improveMockText(text, instruction) });
  }
});

function generateMockContent(templateId, fields, prompt) {
  const words = prompt.toLowerCase().split(/\s+/);
  const isPortfolio = templateId.includes('portfolio');
  const isBlog = templateId.includes('blog');
  const businessName = prompt.split(/\s+/).slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (isPortfolio) {
    return {
      _global: { site_name: businessName, logo_text: businessName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), role_title: 'Creative Developer & Designer', primary_email: 'hello@portfolio.dev', github_url: 'https://github.com', linkedin_url: 'https://linkedin.com', twitter_url: 'https://twitter.com' },
      index: { title: `${businessName} — Portfolio`, hero_greeting: "Hi, I'm", hero_description: `${prompt}. I build exceptional digital experiences that combine technical excellence with beautiful design.`, cta_work: 'View My Work', cta_contact: 'Get In Touch', project1_title: 'Featured Project Alpha', project1_desc: 'A high-impact digital product that solved real problems for thousands of users.', project1_tech: 'React · Node · PostgreSQL', project2_title: 'Product Design System', project2_desc: 'Comprehensive component library shipped to 15+ teams across the organization.', project2_tech: 'Figma · Storybook · TypeScript', project3_title: 'Mobile App Launch', project3_desc: 'Cross-platform mobile experience with 50k+ downloads in the first month.', project3_tech: 'React Native · Firebase', skill1: 'React / Next.js', skill2: 'TypeScript', skill3: 'Node.js', skill4: 'UI/UX Design', skill5: 'PostgreSQL', skill6: 'DevOps / CI/CD' },
      about: { title: `About — ${businessName}`, bio_heading: 'About Me', bio_text: `I'm a passionate creator with deep expertise in ${prompt}. I thrive at the intersection of design and engineering, building products that people love to use. Outside of work, I'm constantly learning and exploring new technologies.`, years_exp: '6', projects_shipped: '38', happy_clients: '24' },
      contact: { title: `Contact — ${businessName}`, contact_heading: "Let's Build Something", contact_desc: 'Available for freelance projects, full-time opportunities, and exciting collaborations. Reach out and let\'s talk.' }
    };
  }

  if (isBlog) {
    return {
      _global: { site_name: businessName, logo_text: businessName, tagline: 'Insights worth reading.', author_name: 'The Editorial Team', author_bio: `Exploring the world of ${prompt} through long-form writing and careful analysis.`, primary_email: `hello@${businessName.toLowerCase().replace(/\s/g, '')}.com`, twitter_url: 'https://twitter.com', topics: 'Technology, Culture, Business, Ideas' },
      index: { title: `${businessName} — ${prompt}`, featured_title: `The Future of ${businessName}: What's Coming Next`, featured_excerpt: `An in-depth look at where ${prompt} is headed and what it means for everyone involved.`, featured_category: 'Analysis', featured_date: 'March 2026', post1_title: `Getting Started with ${prompt}`, post1_excerpt: 'A comprehensive beginner\'s guide to the fundamentals.', post1_category: 'Guide', post1_date: 'March 10, 2026', post2_title: '5 Trends You Need to Know', post2_excerpt: 'The most important developments shaping the landscape right now.', post2_category: 'Trends', post2_date: 'March 5, 2026', post3_title: 'Expert Interview: Inside the Industry', post3_excerpt: 'We sat down with leading voices to get their perspective.', post3_category: 'Interview', post3_date: 'Feb 28, 2026' },
      about: { title: `About — ${businessName}`, about_heading: 'Why We Write', about_text: `${businessName} was founded to bring depth and clarity to ${prompt}. We believe in long-form thinking over hot takes, and in serving readers who care about quality over quantity.`, newsletter_heading: 'Join Our Readers', newsletter_desc: 'Thoughtful writing delivered weekly. No spam, ever.' },
      contact: { title: `Contact — ${businessName}`, contact_heading: 'Get In Touch', contact_desc: 'Whether you want to pitch a story, collaborate, or just say hello — we\'d love to hear from you.' }
    };
  }

  // Business default
  return {
    _global: { site_name: businessName, logo_text: businessName.split(' ')[0].toUpperCase(), primary_email: `hello@${businessName.toLowerCase().replace(/\s/g, '')}.com`, phone: '+1 (555) 000-0000', address: '123 Business Ave, New York, NY 10001', footer_tagline: `${businessName} — ${prompt}.` },
    index: { title: `${businessName} — Home`, hero_title: prompt, hero_subtitle: `The smartest way to ${words.slice(0, 4).join(' ')}`, hero_description: `We specialize in ${prompt}. Our team delivers measurable results that help businesses grow, innovate, and succeed in competitive markets.`, cta_primary: 'Get Started Today', cta_secondary: 'See Our Work', service1_title: 'Strategy', service1_desc: 'Data-driven strategic planning that aligns your goals with market realities.', service2_title: 'Execution', service2_desc: 'Hands-on implementation by experts who care about quality and results.', service3_title: 'Growth', service3_desc: 'Sustainable growth systems that scale with your business ambitions.', stats_clients: '300+', stats_projects: '800+', stats_years: '10' },
    about: { title: `About — ${businessName}`, page_heading: 'Our Story', mission_title: 'Our Mission', mission_text: `To empower businesses through ${prompt}, delivering exceptional value with every engagement.`, vision_title: 'Our Vision', vision_text: `A world where every business has access to the ${prompt} expertise they need to thrive.`, team_member1_name: 'Alex Johnson', team_member1_role: 'CEO & Founder', team_member2_name: 'Sam Rivera', team_member2_role: 'Head of Delivery', team_member3_name: 'Jordan Lee', team_member3_role: 'Creative Director' },
    contact: { title: `Contact — ${businessName}`, page_heading: 'Start a Conversation', page_subheading: "We'd love to learn about your goals and explore how we can help." }
  };
}

function improveMockText(text, instruction = '') {
  const improvements = [
    `${text} — crafted to perfection.`,
    text.charAt(0).toUpperCase() + text.slice(1).replace(/\.$/, '') + ', delivering excellence at every step.',
    `Experience ${text.toLowerCase()} like never before.`
  ];
  return improvements[Math.floor(Math.random() * improvements.length)];
}

export default router;
