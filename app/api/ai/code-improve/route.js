import { NextResponse } from "next/server";
import OpenAIService from "@/configs/openai";
import { connectToDatabase } from "@/configs/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { originalCode, feedback, userId } = await req.json();
    
    if (!originalCode || !feedback || !userId) {
      return NextResponse.json(
        { error: "Invalid request. Original code, feedback, and userId are required." },
        { status: 400 }
      );
    }
    
    // Connect to database and verify user has sufficient tokens
    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (user.token < 50) { 
      return NextResponse.json(
        { error: "Insufficient tokens", tokenCount: user.token },
        { status: 403 }
      );
    }
    
    // Improve the code
    const improvedCode = await OpenAIService.improveCode(originalCode, feedback);
    
    // Clean up the response - extract just the code if it's wrapped in markdown
    let cleanedCode = improvedCode;
    
    // If response has markdown code blocks, extract just the code
    const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
    const match = improvedCode.match(codeBlockRegex);
    if (match && match[1]) {
      cleanedCode = match[1].trim();
    }
    
    // Estimate token usage (simple estimation)
    const promptTokens = (originalCode.length + feedback.length) / 4;
    const responseTokens = improvedCode.length / 4;
    const totalTokens = Math.ceil(promptTokens + responseTokens);
    
    // Update user's token count
    const newTokenAmount = Math.max(0, user.token - totalTokens);
    await User.findByIdAndUpdate(userId, { token: newTokenAmount });
    
    return NextResponse.json({
      improvedCode: cleanedCode,
      explanation: improvedCode.replace(codeBlockRegex, '').trim(), // Any explanation outside the code block
      tokenUsage: {
        prompt: Math.ceil(promptTokens),
        completion: Math.ceil(responseTokens),
        total: totalTokens
      },
      remainingTokens: newTokenAmount
    });
  } catch (error) {
    console.error("Error in code improvement:", error);
    return NextResponse.json(
      { error: "Failed to improve code" },
      { status: 500 }
    );
  }
}