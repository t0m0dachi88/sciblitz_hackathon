import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeImageWithGemini = async (imagePath, mimeType) => {
  try {
    // Read the file as base64
    const imageBytes = fs.readFileSync(imagePath);
    const base64Data = imageBytes.toString('base64');

    const prompt = "Analyze this infrastructure damage. Return a JSON object with strictly three fields: 'damage_type' (string), 'severity_level' (Low, Medium, High, Critical), and 'explanation' (short 1-sentence reason).";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ],
        config: {
            responseMimeType: "application/json",
        }
    });

    const resultText = response.text;
    const resultJson = JSON.parse(resultText);

    return resultJson;
  } catch (error) {
    console.error('Gemini Service Error:', error);
    throw error;
  }
};
