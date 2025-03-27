import { NextResponse } from "next/server";
import { connectToDatabase } from "@/configs/mongodb";
import User from "@/models/User";
import UIComponent from "@/models/UIComponent";
import fs from "fs/promises";
import path from "path";

/**
 * Endpoint to add new UI components for training the system
 */
export async function POST(req) {
  try {
    const { userId, component } = await req.json();
    
    if (!userId || !component) {
      return NextResponse.json(
        { error: "Invalid request. userId and component data are required." },
        { status: 400 }
      );
    }
    
    // Validate component data
    const { name, description, code, category, tags } = component;
    
    if (!name || !description || !code) {
      return NextResponse.json(
        { error: "Component requires name, description, and code." },
        { status: 400 }
      );
    }
    
    // Connect to database and verify user
    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Create new component in database
    const newComponent = new UIComponent({
      name,
      description,
      code,
      category: category || "general",
      tags: tags || [],
      createdBy: userId
    });
    
    await newComponent.save();
    
    // Also save to file system for redundancy
    try {
      const dataDir = path.join(process.cwd(), "data", "training", "ui-components");
      await fs.mkdir(dataDir, { recursive: true });
      
      const filename = `${name.toLowerCase().replace(/\s+/g, "-")}.json`;
      await fs.writeFile(
        path.join(dataDir, filename), 
        JSON.stringify(component, null, 2)
      );
    } catch (fsError) {
      console.warn("Failed to save component to file system:", fsError);
      // Continue even if file system save fails
    }
    
    return NextResponse.json({
      success: true,
      message: "Component added successfully",
      componentId: newComponent._id
    });
  } catch (error) {
    console.error("Error adding UI component:", error);
    return NextResponse.json(
      { error: "Failed to add UI component" },
      { status: 500 }
    );
  }
}

/**
 * Get all UI components, with optional filtering
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const userId = searchParams.get("userId");
    
    // Connect to database
    await connectToDatabase();
    
    // Build query
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (tag) {
      query.tags = tag;
    }
    
    if (userId) {
      query.createdBy = userId;
    }
    
    // Get components
    const components = await UIComponent.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    
    return NextResponse.json(components);
  } catch (error) {
    console.error("Error fetching UI components:", error);
    return NextResponse.json(
      { error: "Failed to fetch UI components" },
      { status: 500 }
    );
  }
}