const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection with proper error handling and options
const connectDB = async () => {
    try {
        // Validate MongoDB URL
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL environment variable is not defined");
        }

        // Connection options for better reliability
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferMaxEntries: 0, // Disable mongoose buffering
            bufferCommands: false, // Disable mongoose buffering
        };

        const connection = await mongoose.connect(process.env.MONGODB_URL, options);

        console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
        return connection;

    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);

        // Provide helpful error messages
        if (error.message.includes("ENOTFOUND")) {
            console.error("🔧 Check your internet connection and MongoDB URL");
        } else if (error.message.includes("authentication failed")) {
            console.error("🔧 Check your MongoDB username and password");
        } else if (error.message.includes("MONGODB_URL")) {
            console.error("🔧 Make sure MONGODB_URL is set in your .env file");
        }

        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('📡 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('📡 MongoDB connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during MongoDB disconnection:', error);
        process.exit(1);
    }
});

const connection = connectDB();

module.exports = { connection };
