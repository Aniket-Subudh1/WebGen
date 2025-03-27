import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/configs/mongodb';
import Workspace from '@/models/Workspace';

export async function GET(_, { params }) {
  try {

    const { id } = await params;
    
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
export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    
    await connectToDatabase();
    await connectToDatabase();
    
    const result = await Workspace.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}