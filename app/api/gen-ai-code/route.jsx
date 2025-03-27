import { GenAiCode } from "@/configs/AiModel";
import { NextResponse } from "next/server";
import Prompt from "@/data/Prompt";

export async function POST(req) {
    try {
        const { prompt } = await req.json();
        
        // Create a more specific prompt by combining user input with predefined instructions
        const enhancedPrompt = `${prompt}\n\n${Prompt.CODE_GEN_PROMPT}`;
        
        // Send the request to the AI model
        const result = await GenAiCode.sendMessage(enhancedPrompt);
        const responseText = result.response.text();
        
        // Handle the response - extract JSON if in markdown format
        let parsedResponse;
        try {
            // Try to parse directly first
            parsedResponse = JSON.parse(responseText);
        } catch (error) {
            // If direct parsing fails, try to extract JSON from markdown code blocks
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    parsedResponse = JSON.parse(jsonMatch[1].trim());
                } catch (jsonError) {
                    console.error("Failed to parse extracted JSON:", jsonError);
                    throw new Error("Invalid response format from AI model");
                }
            } else {
                console.error("Failed to parse response:", error);
                throw new Error("Could not parse AI model response");
            }
        }
        
        return NextResponse.json(parsedResponse);
    } catch (error) {
        console.error("Error in gen-ai-code:", error);
        return NextResponse.json(
            { error: "Failed to generate code" },
            { status: 500 }
        );
    }
}