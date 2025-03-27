// app/api/workspace/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/configs/mongodb';
import Workspace from '@/models/Workspace';
import User from '@/models/User';

/**
 * Get a workspace by ID
 */
export async function GET(req, { params }) {
  // Correctly access params from the second argument
  const { id } = params;
  
  try {
    await connectToDatabase();
    const workspace = await Workspace.findById(id);
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

/**
 * Update a workspace by ID
 */
export async function PUT(req, { params }) {
  // Correctly access params from the second argument
  const { id } = params;
  const updateData = await req.json();
  
  // Validate the update data
  if (!updateData) {
    return NextResponse.json(
      { error: 'No update data provided' },
      { status: 400 }
    );
  }
  
  try {
    await connectToDatabase();
    
    // Find the workspace first to verify it exists
    const workspace = await Workspace.findById(id);
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    // Update only allowed fields
    const allowedFields = ['messages', 'fileData'];
    const filteredUpdate = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});
    
    // Add updatedAt timestamp
    filteredUpdate.updatedAt = new Date();
    
    // Perform the update
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      id,
      filteredUpdate,
      { new: true }
    );
    
    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

/**
 * Delete a workspace by ID
 */
export async function DELETE(req, { params }) {
  // Correctly access params from the second argument
  const { id } = params;
  
  try {
    await connectToDatabase();
    
    // Find the workspace first to verify it exists and get the user ID
    const workspace = await Workspace.findById(id);
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    // Verify user authorization (from query param or JWT in a real app)
    const url = new URL(req.url);
    const requestUserId = url.searchParams.get('userId');
    
    if (requestUserId && workspace.user.toString() !== requestUserId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this workspace' },
        { status: 403 }
      );
    }
    
    // Delete the workspace
    await Workspace.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Workspace deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}