import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/configs/mongodb';
import Workspace from '@/models/Workspace';
import User from '@/models/User';

export async function POST(req, { params }) {
  try {
    const { user, messages } = await req.json();
    
    await connectToDatabase();
    
    const userExists = await User.findById(user);
    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const workspace = new Workspace({
      messages,
      user,
    });
    
    await workspace.save();
    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  const userId = req.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'userId parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    await connectToDatabase();
    const workspaces = await Workspace.find({ user: userId }).sort({ updatedAt: -1 });
    
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}