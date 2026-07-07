import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeImageWithGemini = async (imagePath, mimeType, address = '') => {
  try {
    const imageBytes = fs.readFileSync(imagePath);
    const base64Data = imageBytes.toString('base64');

    const prompt = `Analyze this infrastructure damage. Return a JSON object with these fields:
      'damage_type' (string),
      'severity_level' (Low, Medium, High, Critical),
      'explanation' (short 1-sentence reason)`;

    const addressPrompt = address
      ? ` Also, the report mentions this location: "${address}". Based on your knowledge of Dhaka, Bangladesh, estimate the approximate latitude and longitude for this location. Return them as 'lat' (number) and 'lng' (number). If you cannot determine the location, return null for both.`
      : '';

    const fullPrompt = prompt + addressPrompt;

    const contents = [
      fullPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
    });

    const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = resultText.replace(/```(json)?/g, '').trim();
    const resultJson = JSON.parse(cleaned);

    return resultJson;
  } catch (error) {
    console.error('Gemini Service Error:', error);
    throw error;
  }
};
