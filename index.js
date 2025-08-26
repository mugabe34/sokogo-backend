const express = require("express")
const app = express()
require("dotenv").config()
const { connection } = require("./config/db")

const { userRouter } = require("./routes/userRoutes")
const { itemRouter } = require("./routes/itemRoutes")
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

app.listen(process.env.PORT || process.env.port, async () => {
    try {
        await connection;
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log(error)
        console.log("Something went wrong")
    }
    console.log(`SOKOGO Backend Server is running on port ${process.env.PORT || process.env.port}`)
})
