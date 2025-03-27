import { NextResponse } from "next/server";
import OpenAIService from "@/configs/openai";
import { connectToDatabase } from "@/configs/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();
    
    if (!messages || !Array.isArray(messages) || !userId) {
      return NextResponse.json(
        { error: "Invalid request format. Messages array and userId are required." },
        { status: 400 }
      );
    }
    

    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (user.token < 10) {
      return NextResponse.json(
        { error: "Insufficient tokens", tokenCount: user.token },
        { status: 403 }
      );
    }
    

    const systemMessage = {
      role: "system",
      content: `You are an expert web development assistant. Help users create great websites and apps.
      Keep responses concise and focused on practical solutions.
      When discussing code, emphasize modern best practices and maintainable patterns.`
    };
    

    const formattedMessages = [
      systemMessage,
      ...messages.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : msg.role,
        content: msg.content
      }))
    ];
    
    const response = await OpenAIService.generateChatResponse(formattedMessages);
 
    const promptTokens = JSON.stringify(formattedMessages).length / 4;
    const responseTokens = response.length / 4;
    const totalTokens = Math.ceil(promptTokens + responseTokens);
    
    const newTokenAmount = Math.max(0, user.token - totalTokens);
    await User.findByIdAndUpdate(userId, { token: newTokenAmount });
    
    return NextResponse.json({
      result: response,
      tokenUsage: {
        prompt: Math.ceil(promptTokens),
        completion: Math.ceil(responseTokens),
        total: totalTokens
      },
      remainingTokens: newTokenAmount
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}