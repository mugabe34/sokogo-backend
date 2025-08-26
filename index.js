const express = require("express")
const app = express()
require("dotenv").config()

// Validate environment variables before starting
const { validateEnvironment, displayEnvInfo } = require("./utils/validateEnv")
if (!validateEnvironment()) {
    process.exit(1);
}

const { connection } = require("./config/db")

const { userRouter } = require("./routes/userRoutes")
const { itemRouter } = require("./routes/itemRoutes")
const { errorHandler, notFound } = require("./middleware/errorHandler")
const cors = require("cors")

app.use(express.json())
// CORS configuration for development and production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            // Development URLs
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
            // Production frontend URL from environment variable
            process.env.FRONTEND_URL
        ].filter(Boolean);

        // Check if origin is allowed or if it's a Vercel deployment
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "userid", "user-id"]
};

app.use(cors(corsOptions))

app.get("/", (req, res) => {
    res.send("WELCOME TO SOKOGO CLASSIFIEDS BACKEND API")
})

// User authentication routes
app.use("/api/auth", userRouter)

// Item/classifieds routes
app.use("/api/items", itemRouter)

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Sokogo Backend is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API info endpoint
app.get("/api", (req, res) => {
    res.status(200).json({
        name: "Sokogo Classifieds API",
        version: "1.0.0",
        description: "Backend API for SOKOGO Classifieds Platform",
        endpoints: {
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login"
            },
            items: {
                getAll: "GET /api/items",
                create: "POST /api/items",
                getById: "GET /api/items/:id",
                update: "PUT /api/items/:id",
                delete: "DELETE /api/items/:id"
            },
            health: "GET /health"
        }
    });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server with proper error handling
const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
    try {
        await connection;
        console.log("✅ Connected to MongoDB successfully");
        displayEnvInfo();
        console.log(`🚀 SOKOGO Backend Server is running on port ${PORT}`);
        console.log(`📍 Server URL: http://localhost:${PORT}`);
        console.log(`📋 API Documentation: http://localhost:${PORT}/api`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
        console.log(`🔒 CORS configured for frontend: ${process.env.FRONTEND_URL || 'localhost:3000-3002'}`);
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        console.error("🔧 Please check your MongoDB connection string");
        process.exit(1);
    }
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error(`💡 Try using a different port or stop the existing process`);
        console.error(`💡 You can kill the process using: npx kill-port ${PORT}`);
    } else {
        console.error('❌ Server failed to start:', err.message);
    }
    process.exit(1);
});
