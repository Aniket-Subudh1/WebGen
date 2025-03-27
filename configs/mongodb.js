// app/configs/mongodb.js
import mongoose from 'mongoose';

// Cache the MongoDB connection to reuse it across API routes
let cachedConnection = null;

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  // If no connection exists, create a new one
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const connection = await mongoose.connect(uri, options);
    cachedConnection = connection;
    console.log('Connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Disconnect for testing purposes (not typically used in production)
export async function disconnectFromDatabase() {
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
    cachedConnection = null;
    console.log('Disconnected from MongoDB');
  }
}