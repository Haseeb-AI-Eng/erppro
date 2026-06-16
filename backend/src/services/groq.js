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

const scanReceipt = async (filename, fileBuffer, ocrText = '') => {
  const ocrSection = ocrText 
    ? `The client-side OCR has extracted the following text from the receipt image:\n"""\n${ocrText}\n"""\nExtract the real items, prices, quantities, merchant name, date, tax, and total from the text above.` 
    : `A user has uploaded a receipt file named "${filename}". Analyze what would typically be in this receipt.`;

  const prompt = `You are an advanced AI receipt OCR parser and structured data extractor.
${ocrSection}

Generate a structured JSON summary based on the text. If the text does not contain clear values, make realistic estimates.
Make sure to:
1. Identify the Merchant Name.
2. Identify the Date and Time of the transaction (realistic datetime in format YYYY-MM-DD HH:MM).
3. Extract the list of Items (array of { name, quantity, price, total }).
4. Calculate the Subtotal.
5. Extract or calculate the Tax/VAT (between 5% and 15%).
6. Calculate the Total Amount.
7. Determine the Currency (default to PKR if the OCR text, merchant, or filename suggests Pakistan or Urdu-sounding names like Imtiaz, Chase Up, Metro, Al-Fatah, or currency is Rs/PKR. Otherwise USD).
8. Provide a short summary of what was purchased.

Return ONLY a valid JSON object matching this schema. Do not include markdown formatting like \`\`\`json. Return pure JSON:
{
  "merchant": "Store Name",
  "date": "2026-06-15 14:30",
  "items": [
    { "name": "Item A", "quantity": 1, "price": 100, "total": 100 }
  ],
  "subtotal": 100,
  "tax": 5,
  "total": 105,
  "currency": "PKR",
  "summary": "Bought groceries"
}`;
  
  const res = await chat([{ role: 'user', content: prompt }]);
  try {
    // Strip markdown formatting if the model included it
    let cleanRes = res.trim();
    if (cleanRes.startsWith("```json")) {
      cleanRes = cleanRes.substring(7);
    }
    if (cleanRes.startsWith("```")) {
      cleanRes = cleanRes.substring(3);
    }
    if (cleanRes.endsWith("```")) {
      cleanRes = cleanRes.substring(0, cleanRes.length - 3);
    }
    return JSON.parse(cleanRes.trim());
  } catch (err) {
    console.error('Failed to parse Groq response as JSON:', res);
    return {
      merchant: "Local General Store",
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      items: [
        { name: "Sugar", quantity: 2, price: 150, total: 300 },
        { name: "Flour", quantity: 1, price: 800, total: 800 },
        { name: "Cooking Oil", quantity: 1, price: 1200, total: 1200 }
      ],
      subtotal: 2300,
      tax: 115,
      total: 2415,
      currency: "PKR",
      summary: "Purchased basic kitchen ingredients from local market."
    };
  }
};

const lookupMarketPrice = async (product, location, currency = 'USD') => {
  const prompt = `You are a real-time global commodity and local product market pricing assistant.
Find or estimate the current realistic retail and wholesale price of "${product}" in "${location}" using the local currency "${currency}".

Generate a structured JSON matching the following schema. Make sure prices, units, and categories are extremely realistic for the location. For instance, if location is in Pakistan, prices should be in Pak Rupees (PKR) and match local inflation rates of 2026.

Schema:
{
  "id": "${product.toLowerCase().replace(/[^a-z0-9]/g, '_')}",
  "name": "${product}",
  "category": "Category (e.g. Essentials, Electronics, Fuel, Construction, Food, Machinery)",
  "unit": "standard packaging unit (e.g. 1 kg, 1 Liter, 1 Bag, 1 Item, 1 dozen)",
  "currentPrice": 120,
  "change": 5,
  "trend": "up",
  "history": [
    { "date": "Mon", "price": 110 },
    { "date": "Tue", "price": 112 },
    { "date": "Wed", "price": 115 },
    { "date": "Thu", "price": 118 },
    { "date": "Fri", "price": 120 }
  ],
  "markets": [
    { "name": "Wholesale Market (Mandi/Distributor)", "price": 105 },
    { "name": "Super Market / Retail Chain", "price": 130 },
    { "name": "Local Retail Shop", "price": 120 }
  ]
}

Return ONLY the raw JSON object. Do not wrap in markdown or code blocks.`;

  const res = await chat([{ role: 'user', content: prompt }]);
  try {
    let cleanRes = res.trim();
    if (cleanRes.startsWith("```json")) {
      cleanRes = cleanRes.substring(7);
    }
    if (cleanRes.startsWith("```")) {
      cleanRes = cleanRes.substring(3);
    }
    if (cleanRes.endsWith("```")) {
      cleanRes = cleanRes.substring(0, cleanRes.length - 3);
    }
    return JSON.parse(cleanRes.trim());
  } catch (err) {
    console.error('Failed to parse Groq response as JSON for market lookup:', res);
    return {
      id: product.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: product,
      category: "Market Goods",
      unit: "1 Unit",
      currentPrice: 150,
      change: 0,
      trend: "up",
      history: [
        { date: 'Mon', price: 150 },
        { date: 'Tue', price: 150 },
        { date: 'Wed', price: 150 },
        { date: 'Thu', price: 150 },
        { date: 'Fri', price: 150 },
      ],
      markets: [
        { name: 'Wholesale distributor', price: 135 },
        { name: 'Retailer store', price: 150 }
      ]
    };
  }
};

module.exports = { chat, generateTaskSuggestion, analyzePerformance, generatePayrollInsight, generateOrgOnboarding, chatAssistant, generateEmail, summarizeDocument, calculateHealthScore, scanReceipt, lookupMarketPrice };