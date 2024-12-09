require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ynsocial:Graf2021@cluster0.wb86x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password in logs

        const conn = await mongoose.connect(MONGODB_URI);
        
        console.log('\nConnection successful!');
        console.log('Connected to database:', conn.connection.name);
        console.log('Host:', conn.connection.host);
        console.log('Port:', conn.connection.port);

        // Test database operations
        console.log('\nTesting database operations...');
        
        // List all collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(collection => {
            console.log('-', collection.name);
        });

        // Get counts for each collection
        console.log('\nCollection counts:');
        for (const collection of collections) {
            const count = await conn.connection.db.collection(collection.name).countDocuments();
            console.log(`- ${collection.name}: ${count} documents`);
        }

        // Test creating a document
        const testCollection = conn.connection.db.collection('test');
        await testCollection.insertOne({ 
            test: true, 
            timestamp: new Date(),
            message: 'Database connection test'
        });
        console.log('\nTest document created successfully');

        // Clean up test document
        await testCollection.deleteOne({ test: true });
        console.log('Test document cleaned up');

        console.log('\nDatabase test completed successfully!');
    } catch (error) {
        console.error('\nDatabase connection error:', error);
        console.error('\nError details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            codeName: error.codeName
        });
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

testConnection();
