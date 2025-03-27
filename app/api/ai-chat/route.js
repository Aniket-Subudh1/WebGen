
import { NextResponse } from "next/server";
import OpenAIService from "@/configs/openai";
import { connectToDatabase } from "@/configs/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { prompt, userId } = await req.json();
    
    if (!prompt || !userId) {
      return NextResponse.json(
        { error: "Invalid request format. Prompt and userId are required." },
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
    
    // Create a basic message from the prompt
    const message = { role: 'user', content: prompt };
    
    // Use the OpenAI service to generate a response
    const response = await OpenAIService.generateChatResponse([message]);
    
    // Estimate token usage
    const promptTokens = prompt.length / 4;
    const responseTokens = response.length / 4;
    const totalTokens = Math.ceil(promptTokens + responseTokens);
    
    // Update user's token count
    const newTokenAmount = Math.max(0, user.token - totalTokens);
    await User.findByIdAndUpdate(userId, { token: newTokenAmount });
    
    // Return the response along with token usage info
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