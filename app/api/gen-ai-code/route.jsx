// app/api/gen-ai-code/route.jsx
import { GenAiCode } from "@/configs/AiModel";
import { NextResponse } from "next/server";
import Prompt from "@/data/Prompt";
import { connectToDatabase } from "@/configs/mongodb";
import User from "@/models/User";

export async function POST(req) {
    try {
        const { prompt, userId } = await req.json();
        
        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }
        
        // Verify user and token count
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
        
        // Create a more specific prompt by combining user input with predefined instructions
        const enhancedPrompt = `${prompt}\n\n${Prompt.CODE_GEN_PROMPT}`;
        
        // Make multiple attempts to generate code
        for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`Code generation attempt ${attempt}/3`);
            
            try {
                // Send request to Gemini API
                const result = await GenAiCode.sendMessage(enhancedPrompt);
                const responseText = result.response.text();
                
                // Try different parsing strategies
                let parsedResponse = null;
                
                // Strategy 1: Direct JSON parsing
                try {
                    parsedResponse = JSON.parse(responseText);
                    console.log("Successfully parsed response directly as JSON");
                } catch (error) {
                    console.log("Failed direct JSON parse, trying other methods");
                }
                
                // Strategy 2: Extract JSON from markdown blocks
                if (!parsedResponse) {
                    try {
                        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
                        if (jsonMatch && jsonMatch[1]) {
                            parsedResponse = JSON.parse(jsonMatch[1].trim());
                            console.log("Successfully extracted and parsed JSON from markdown");
                        }
                    } catch (error) {
                        console.log("Failed to extract JSON from markdown blocks");
                    }
                }
                
                // Strategy 3: Look for JSON with relaxed parsing
                if (!parsedResponse) {
                    try {
                        // Find anything that looks like a JSON object
                        const potentialJson = responseText.match(/\{[\s\S]*\}/);
                        if (potentialJson) {
                            const cleanedJson = potentialJson[0]
                                .replace(/```/g, '')
                                .replace(/^json/i, '')
                                .trim();
                            parsedResponse = JSON.parse(cleanedJson);
                            console.log("Successfully parsed JSON with relaxed matching");
                        }
                    } catch (error) {
                        console.log("Failed relaxed JSON parsing");
                    }
                }
                
                // Validate parsed response
                if (parsedResponse && parsedResponse.files && parsedResponse.projectTitle) {
                    console.log("Successfully validated response structure");
                    
                    // Calculate token usage
                    const promptTokens = enhancedPrompt.length / 4;
                    const responseTokens = responseText.length / 4;
                    const totalTokens = Math.ceil(promptTokens + responseTokens);
                    
                    // Update user's token count
                    const newTokenAmount = Math.max(0, user.token - totalTokens);
                    await User.findByIdAndUpdate(userId, { token: newTokenAmount });
                    
                    // Return successful response
                    return NextResponse.json({
                        ...parsedResponse,
                        tokenUsage: {
                            prompt: Math.ceil(promptTokens),
                            completion: Math.ceil(responseTokens),
                            total: totalTokens
                        },
                        remainingTokens: newTokenAmount
                    });
                } else {
                    console.log("Response validation failed, invalid structure");
                    if (attempt === 3) {
                        throw new Error("Invalid response structure after multiple attempts");
                    }
                }
            } catch (error) {
                console.error(`Error in attempt ${attempt}:`, error);
                if (attempt === 3) {
                    throw error;
                }
            }
            
            // Wait before next attempt (increasing delay)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
        
        // If we get here, all attempts failed but didn't throw - provide fallback
        console.log("All attempts failed, using fallback response");
        
        // Create basic fallback response
        const fallbackResponse = {
            projectTitle: "Basic Project Scaffold",
            explanation: `I've created a simple starting point for the ${prompt.substring(0, 40)}... project you requested. This includes a responsive layout with some basic components that you can build upon.`,
            files: {
                "/App.js": {
                    code: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ${prompt.substring(0, 20)}... Project
        </h1>
        <p className="text-gray-600 mb-6">
          This is a starter template for your project. You can customize it to fit your needs.
        </p>
        <div className="bg-blue-500 text-white py-3 px-6 rounded-lg inline-block">
          Get Started
        </div>
      </div>
    </div>
  );
}

export default App;`
                },
                "/App.css": {
                    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`
                }
            },
            generatedFiles: ["/App.js", "/App.css"]
        };
        
        // Calculate token usage for fallback
        const promptTokens = enhancedPrompt.length / 4;
        const responseTokens = JSON.stringify(fallbackResponse).length / 4;
        const totalTokens = Math.ceil(promptTokens + responseTokens);
        
        // Update user's token count for fallback
        const newTokenAmount = Math.max(0, user.token - totalTokens);
        await User.findByIdAndUpdate(userId, { token: newTokenAmount });
        
        // Return fallback response
        return NextResponse.json({
            ...fallbackResponse,
            tokenUsage: {
                prompt: Math.ceil(promptTokens),
                completion: Math.ceil(responseTokens),
                total: totalTokens
            },
            remainingTokens: newTokenAmount
        });
        
    } catch (error) {
        console.error("Error in gen-ai-code:", error);
        return NextResponse.json(
            { 
                error: "Failed to generate code",
                message: error.message
            },
            { status: 500 }
        );
    }
}