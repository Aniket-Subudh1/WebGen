import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/configs/mongodb';
import Workspace from '@/models/Workspace';

export async function GET(req, { params }) {
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