import { encrypt, decrypt } from '../utils/crypto';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const generatePlantUML = async (userPrompt: string, currentCode?: string): Promise<string> => {
  try {
    // 加密请求数据
    const requestData = JSON.stringify({
      prompt: userPrompt,
      currentCode,
    });
    const encryptedData = await encrypt(requestData);

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: encryptedData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate PlantUML code');
    }

    // 解密响应数据
    const { data: encryptedResponse } = await response.json();
    const decryptedResponse = await decrypt(encryptedResponse);
    const result = JSON.parse(decryptedResponse);
    
    return result.code;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to generate PlantUML code. Please check the server and try again.");
  }
};