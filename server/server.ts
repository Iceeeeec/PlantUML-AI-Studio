import express from 'express';
import cors from 'cors';
import fetch, { Headers, Request, Response } from 'node-fetch';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { encrypt, decrypt } from './crypto.js';

// Polyfill for older Node.js versions
if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const getClient = () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not found in environment variables');
  }
  return new GoogleGenAI({ apiKey });
};

app.post('/api/generate', async (req, res) => {
  try {
    // 解密请求数据
    const { data: encryptedData } = req.body;
    if (!encryptedData) {
      res.status(400).json({ error: 'encrypted data is required' });
      return;
    }

    const decryptedData = decrypt(encryptedData);
    const { prompt, currentCode } = JSON.parse(decryptedData);

    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const ai = getClient();

    const systemInstruction = `You are a PlantUML expert. Your task is to generate valid PlantUML code based on the user's description.
    Rules:
    1. Output ONLY the PlantUML code.
    2. Start with @startuml and end with @enduml.
    3. Do not add markdown code blocks (like \`\`\`plantuml).
    4. Do not add explanations or conversational text.
    5. Use modern PlantUML syntax and styling (skinparam) to make diagrams look professional and clean.
    6. If the user provides existing code, modify it according to their request.`;

    let finalPrompt = prompt;
    if (currentCode) {
      finalPrompt = `Current Code:\n${currentCode}\n\nUser Request: ${prompt}\n\nUpdate the code based on the request.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```plantuml/g, '').replace(/```/g, '').trim();

    // 加密响应数据
    const responseData = JSON.stringify({ code: cleanedText });
    const encryptedResponse = encrypt(responseData);

    res.json({ data: encryptedResponse });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate PlantUML code' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
