import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/configs/mongodb';
import User from '@/models/User';

export async function PUT(req) {
  try {
    const { token, userId } = await req.json();
    
    await connectToDatabase();
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { token },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user token:', error);
    return NextResponse.json(
      { error: 'Failed to update token' },
      { status: 500 }
    );
  }
}