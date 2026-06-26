/**
 * Link Mart Backend Server - Vercel Serverless Function wrapper
 * Handles: SMTP email sending (Nodemailer) + AI email generation (Gemini/OpenAI)
 */

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', 'https://linkmart.vercel.app'] }));
app.use(express.json({ limit: '2mb' }));

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '3.0.0', timestamp: new Date().toISOString() });
});

// ─── AI Email Generation ─────────────────────────────────────────────────────
app.post('/api/generate-email', async (req, res) => {
  const { provider, apiKey, prompt, recordType, recordData, aiSettings } = req.body;

  if (!apiKey) return res.status(400).json({ error: 'API key is required.' });
  if (!recordData) return res.status(400).json({ error: 'Record data is required.' });

  const systemPrompt = buildSystemPrompt(aiSettings);
  const userPrompt = buildUserPrompt(recordType, recordData, aiSettings);
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY valid JSON in this format (no markdown, no explanation):\n{"subject":"...","body":"..."}`;

  try {
    let result;
    if (!provider || provider === 'gemini') {
      result = await generateWithGemini(apiKey, fullPrompt);
    } else {
      result = await generateWithOpenAI(apiKey, fullPrompt);
    }
    res.json(result);
  } catch (err) {
    console.error('AI generation error:', err.message);
    res.status(500).json({ error: err.message || 'AI generation failed.' });
  }
});

// ─── SMTP Connection Test ────────────────────────────────────────────────────
app.post('/api/test-connection', async (req, res) => {
  const { host, port, secure, username, password } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      host, port: Number(port),
      secure: Boolean(secure),
      auth: { user: username, pass: password },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
    });
    await transporter.verify();
    res.json({ ok: true, message: 'Connection successful! SMTP credentials are valid.' });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ─── Send Email ──────────────────────────────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
  const {
    account,       // { host, port, secure, username, password, email, name, signature, replyTo }
    to,
    subject,
    body,
    recordId,
    recordType,
  } = req.body;

  if (!account || !to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: account, to, subject, body' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: `Invalid recipient email address: ${to}` });
  }

  const messageId = `<${uuidv4()}@linkmart.local>`;
  const fromStr = account.name ? `${account.name} <${account.email}>` : account.email;

  const htmlBody = buildHtmlEmail(body, account.signature, account.name || account.email);
  const textBody = buildPlainTextEmail(body, account.signature);

  try {
    const transporter = nodemailer.createTransport({
      host: account.host,
      port: Number(account.port),
      secure: Boolean(account.secure),
      auth: { user: account.username, pass: account.password },
      tls: { rejectUnauthorized: false },
    });

    const info = await transporter.sendMail({
      from: fromStr,
      to,
      subject,
      text: textBody,
      html: htmlBody,
      headers: {
        'Message-ID': messageId,
        'X-Mailer': 'LinkMart Outreach v3.0',
        'Reply-To': account.replyTo || account.email,
        'X-Record-ID': recordId || '',
        'X-Record-Type': recordType || '',
      },
      priority: 'normal',
    });

    res.json({
      ok: true,
      messageId: info.messageId || messageId,
      response: info.response,
    });
  } catch (err) {
    console.error('Send email error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Helpers ──────────────────────────────────────────────────────────────

function buildSystemPrompt(aiSettings = {}) {
  const tone = aiSettings.tone || 'professional';
  const maxLen = aiSettings.maxLength || 250;
  const cta = aiSettings.cta || 'Reply to this email';
  const avoidWords = aiSettings.avoidWords ? `\nAvoid these words: ${aiSettings.avoidWords}` : '';
  const company = aiSettings.companyName ? `\nCompany: ${aiSettings.companyName}` : '';
  const sender = aiSettings.senderName ? `\nSender: ${aiSettings.senderName}` : '';

  return `You are an expert SEO outreach specialist and sales copywriter.
Writing tone: ${tone}
Maximum email body length: ${maxLen} words
Call-to-action: ${cta}${avoidWords}${company}${sender}
Write concise, personalized, human-sounding emails. Do NOT use generic templates.
Do NOT use excessive exclamation marks. Sound genuine and professional.`;
}

function buildUserPrompt(recordType, data, aiSettings = {}) {
  if (recordType === 'publisher') {
    return `Write a personalized outreach email to request a backlink opportunity.
Website: ${data.domain || data.url || 'their website'}
Contact Name: ${data.primaryContact || 'there'}
Country: ${data.country || 'unknown'}
Niche: ${data.niche || 'general'}
DR: ${data.dr || 'N/A'}
Organic Traffic: ${data.organicTraffic ? Number(data.organicTraffic).toLocaleString() + '/mo' : 'N/A'}
Link Type Interested In: ${data.linkType || 'Guest Post'}
Notes: ${data.notes || 'none'}
Goal: Request a ${data.linkType || 'guest post'} opportunity or backlink placement.`;
  }

  const competitorContext = aiSettings.mentionCompetitors
    ? `\nMention that building authority helps compete against stronger competitors in their niche.`
    : '';

  return `Write a personalized sales email to pitch link building / backlink services.
Prospect Website: ${data.website || 'their website'}
Country: ${data.country || 'unknown'}
Niche: ${data.niche || 'general'}
DR: ${data.dr || 'N/A'}
Monthly Organic Traffic: ${data.organicTraffic ? Number(data.organicTraffic).toLocaleString() : 'N/A'}
Avg SERP Position: ${data.avgSerpPosition ? '#' + data.avgSerpPosition : 'N/A'}
Notes: ${data.notes || 'none'}${competitorContext}
Goal: Pitch high-quality backlink services that improve rankings and organic traffic.`;
}

async function generateWithGemini(apiKey, prompt) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  return parseAIResponse(text);
}

async function generateWithOpenAI(apiKey, prompt) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 800,
  });
  const text = completion.choices[0]?.message?.content?.trim() || '';
  return parseAIResponse(text);
}

function parseAIResponse(text) {
  let cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.subject && parsed.body) return parsed;
  } catch {
    const subjectMatch = cleaned.match(/"subject"\s*:\s*"([^"]+)"/);
    const bodyMatch = cleaned.match(/"body"\s*:\s*"([\s\S]+?)(?:"\s*}|"\s*,)/);
    if (subjectMatch && bodyMatch) {
      return {
        subject: subjectMatch[1],
        body: bodyMatch[1].replace(/\\n/g, '\n'),
      };
    }
  }
  throw new Error('AI returned invalid response format. Please try regenerating.');
}

function buildHtmlEmail(body, signature, senderName) {
  const escaped = body
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  const sig = signature
    ? `<br><br><hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"><div style="color:#6B7280;font-size:14px">${signature.replace(/\n/g, '<br>')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Email from LinkMart</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1F2937;max-width:600px;margin:0 auto;padding:20px">
  <div>${escaped}</div>
  ${sig}
</body>
</html>`;
}

function buildPlainTextEmail(body, signature) {
  const sig = signature ? `\n\n--\n${signature}` : '';
  return `${body}${sig}`;
}

// Export the express app handler
module.exports = app;
