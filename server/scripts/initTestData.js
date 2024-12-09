require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://ynsocial:Graf2021@cluster0.wb86x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function initTestData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully!');

        // Define schemas
        const userSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, enum: ['admin', 'company', 'ambassador'], required: true },
            status: { type: String, enum: ['active', 'inactive'], default: 'active' }
        });

        const companySchema = new mongoose.Schema({
            name: { type: String, required: true },
            description: String,
            status: { type: String, enum: ['active', 'inactive'], default: 'active' },
            verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
        });

        const ambassadorSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            status: { type: String, enum: ['active', 'inactive'], default: 'active' },
            skills: [String],
            languages: [String]
        });

        // Create models
        const User = mongoose.models.User || mongoose.model('User', userSchema);
        const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
        const Ambassador = mongoose.models.Ambassador || mongoose.model('Ambassador', ambassadorSchema);

        // Create test admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await User.findOneAndUpdate(
            { email: 'admin@example.com' },
            {
                email: 'admin@example.com',
                password: adminPassword,
                role: 'admin',
                status: 'active'
            },
            { upsert: true }
        );
        console.log('Admin user created/updated');

        // Create test company user and company
        const companyPassword = await bcrypt.hash('company123', 10);
        await User.findOneAndUpdate(
            { email: 'company@example.com' },
            {
                email: 'company@example.com',
                password: companyPassword,
                role: 'company',
                status: 'active'
            },
            { upsert: true }
        );
        
        await Company.findOneAndUpdate(
            { name: 'Test Company' },
            {
                name: 'Test Company',
                description: 'A company for testing purposes',
                status: 'active',
                verificationStatus: 'verified'
            },
            { upsert: true }
        );
        console.log('Company user and company created/updated');

        // Create test ambassador user and profile
        const ambassadorPassword = await bcrypt.hash('ambassador123', 10);
        await User.findOneAndUpdate(
            { email: 'ambassador@example.com' },
            {
                email: 'ambassador@example.com',
                password: ambassadorPassword,
                role: 'ambassador',
                status: 'active'
            },
            { upsert: true }
        );

        await Ambassador.findOneAndUpdate(
            { email: 'ambassador@example.com' },
            {
                email: 'ambassador@example.com',
                status: 'active',
                skills: ['Translation', 'Cultural Guidance', 'Medical Interpretation'],
                languages: ['English', 'Spanish', 'French']
            },
            { upsert: true }
        );
        console.log('Ambassador user and profile created/updated');

        console.log('\nTest data initialization completed successfully!');
        console.log('\nTest Credentials:');
        console.log('Admin - email: admin@example.com, password: admin123');
        console.log('Company - email: company@example.com, password: company123');
        console.log('Ambassador - email: ambassador@example.com, password: ambassador123');

    } catch (error) {
        console.error('Error initializing test data:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

initTestData();
