import { NextResponse } from "next/server";
import OpenAIService from "@/configs/openai";
import { connectToDatabase } from "@/configs/mongodb";
import User from "@/models/User";
import { getComponentsTrainingData } from "@/lib/training";

export async function POST(req) {
  try {
    const { prompt, userId, options = {} } = await req.json();
    
    if (!prompt || !userId) {
      return NextResponse.json(
        { error: "Invalid request. Prompt and userId are required." },
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
    
    if (user.token < 100) { 
      return NextResponse.json(
        { error: "Insufficient tokens", tokenCount: user.token },
        { status: 403 }
      );
    }
    
    const additionalContext = [];
    
    if (options.useCustomComponents) {
      const trainingData = await getComponentsTrainingData();
      if (trainingData) {
        additionalContext.push({
          role: "system",
          content: `Use these custom UI components when appropriate:\n${trainingData}`
        });
      }
    }
  
    if (options.framework) {
      additionalContext.push({
        role: "system",
        content: `Generate code using the ${options.framework} framework.`
      });
    }
    
    if (options.libraries && Array.isArray(options.libraries)) {
      const libraries = options.libraries.join(", ");
      additionalContext.push({
        role: "system",
        content: `Include the following libraries in your solution: ${libraries}`
      });
    }
    
 
    const result = await OpenAIService.generateCode(prompt, additionalContext);
    

    const promptTokens = (prompt.length + JSON.stringify(additionalContext).length) / 4;
    const responseTokens = JSON.stringify(result).length / 4;
    const totalTokens = Math.ceil(promptTokens + responseTokens);
    

    const newTokenAmount = Math.max(0, user.token - totalTokens);
    await User.findByIdAndUpdate(userId, { token: newTokenAmount });
    
    return NextResponse.json({
      ...result,
      tokenUsage: {
        prompt: Math.ceil(promptTokens),
        completion: Math.ceil(responseTokens),
        total: totalTokens
      },
      remainingTokens: newTokenAmount
    });
  } catch (error) {
    console.error("Error in code generation:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}