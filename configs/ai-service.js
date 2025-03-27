import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, 
});

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5',
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
    }
  }
};

/**
 * Format messages for Gemini from OpenAI-style messages
 */
function formatMessagesForGemini(messages) {
  return messages.map(msg => ({
    role: msg.role === 'assistant' || msg.role === 'ai' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));
}

// AI Service with dual support for OpenAI and Gemini
const AIService = {
  /**
   * Generate a chat response using OpenAI or Gemini
   */
  async generateChatResponse(messages, options = {}) {
    // Try OpenAI first
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : msg.role,
        content: msg.content
      }));
      
      const config = { ...configOptions.openai.chat, ...options };
      
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: formattedMessages,
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
   */
  async generateCode(prompt, additionalContext = [], options = {}) {
    // System message for code generation
    const systemPrompt = `Generate a Project in React based on this prompt: ${prompt}. 
    Create multiple components, organizing them in separate folders with filenames using the .js extension, if needed. 
    The output should use Tailwind CSS for styling, without any third-party dependencies or libraries, 
    except for icons from the lucide-react library, which should only be used when necessary. 
    
    Return the response in JSON format with the following schema:
    {
      "projectTitle": "",
      "explanation": "",
      "files": {
        "/App.js": {
          "code": ""
        },
        ...
      },
      "generatedFiles": []
    }`;
    
    // Try OpenAI first
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...additionalContext.map(ctx => ({ role: 'system', content: ctx.content })),
        { role: 'user', content: prompt }
      ];
      
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
        // For Gemini, combine the system message and prompt
        const fullPrompt = `${systemPrompt}\n\n${additionalContext.map(ctx => ctx.content).join('\n')}\n\n${prompt}`;
        
        const result = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: configOptions.gemini.codeGeneration.temperature,
            maxOutputTokens: configOptions.gemini.codeGeneration.maxOutputTokens,
          }
        });
        
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
   * Improve existing code based on user feedback
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
  }
};

export default AIService;