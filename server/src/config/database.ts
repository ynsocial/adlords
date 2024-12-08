import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || '';
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes for better performance
    await Promise.all([
      conn.connection.collection('users').createIndex({ email: 1 }, { unique: true }),
      conn.connection.collection('companies').createIndex({ name: 1 }),
      conn.connection.collection('ambassadors').createIndex({ email: 1 }, { unique: true }),
      conn.connection.collection('jobs').createIndex({ status: 1, createdAt: -1 }),
      conn.connection.collection('applications').createIndex({ jobId: 1, ambassadorId: 1 }),
      conn.connection.collection('tasks').createIndex({ applicationId: 1, status: 1 }),
      conn.connection.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 })
    ]);

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
