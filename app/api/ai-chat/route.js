import { NextResponse } from "next/server";
import GeminiService from "@/configs/ai-service";
import { connectToDatabase } from "@/configs/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();
    
    if (!messages || !userId) {
      return NextResponse.json(
        { error: "Invalid request format. Messages and userId are required." },
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
    
    // Pass the full messages array to maintain conversation context
    const response = await GeminiService.generateChatResponse(messages);
    
    // Estimate token usage - approximate since we're using Gemini
    const promptLength = JSON.stringify(messages).length;
    const responseLength = response.length;
    const totalTokens = Math.ceil((promptLength + responseLength) / 4);
    
    // Update user's token count
    const newTokenAmount = Math.max(0, user.token - totalTokens);
    await User.findByIdAndUpdate(userId, { token: newTokenAmount });
    
    // Return the response along with token usage info
    return NextResponse.json({
      result: response,
      tokenUsage: {
        prompt: Math.ceil(promptLength / 4),
        completion: Math.ceil(responseLength / 4),
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