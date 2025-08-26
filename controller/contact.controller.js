// Contact Controller for Sokogo Backend
// Handles inquiries, contact forms, and communication between users

const { UserModel } = require("../models/usersModel");
const { ItemModel } = require("../models/itemModel");
const emailService = require("../services/emailService");
const { asyncHandler } = require("../middleware/errorHandler");

// Send inquiry about an item
const sendItemInquiry = asyncHandler(async (req, res) => {
    const { itemId, message } = req.body;
    const buyerId = req.userId;

    // Validation
    if (!itemId || !message) {
        return res.status(400).json({
            success: false,
            message: "Item ID and message are required"
        });
    }

    if (message.trim().length < 10) {
        return res.status(400).json({
            success: false,
            message: "Message must be at least 10 characters long"
        });
    }

    // Get buyer info
    const buyer = await UserModel.findById(buyerId);
    if (!buyer) {
        return res.status(404).json({
            success: false,
            message: "Buyer not found"
        });
    }

    // Get item and seller info
    const item = await ItemModel.findById(itemId).populate('seller');
    if (!item) {
        return res.status(404).json({
            success: false,
            message: "Item not found"
        });
    }

    if (item.seller._id.toString() === buyerId) {
        return res.status(400).json({
            success: false,
            message: "You cannot inquire about your own item"
        });
    }

    // Send email to seller
    try {
        const emailResult = await emailService.sendContactInquiry(
            buyer,
            item.seller,
            item,
            message.trim()
        );

        if (emailResult.success) {
            res.status(200).json({
                success: true,
                message: "Inquiry sent successfully",
                data: {
                    itemTitle: item.title,
                    sellerName: `${item.seller.firstName} ${item.seller.lastName}`,
                    messageSent: true
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to send inquiry email",
                error: emailResult.error
            });
        }
    } catch (error) {
        console.error("Error sending inquiry:", error);
        res.status(500).json({
            success: false,
            message: "Error sending inquiry"
        });
    }
});

// General contact form
const sendContactMessage = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        });
    }

    try {
        // Send email to admin/support
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Contact Details:</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                </div>
                
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Message:</h3>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                
                <p><em>This message was sent through the Sokogo Classifieds contact form.</em></p>
            </div>
        `;

        const emailResult = await emailService.sendEmail(
            adminEmail,
            `Contact Form: ${subject}`,
            html
        );

        if (emailResult.success) {
            res.status(200).json({
                success: true,
                message: "Message sent successfully. We'll get back to you soon!"
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to send message. Please try again later."
            });
        }
    } catch (error) {
        console.error("Error sending contact message:", error);
        res.status(500).json({
            success: false,
            message: "Error sending message"
        });
    }
});

// Test email configuration
const testEmail = asyncHandler(async (req, res) => {
    const result = await emailService.testEmailConfig();
    
    res.status(result.success ? 200 : 500).json({
        success: result.success,
        message: result.success ? 'Email service is working' : 'Email service configuration error',
        error: result.error
    });
});

module.exports = {
    sendItemInquiry,
    sendContactMessage,
    testEmail
};
