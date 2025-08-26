// Image Upload Middleware for Sokogo Backend
// Supports both local storage and cloud storage (Cloudinary)

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local storage
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `item-${uniqueSuffix}${extension}`);
    }
});

// Configure multer for memory storage (for cloud upload)
const memoryStorage = multer.memoryStorage();

// File filter for images only
const imageFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Upload configuration
const uploadConfig = {
    storage: process.env.USE_CLOUD_STORAGE === 'true' ? memoryStorage : localStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files
    }
};

// Create upload middleware
const upload = multer(uploadConfig);

// Single image upload
const uploadSingle = upload.single('image');

// Multiple images upload
const uploadMultiple = upload.array('images', 10);

// Upload error handler
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB per file.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 10 files allowed.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name for file upload.'
            });
        }
    }
    
    if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({
            success: false,
            message: 'Only image files (jpg, jpeg, png, gif, webp) are allowed.'
        });
    }
    
    next(err);
};

// Cloudinary configuration (if using cloud storage)
let cloudinary = null;
if (process.env.USE_CLOUD_STORAGE === 'true') {
    try {
        cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    } catch (error) {
        console.warn('⚠️ Cloudinary not configured. Using local storage.');
    }
}

// Upload to cloudinary
const uploadToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
        if (!cloudinary) {
            reject(new Error('Cloudinary not configured'));
            return;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'sokogo-items',
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 600, crop: 'limit' },
                    { quality: 'auto' },
                    { format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );

        uploadStream.end(file.buffer);
    });
};

// Process uploaded images
const processImages = async (files) => {
    if (!files || files.length === 0) {
        return [];
    }

    const imageUrls = [];

    for (const file of files) {
        try {
            if (process.env.USE_CLOUD_STORAGE === 'true' && cloudinary) {
                // Upload to Cloudinary
                const url = await uploadToCloudinary(file);
                imageUrls.push(url);
            } else {
                // Use local file path
                const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
                imageUrls.push(`${baseUrl}/uploads/${file.filename}`);
            }
        } catch (error) {
            console.error('Error processing image:', error);
            // Continue with other images even if one fails
        }
    }

    return imageUrls;
};

// Middleware to serve uploaded files
const serveUploads = (req, res, next) => {
    if (req.path.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), req.path);
        
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        } else {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }
    }
    next();
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    handleUploadError,
    processImages,
    serveUploads
};
