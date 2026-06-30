import mongoose from 'mongoose';

/**
 * connectDB — establishes the Mongoose connection to MongoDB.
 * Logs success with host name or exits the process on failure.
 */
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('>>> FATAL: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }
  try {
   const conn = await mongoose.connect(process.env.MONGODB_URI, {
  family: 4
});
    console.log(`>>> MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('>>> MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;
