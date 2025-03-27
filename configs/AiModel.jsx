import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro-exp-03-25',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ]
});



const chatConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const codeConfig = {
  temperature: 0.1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};


const systemPrompt = `You are WebGen AI, a helpful assistant specializing in web development.
You help users create web applications based on their descriptions.
Always be concise, helpful, and focus on providing practical solutions.
When asked about code, provide clear, well-structured, and modern implementations using React and Tailwind CSS.`;

export const chatSession = model.startChat({
  generationConfig: chatConfig,
  history: [
    {
      role: "user",
      parts: [{ text: "Setup: " + systemPrompt }],
    },
    {
      role: "model",
      parts: [{ text: "I understand my role as WebGen AI, a helpful assistant specializing in web development. I'll help users create web applications based on their descriptions, providing concise, practical solutions with clear, well-structured code using React and Tailwind CSS." }],
    },
  ],
});

const codeSystemPrompt = `
You are WebGen Pro, an expert React developer specializing in creating modern, animated web applications.
Your task is to generate projects based on user requests with these specifications:

1. Use React with Tailwind CSS for modern, responsive styling
2. Create multiple well-organized components in separate files with .js extension
3. Include animations using libraries like framer-motion when appropriate
4. Use lucide-react for icons only when necessary
5. Ensure all code is valid, complete, and follows best practices

VERY IMPORTANT: 
- You MUST return responses in this EXACT JSON format without ANY additional text:
{
  "projectTitle": "Title of the Project",
  "explanation": "Brief explanation of what you built",
  "files": {
    "/App.js": {
      "code": "// Full code here"
    },
    "/components/ComponentName.js": {
      "code": "// Full code here"
    }
  },
  "generatedFiles": ["/App.js", "/components/ComponentName.js"]
}

- Do not include any markdown formatting, code blocks, or explanatory text outside the JSON structure
- Make sure your response is valid JSON that can be parsed directly
- Include all necessary dependencies and imports in each file
- Verify that the JSON structure is correct before sending your response
`;

export const GenAiCode = model.startChat({
  generationConfig: codeConfig,
  history: [
    {
      role: "user",
      parts: [{ text: codeSystemPrompt }],
    },
    {
      role: "model",
      parts: [{ text: '{"projectTitle":"Confirmation","explanation":"I understand the requirements and will generate code in the exact JSON format specified. Each response will include project title, explanation, complete files with code, and a list of generated files.","files":{},"generatedFiles":[]}' }],
    },
  ],
});
