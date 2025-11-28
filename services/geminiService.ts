import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePlantUML = async (userPrompt: string, currentCode?: string): Promise<string> => {
  try {
    const ai = getClient();
    
    let systemInstruction = `You are a PlantUML expert. Your task is to generate valid PlantUML code based on the user's description.
    Rules:
    1. Output ONLY the PlantUML code.
    2. Start with @startuml and end with @enduml.
    3. Do not add markdown code blocks (like \`\`\`plantuml).
    4. Do not add explanations or conversational text.
    5. Use modern PlantUML syntax and styling (skinparam) to make diagrams look professional and clean.
    6. If the user provides existing code, modify it according to their request.`;

    let prompt = userPrompt;

    if (currentCode) {
        prompt = `Current Code:\n${currentCode}\n\nUser Request: ${userPrompt}\n\nUpdate the code based on the request.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for deterministic code generation
      }
    });

    const text = response.text || "";
    // Clean up if the model accidentally included markdown
    const cleanedText = text.replace(/```plantuml/g, '').replace(/```/g, '').trim();
    return cleanedText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate PlantUML code. Please check your API key and try again.");
  }
};