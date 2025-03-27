/**
 * This service is a compatibility layer that redirects OpenAI calls to Gemini
 * It allows existing OpenAI-dependent code to work with Gemini
 */

import { chatSession } from "./AiModel";

const OpenAIService = {
  /**
   * Generate a chat response using Gemini
   * This maintains compatibility with code expecting OpenAI
   */
  async generateChatResponse(messages) {
    try {
      // Extract the last message content if it's an array
      const lastMessage = messages[messages.length - 1];
      const messageContent = typeof lastMessage === 'string' 
        ? lastMessage 
        : lastMessage.content;
      
      // Send the request to Gemini
      const result = await chatSession.sendMessage(messageContent);
      const response = result.response.text();
      
      return response;
    } catch (error) {
      console.error("Error generating AI response:", error);
      throw error;
    }
  }
};

export default OpenAIService;