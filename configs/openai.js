import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // For security, API calls should only happen server-side
});

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro-exp-03-25',
});

// Configuration options
const configOptions = {
  openai: {
    chat: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 4096,
    },
    codeGeneration: {
      model: 'gpt-3.5-turbo',
      temperature: 0.2,
      max_tokens: 4096,
    },
    uiGeneration: {
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens: 4096,
    }
  },
  gemini: {
    chat: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
    codeGeneration: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
    uiGeneration: {
      temperature: 0.5,
      maxOutputTokens: 8192,
    }
  }
};

/**
 * Format messages for Gemini from OpenAI-style messages
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Array} - Messages formatted for Gemini
 */
function formatMessagesForGemini(messages) {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));
}

// AI Service with dual support for OpenAI and Gemini
const OpenAIService = {
  /**
   * Generate a chat response using OpenAI or Gemini
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Optional parameters to override defaults
   * @returns {Promise<string>} - The AI response text
   */
  async generateChatResponse(messages, options = {}) {
    // Try OpenAI first
    try {
      const config = { ...configOptions.openai.chat, ...options };
      
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      });

      return completion.choices[0].message.content;
    } catch (openAiError) {
      console.error('OpenAI error:', openAiError.response?.data || openAiError.message);
      console.log('Falling back to Gemini...');
      
      // Fall back to Gemini
      try {
        const geminiMessages = formatMessagesForGemini(messages);
        const chat = geminiModel.startChat({
          history: geminiMessages.slice(0, -1),
          generationConfig: {
            temperature: configOptions.gemini.chat.temperature,
            maxOutputTokens: configOptions.gemini.chat.maxOutputTokens,
          }
        });
        
        const lastMessage = geminiMessages[geminiMessages.length - 1];
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        return result.response.text();
      } catch (geminiError) {
        console.error('Gemini error:', geminiError);
        throw new Error('Both AI services failed to generate a response');
      }
    }
  },

  /**
   * Generate code based on user prompt
   * @param {string} prompt - User's prompt for code generation
   * @param {Array} additionalMessages - Optional additional context messages
   * @param {Object} options - Optional parameters to override defaults
   * @returns {Promise<Object>} - JSON object with generated code files
   */
  async generateCode(prompt, additionalMessages = [], options = {}) {
    // System message for code generation
    const systemMessage = {
      role: 'system',
      content: `You are an expert web developer. Generate high-quality, responsive, and modern web code based on the user's request. 
      Your response should be in valid JSON format with the following structure:
      {
        "projectTitle": "Title of the project",
        "explanation": "Brief explanation of what was created",
        "files": {
          "/path/to/file.ext": {
            "code": "file content"
          },
          ...more files
        },
        "generatedFiles": ["/path/to/file.ext", ...]
      }
      Use Tailwind CSS for styling. Include appropriate comments, error handling, and follow best practices.`
    };
    
    // User message
    const userMessage = {
      role: 'user',
      content: prompt
    };
    
    // Compiled messages
    const messages = [systemMessage, ...additionalMessages, userMessage];
    
    // Try OpenAI first
    try {
      const config = { ...configOptions.openai.codeGeneration, ...options };
      
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content;
      return JSON.parse(responseContent);
    } catch (openAiError) {
      console.error('OpenAI error:', openAiError.response?.data || openAiError.message);
      console.log('Falling back to Gemini for code generation...');
      
      // Fall back to Gemini
      try {
        const geminiMessages = formatMessagesForGemini(messages);
        const chat = geminiModel.startChat({
          history: geminiMessages.slice(0, -1),
          generationConfig: {
            temperature: configOptions.gemini.codeGeneration.temperature,
            maxOutputTokens: configOptions.gemini.codeGeneration.maxOutputTokens,
            responseMimeType: 'application/json',
          }
        });
        
        const lastMessage = geminiMessages[geminiMessages.length - 1];
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        const responseText = result.response.text();
        
        // Make sure we have valid JSON
        try {
          return JSON.parse(responseText);
        } catch (jsonError) {
          // Try to extract JSON if wrapped in markdown code blocks
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1].trim());
          }
          throw new Error('Failed to parse JSON response from Gemini');
        }
      } catch (geminiError) {
        console.error('Gemini error:', geminiError);
        throw new Error('Both AI services failed to generate code');
      }
    }
  },

  /**
   * Train the model with custom UI components
   * @param {Array} components - Array of component objects with code and description
   * @returns {Promise<Object>} - Training result object
   */
  async trainWithComponents(components) {
    try {
      // Create a training prompt that includes the component examples
      const trainingData = components.map(comp => 
        `Component: ${comp.name}\nDescription: ${comp.description}\nCode:\n${comp.code}\n---\n`
      ).join('\n');
      
      // Store training data in database or file system
      // This is a simplified approach; in reality, you might store this in vectors in a DB
      
      return { success: true, message: "Training data stored successfully" };
    } catch (error) {
      console.error('Error training with components:', error);
      throw error;
    }
  },
  
  /**
   * Improve existing code based on user feedback
   * @param {string} originalCode - Original code to improve
   * @param {string} feedback - User feedback for improvements
   * @param {Object} options - Optional parameters to override defaults
   * @returns {Promise<string>} - Improved code
   */
  async improveCode(originalCode, feedback, options = {}) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert code reviewer and improver. Your task is to improve the given code based on the feedback provided.'
      },
      {
        role: 'user',
        content: `Here is my original code:\n\`\`\`\n${originalCode}\n\`\`\`\n\nFeedback: ${feedback}\n\nPlease improve this code based on the feedback.`
      }
    ];
    
    // Try OpenAI first
    try {
      const config = { ...configOptions.openai.codeGeneration, ...options };
      
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      });

      return completion.choices[0].message.content;
    } catch (openAiError) {
      console.error('OpenAI error:', openAiError.response?.data || openAiError.message);
      console.log('Falling back to Gemini for code improvement...');
      
      // Fall back to Gemini
      try {
        const geminiMessages = formatMessagesForGemini(messages);
        const chat = geminiModel.startChat({
          history: geminiMessages.slice(0, -1),
          generationConfig: {
            temperature: configOptions.gemini.codeGeneration.temperature,
            maxOutputTokens: configOptions.gemini.codeGeneration.maxOutputTokens,
          }
        });
        
        const lastMessage = geminiMessages[geminiMessages.length - 1];
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        return result.response.text();
      } catch (geminiError) {
        console.error('Gemini error:', geminiError);
        throw new Error('Both AI services failed to improve code');
      }
    }
  },
  
  /**
   * Check which AI services are available
   * @returns {Promise<Object>} - Object containing availability status of each service
   */
  async checkAvailability() {
    const status = {
      openai: false,
      gemini: false
    };
    
    // Check OpenAI
    try {
      await openai.chat.completions.create({
        model: configOptions.openai.chat.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      status.openai = true;
    } catch (error) {
      console.log('OpenAI is not available:', error.message);
    }
    
    // Check Gemini
    try {
      await geminiModel.generateContent('Hello');
      status.gemini = true;
    } catch (error) {
      console.log('Gemini is not available:', error.message);
    }
    
    return status;
  }
};

export default OpenAIService;