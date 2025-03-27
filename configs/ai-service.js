
import { chatSession } from "./AiModel";

const GeminiService = {

  async generateChatResponse(messages) {
    try {
   
      const lastMessage = messages[messages.length - 1];
      
      const messageContent = typeof lastMessage === 'string' 
        ? lastMessage 
        : lastMessage.content;
      
    
      const result = await chatSession.sendMessage(messageContent);
      const response = result.response.text();
      
      return response;
    } catch (error) {
      console.error("Error generating AI response:", error);
      throw error;
    }
  }
};

export default GeminiService;