import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);


const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro-exp-03-25',  
});

const chatConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const codeConfig = {
  temperature: 0.2,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};

export const chatSession = model.startChat({
  generationConfig: chatConfig,
  history: [],
});

const codeSystemPrompt = `
You are an expert React developer. Generate a project based on the user's request.
Create multiple components, organizing them in separate folders with filenames using the .js extension.
Use Tailwind CSS for styling, and only use the lucide-react library for icons when necessary.

Return your response in this exact JSON format:
{
  "projectTitle": "",
  "explanation": "",
  "files": {
    "/App.js": {
      "code": ""
    },
    ...more files
  },
  "generatedFiles": []
}

Make sure each file has valid, complete code. The "generatedFiles" array should list all filenames.
`;

// Code generation session with system prompt
export const GenAiCode = model.startChat({
  generationConfig: codeConfig,
  history: [
    {
      role: "user",
      parts: [{ text: codeSystemPrompt }],
    },
    {
      role: "model",
      parts: [{ text: "I understand. I'll generate React projects based on user requests in the specified JSON format with components, Tailwind CSS styling, and minimal use of lucide-react icons. I'll provide complete, valid code for each file and list all filenames in the generatedFiles array." }],
    },
  ],
});