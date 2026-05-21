const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const chat = async (messages, model = 'llama-3.1-8b-instant') => {
  console.log('🔑 Groq key:', process.env.GROQ_API_KEY?.slice(0, 15) + '...');
  console.log('🤖 Model:', model);
  try {
    const res = await groq.chat.completions.create({ model, messages, max_tokens: 1024 });
    return res.choices[0].message.content;
  } catch (err) {
    console.error('❌ Groq error status:', err.status);
    console.error('❌ Groq error message:', err.message);
    console.error('❌ Groq error body:', JSON.stringify(err.error));
    throw err;
  }
};

const generateTaskSuggestion = async (context) => {
  const prompt = `You are an ERP AI assistant. Based on this context, suggest a task title, description, priority (low/medium/high), and deadline in days from now.
Context: ${context}
Reply as JSON: { "title": "", "description": "", "priority": "", "deadlineDays": 0 }`;
  const res = await chat([{ role: 'user', content: prompt }]);
  try { return JSON.parse(res); } catch { return { title: context, description: '', priority: 'medium', deadlineDays: 7 }; }
};

const analyzePerformance = async (data) => {
  const prompt = `Analyze this employee performance data and give a brief AI insight in 2-3 sentences:
${JSON.stringify(data)}`;
  return chat([{ role: 'user', content: prompt }]);
};

const generatePayrollInsight = async (data) => {
  const prompt = `You are a payroll AI. Analyze this payroll data and detect any anomalies or insights:
${JSON.stringify(data)}
Reply with a short analysis.`;
  return chat([{ role: 'user', content: prompt }]);
};

const generateOrgOnboarding = async (industry) => {
  const prompt = `You are an ERP onboarding AI. For a company in the "${industry}" industry, suggest:
1. Standard departments (list of names)
2. Common roles
3. A brief welcome message

Reply as JSON: { "departments": [], "roles": [], "welcome": "" }`;
  const res = await chat([{ role: 'user', content: prompt }]);
  try { return JSON.parse(res); } catch { return { departments: ['HR', 'Finance', 'Operations'], roles: ['Manager', 'Employee'], welcome: 'Welcome aboard!' }; }
};

const chatAssistant = async (messages, orgContext) => {
  const system = `You are an intelligent ERP AI assistant for ${orgContext?.orgName || 'the organization'}. 
You help with tasks, attendance, payroll, HR queries, and productivity. 
Be concise, professional, and helpful. If asked to generate reports or emails, provide structured responses.`;
  const fullMessages = [{ role: 'system', content: system }, ...messages];
  return chat(fullMessages, 'llama-3.1-8b-instant');
};

const generateEmail = async (type, context) => {
  const prompt = `Generate a professional ${type} email for an ERP system. Context: ${JSON.stringify(context)}
Return JSON: { "subject": "", "body": "" }`;
  const res = await chat([{ role: 'user', content: prompt }]);
  try { return JSON.parse(res); } catch { return { subject: type, body: res }; }
};

const summarizeDocument = async (text) => {
  const prompt = `Summarize this document and extract key information, deadlines, and risks:
${text.substring(0, 3000)}
Return JSON: { "summary": "", "keyPoints": [], "deadlines": [], "risks": [] }`;
  const res = await chat([{ role: 'user', content: prompt }]);
  try { return JSON.parse(res); } catch { return { summary: res, keyPoints: [], deadlines: [], risks: [] }; }
};

const calculateHealthScore = async (orgData) => {
  const prompt = `Calculate an organization health score (0-100) based on this data:
${JSON.stringify(orgData)}
Return JSON: { "score": 0, "insights": [], "recommendations": [] }`;
  const res = await chat([{ role: 'user', content: prompt }]);
  try { return JSON.parse(res); } catch { return { score: 75, insights: [], recommendations: [] }; }
};

module.exports = { chat, generateTaskSuggestion, analyzePerformance, generatePayrollInsight, generateOrgOnboarding, chatAssistant, generateEmail, summarizeDocument, calculateHealthScore };