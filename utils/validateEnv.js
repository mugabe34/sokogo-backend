// Environment Variables Validation for Sokogo Backend

const validateEnvironment = () => {
    const errors = [];
    const warnings = [];

    // Required environment variables
    const requiredVars = {
        'MONGODB_URL': process.env.MONGODB_URL,
        'PORT': process.env.PORT,
        'JWT_SECRET': process.env.JWT_SECRET
    };

    // Optional but recommended environment variables
    const optionalVars = {
        'NODE_ENV': process.env.NODE_ENV,
        'FRONTEND_URL': process.env.FRONTEND_URL
    };

    // Check required variables
    Object.entries(requiredVars).forEach(([key, value]) => {
        if (!value) {
            errors.push(`❌ Missing required environment variable: ${key}`);
        } else {
            // Validate specific formats
            switch (key) {
                case 'MONGODB_URL':
                    if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
                        errors.push(`❌ Invalid MONGODB_URL format. Must start with mongodb:// or mongodb+srv://`);
                    }
                    break;
                case 'PORT':
                    const port = parseInt(value);
                    if (isNaN(port) || port < 1 || port > 65535) {
                        errors.push(`❌ Invalid PORT. Must be a number between 1 and 65535`);
                    }
                    break;
                case 'JWT_SECRET':
                    if (value.length < 32) {
                        warnings.push(`⚠️  JWT_SECRET should be at least 32 characters long for security`);
                    }
                    break;
            }
        }
    });

    // Check optional variables
    Object.entries(optionalVars).forEach(([key, value]) => {
        if (!value) {
            warnings.push(`⚠️  Optional environment variable not set: ${key}`);
        } else {
            // Validate specific formats
            switch (key) {
                case 'NODE_ENV':
                    const validEnvs = ['development', 'production', 'test'];
                    if (!validEnvs.includes(value)) {
                        warnings.push(`⚠️  NODE_ENV should be one of: ${validEnvs.join(', ')}`);
                    }
                    break;
                case 'FRONTEND_URL':
                    if (!value.startsWith('http://') && !value.startsWith('https://')) {
                        warnings.push(`⚠️  FRONTEND_URL should start with http:// or https://`);
                    }
                    break;
            }
        }
    });

    // Display results
    if (errors.length > 0) {
        console.error('\n🚨 ENVIRONMENT VALIDATION ERRORS:');
        errors.forEach(error => console.error(error));
        console.error('\n💡 Please check your .env file and fix the above errors before starting the server.\n');
        return false;
    }

    if (warnings.length > 0) {
        console.warn('\n⚠️  ENVIRONMENT VALIDATION WARNINGS:');
        warnings.forEach(warning => console.warn(warning));
        console.warn('\n💡 These are not critical but recommended for production.\n');
    }

    if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ All environment variables are properly configured!\n');
    }

    return true;
};

// Create .env.example if it doesn't exist
const createEnvExample = () => {
    const fs = require('fs');
    const path = require('path');
    
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    if (!fs.existsSync(envExamplePath)) {
        const envExample = `# Sokogo Backend Environment Variables

# Database Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/sokogo

# Server Configuration
PORT=8000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# CORS Configuration
FRONTEND_URL=http://localhost:3002

# Optional: File Upload (if using Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Optional: Email Service (if using SendGrid/Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
`;

        fs.writeFileSync(envExamplePath, envExample);
        console.log('📝 Created .env.example file with template configuration');
    }
};

// Display environment info
const displayEnvInfo = () => {
    console.log('\n📋 CURRENT ENVIRONMENT CONFIGURATION:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`   PORT: ${process.env.PORT || 'not set'}`);
    console.log(`   MONGODB_URL: ${process.env.MONGODB_URL ? '✅ configured' : '❌ not set'}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ configured' : '❌ not set'}`);
    console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}`);
    console.log('');
};

module.exports = {
    validateEnvironment,
    createEnvExample,
    displayEnvInfo
};
