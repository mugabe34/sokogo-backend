const express = require("express");
const { authenticate } = require("../middleware/authentication");
const {
    sendItemInquiry,
    sendContactMessage,
    testEmail
} = require("../controller/contact.controller");

const contactRouter = express.Router();

// Public routes
contactRouter.post("/contact", sendContactMessage);
contactRouter.get("/test-email", testEmail);

// Protected routes (authentication required)
contactRouter.use(authenticate);
contactRouter.post("/inquiry", sendItemInquiry);

module.exports = { contactRouter };
