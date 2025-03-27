import { connectToDatabase } from "@/configs/mongodb";
import UIComponent from "@/models/UIComponent";
import fs from "fs/promises";
import path from "path";

/**
 * Get training data from all UI components in the database
 * This is used to provide context to the AI when generating code
 * @param {Object} options - Options for fetching training data
 * @returns {Promise<String>} - Formatted training data as string
 */
export async function getComponentsTrainingData(options = {}) {
  try {
    const { category, limit = 20, framework = 'react' } = options;
    
    await connectToDatabase();
    
    // Build query
    const query = { framework };
    if (category) {
      query.category = category;
    }
    
    // Get most used components first
    const components = await UIComponent.find(query)
      .sort({ usageCount: -1, rating: -1 })
      .limit(limit);
    
    if (!components || components.length === 0) {
      return null;
    }
    
    // Format components as training data
    return components.map(comp => `
Component Name: ${comp.name}
Category: ${comp.category}
Description: ${comp.description}
Tags: ${comp.tags.join(', ')}
Code:
\`\`\`jsx
${comp.code}
\`\`\`
---
`).join("\n");
  } catch (error) {
    console.error("Error getting components training data:", error);
    return null;
  }
}

/**
 * Get training data from file system
 * This is used as a fallback if database is unavailable
 * @param {Object} options - Options for fetching training data
 * @returns {Promise<String>} - Formatted training data as string
 */
export async function getComponentsTrainingDataFromFiles(options = {}) {
  try {
    const { category, limit = 20 } = options;
    
    // Get all component files
    const dataDir = path.join(process.cwd(), "data", "training", "ui-components");
    
    // Check if directory exists, create if not
    try {
      await fs.access(dataDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(dataDir, { recursive: true });
      // Return empty since there are no files yet
      return null;
    }
    
    let files = await fs.readdir(dataDir);
    
    if (files.length === 0) {
      return null;
    }
    
    // Filter by category if specified and read file contents
    const componentsData = [];
    
    // Process files and filter by category if needed
    for (const file of files.slice(0, limit)) {
      try {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const componentData = JSON.parse(content);
        
        // Filter by category if specified
        if (!category || componentData.category === category) {
          componentsData.push(componentData);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        // Continue with other files even if one fails
      }
    }
    
    if (componentsData.length === 0) {
      return null;
    }
    
    // Format components as training data
    return componentsData.map(comp => `
Component Name: ${comp.name}
Category: ${comp.category || 'general'}
Description: ${comp.description}
Tags: ${(comp.tags || []).join(', ')}
Code:
\`\`\`jsx
${comp.code}
\`\`\`
---
`).join("\n");
  } catch (error) {
    console.error("Error getting components training data from files:", error);
    return null;
  }
}

/**
 * Train the system with a new UI component
 * This involves adding it to both the database and file system
 * @param {Object} component - The component data
 * @param {String} userId - ID of the user adding the component
 * @returns {Promise<Object>} - Result of the training
 */
export async function trainWithComponent(component, userId) {
  try {
    // Validate component data
    const { name, description, code, category, tags } = component;
    
    if (!name || !description || !code) {
      throw new Error("Component requires name, description, and code.");
    }
    
    // Connect to database
    await connectToDatabase();
    
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
    const dataDir = path.join(process.cwd(), "data", "training", "ui-components");
    
    // Create directory if it doesn't exist
    await fs.mkdir(dataDir, { recursive: true });
    
    const filename = `${name.toLowerCase().replace(/\s+/g, "-")}.json`;
    await fs.writeFile(
      path.join(dataDir, filename), 
      JSON.stringify(component, null, 2)
    );
    
    return {
      success: true,
      message: "Component added successfully",
      componentId: newComponent._id
    };
  } catch (error) {
    console.error("Error training with component:", error);
    throw error;
  }
}