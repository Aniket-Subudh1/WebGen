import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/configs/mongodb';
import User from '@/models/User';

export async function GET(req) {
  const email = req.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    await connectToDatabase();
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user session' },
      { status: 500 }
    );
  }
}