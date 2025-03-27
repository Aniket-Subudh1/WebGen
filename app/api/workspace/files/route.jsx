import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/configs/mongodb';
import Workspace from '@/models/Workspace';

export async function PUT(req) {
  try {
    const { workspaceId, files } = await req.json();
    
    await connectToDatabase();
    
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { fileData: files },
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
    console.error('Error updating files:', error);
    return NextResponse.json(
      { error: 'Failed to update files' },
      { status: 500 }
    );
  }
}