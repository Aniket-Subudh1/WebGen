// configs/gemini-adapter.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import AIService from './ai-service';

// Initialize Gemini client for backward compatibility
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro-exp-03-25',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};
const CodeGenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};

// Create a session for backward compatibility
export const chatSession = {
  sendMessage: async (prompt) => {
    // Create a wrapper around the new AIService
    const response = await AIService.generateChatResponse([
      { role: 'user', content: prompt }
    ]);
    
    // Return in the format expected by the old code
    return {
      response: {
        text: () => response
      }
    };
  }
};

// Create a code generation session for backward compatibility
export const GenAiCode = {
  sendMessage: async (prompt) => {
    try {
      // Use the new AIService to generate code
      const jsonResponse = await AIService.generateCode(prompt);
      
      // Format the response as expected by the old code
      return {
        response: {
          text: () => JSON.stringify(jsonResponse)
        }
      };
    } catch (error) {
      console.error('Error in GenAiCode:', error);
      throw error;
    }
  }
};

// For backward compatibility with existing code
export default {
  chatSession,
  GenAiCode
};