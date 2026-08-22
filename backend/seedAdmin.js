const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

// Load env variables
dotenv.config();

const createAdmin = async () => {
    try {
        // Database se connect karna
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database connected for seeding...');

        // Check karna ke kya koi owner pehle se database mein hai
        const existingOwner = await User.findOne({ role: 'owner' });
        
        if (existingOwner) {
            console.log('⚠️ Owner account pehle se majood hai! (User ID: ' + existingOwner.userId + ')');
            process.exit();
        }

        // Naya Owner Create Karna
        const adminUser = new User({
            name: 'Oxege Admin',
            userId: 'admin',          // Ye login username hoga
            password: 'adminpassword123', // Ye default password hai
            mobile: '03001234567',
            role: 'owner',
            status: 'active'
        });

        await adminUser.save();
        console.log('🎉 Super! Owner account successfully ban gaya hai!');
        console.log('-----------------------------------');
        console.log('➡️ User ID: admin');
        console.log('➡️ Password: adminpassword123');
        console.log('-----------------------------------');
        
        process.exit();
    } catch (error) {
        console.error('❌ Error in seeding:', error);
        process.exit(1);
    }
};

createAdmin();