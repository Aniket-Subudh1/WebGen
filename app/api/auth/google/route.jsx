import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/configs/mongodb';
import User from '@/app/models/User';

export async function POST(req) {
  try {
    const { name, email, picture, uid } = await req.json();
    
    await connectToDatabase();
    

    let user = await User.findOne({ email });
    
    if (!user) {
    
      user = new User({
        name,
        email,
        picture,
        uid,
        token: 50000, 
      });
      await user.save();
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in Google Auth:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}