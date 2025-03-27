import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/configs/mongodb';
import Workspace from '@/models/Workspace';

export async function PUT(req) {
  try {
    const { workspaceId, messages } = await req.json();
    
    await connectToDatabase();
    
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { messages },
      { new: true }
    );
    
    if (!updatedWorkspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json(
      { error: 'Failed to update messages' },
      { status: 500 }
    );
  }
}