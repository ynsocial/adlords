require('dotenv').config();
const mongoose = require('mongoose');

const collections = [
  'users',
  'companies',
  'ambassadors',
  'jobs',
  'applications',
  'tasks',
  'notifications'
];

async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Create collections if they don't exist
    for (const collection of collections) {
      const exists = await db.listCollections({ name: collection }).hasNext();
      if (!exists) {
        await db.createCollection(collection);
        console.log(`Created collection: ${collection}`);
      } else {
        console.log(`Collection ${collection} already exists`);
      }
    }

    // Create initial admin user if it doesn't exist
    const adminExists = await db.collection('users').findOne({ role: 'admin' });
    if (!adminExists) {
      await db.collection('users').insertOne({
        email: 'admin@adlords.com',
        password: '$2b$10$your_hashed_password', // Remember to hash the password
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created admin user');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

initializeDatabase();
