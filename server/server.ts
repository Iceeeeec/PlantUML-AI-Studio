/**
 * 标题: Server
 * 说明: PlantUML AI Studio 后端服务，通过 OpenAI 兼容的中转 API 生成 PlantUML 代码
 * 时间: 2026-03-05 10:40
 * @author: zhoujunyu
 */

import express from "express";
import cors from "cors";
import fetch, { Headers, Request, Response } from "node-fetch";
import dotenv from "dotenv";
import { encrypt, decrypt } from "./crypto.js";

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

/**
 * 获取中转站 API 配置
 * @returns API 配置对象，包含 url、key、model
 */
const getApiConfig = () => {
  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "gemini-2.5-flash";

  if (!apiUrl || !apiKey) {
    throw new Error(
      "AI_API_URL or AI_API_KEY not found in environment variables",
    );
  }

  return { apiUrl, apiKey, model };
};

/**
 * 调用中转站 AI API（OpenAI Chat Completions 兼容格式）
 * @param systemPrompt - 系统提示词
 * @param userPrompt - 用户提示词
 * @returns AI 生成的文本内容
 */
const callAiApi = async (
  systemPrompt: string,
  userPrompt: string,
): Promise<string> => {
  const { apiUrl, apiKey, model } = getApiConfig();

  const requestBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
    // 超时时间 30 秒
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API request failed (${response.status}): ${errorText}`);
  }

  const responseJson = (await response.json()) as any;

  // 从 OpenAI 标准响应格式提取内容: choices[0].message.content
  const content = responseJson?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI API response did not contain expected content");
  }

  return content;
};

/**
 * POST /api/generate - 接收加密的用户请求，调用 AI 生成 PlantUML 代码并返回加密响应
 */
app.post("/api/generate", async (req, res) => {
  try {
    // 解密请求数据
    const { data: encryptedData } = req.body;
    if (!encryptedData) {
      res.status(400).json({ error: "encrypted data is required" });
      return;
    }

    const decryptedData = decrypt(encryptedData);
    const { prompt, currentCode } = JSON.parse(decryptedData);

    if (!prompt) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    // 系统提示词：定义 AI 的角色和行为规则
    const systemInstruction = `You are a PlantUML expert. Your task is to generate valid PlantUML code based on the user's description.
    Rules:
    1. Output ONLY the PlantUML code.
    2. Start with @startuml and end with @enduml.
    3. Do not add markdown code blocks (like \`\`\`plantuml).
    4. Do not add explanations or conversational text.
    5. Use modern PlantUML syntax and styling (skinparam) to make diagrams look professional and clean.
    6. If the user provides existing code, modify it according to their request.`;

    // 构建用户提示词
    let finalPrompt = prompt;
    if (currentCode) {
      finalPrompt = `Current Code:\n${currentCode}\n\nUser Request: ${prompt}\n\nUpdate the code based on the request.`;
    }

    // 调用中转站 AI API
    const text = await callAiApi(systemInstruction, finalPrompt);

    // 清理返回的代码（移除可能的 markdown 包裹）
    const cleanedText = text
      .replace(/```plantuml/g, "")
      .replace(/```/g, "")
      .trim();

    // 加密响应数据
    const responseData = JSON.stringify({ code: cleanedText });
    const encryptedResponse = encrypt(responseData);

    res.json({ data: encryptedResponse });
  } catch (error) {
    console.error("AI API Error:", error);
    res.status(500).json({ error: "Failed to generate PlantUML code" });
  }
});

/**
 * GET /health - 健康检查接口
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
