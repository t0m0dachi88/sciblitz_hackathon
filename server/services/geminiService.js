import { analyzeImage } from './hfService.js';

export const analyzeImageWithGemini = async (imagePath, mimeType, address = '') => {
  try {
    return await analyzeImage(imagePath, address);
  } catch (error) {
    console.error('HF Image Analysis Error:', error);
    throw error;
  }
};
