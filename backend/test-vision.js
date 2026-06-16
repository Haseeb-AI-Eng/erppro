require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function listModels() {
  console.log('Querying Groq models list...');
  try {
    const models = await groq.models.list();
    console.log('Available models:', models.data.map(m => m.id));
  } catch (err) {
    console.error('Failed to list models:', err);
  }
}

listModels();
