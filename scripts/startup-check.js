// Comprehensive Startup Check for Sokogo Backend
// Run this before starting your server to catch all possible issues

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 SOKOGO BACKEND STARTUP CHECK\n');

// 1. Check Node.js version
const checkNodeVersion = () => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    console.log(`📦 Node.js Version: ${nodeVersion}`);
    
    if (majorVersion < 14) {
        console.error('❌ Node.js version 14 or higher is required');
        return false;
    } else if (majorVersion < 18) {
        console.warn('⚠️  Node.js 18+ is recommended for better performance');
    } else {
        console.log('✅ Node.js version is compatible');
    }
    return true;
};

// 2. Check required files
const checkRequiredFiles = () => {
    const requiredFiles = [
        'package.json',
        'index.js',
        '.env',
        'config/db.js',
        'models/usersModel.js',
        'models/itemModel.js',
        'routes/userRoutes.js',
        'routes/itemRoutes.js',
        'controller/users.controller.js',
        'controller/item.controller.js'
    ];

    console.log('\n📁 Checking required files...');
    let allFilesExist = true;

    requiredFiles.forEach(file => {
        if (fs.existsSync(path.join(process.cwd(), file))) {
            console.log(`✅ ${file}`);
        } else {
            console.error(`❌ Missing file: ${file}`);
            allFilesExist = false;
        }
    });

    return allFilesExist;
};

// 3. Check package.json dependencies
const checkDependencies = () => {
    console.log('\n📦 Checking dependencies...');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = [
            'express',
            'mongoose',
            'cors',
            'dotenv',
            'bcrypt',
            'jsonwebtoken'
        ];

        let allDepsPresent = true;
        requiredDeps.forEach(dep => {
            if (packageJson.dependencies && packageJson.dependencies[dep]) {
                console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
            } else {
                console.error(`❌ Missing dependency: ${dep}`);
                allDepsPresent = false;
            }
        });

        return allDepsPresent;
    } catch (error) {
        console.error('❌ Error reading package.json:', error.message);
        return false;
    }
};

// 4. Check environment variables
const checkEnvironmentVariables = () => {
    console.log('\n🔧 Checking environment variables...');
    
    const { validateEnvironment } = require('../utils/validateEnv');
    return validateEnvironment();
};

// 5. Check port availability
const checkPortAvailability = () => {
    return new Promise((resolve) => {
        const net = require('net');
        const port = process.env.PORT || 8000;
        
        console.log(`\n🔌 Checking port ${port} availability...`);
        
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                console.log(`✅ Port ${port} is available`);
                resolve(true);
            });
            server.close();
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${port} is already in use`);
                console.error(`💡 Stop the existing process or use a different port`);
                resolve(false);
            } else {
                console.error(`❌ Port check failed: ${err.message}`);
                resolve(false);
            }
        });
    });
};

// 6. Test MongoDB connection
const testDatabaseConnection = async () => {
    console.log('\n🗄️  Testing MongoDB connection...');
    
    try {
        const mongoose = require('mongoose');
        
        if (!process.env.MONGODB_URL) {
            console.error('❌ MONGODB_URL not configured');
            return false;
        }

        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ MongoDB connection successful');
        await mongoose.disconnect();
        return true;
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        
        if (error.message.includes('ENOTFOUND')) {
            console.error('💡 Check your internet connection and MongoDB URL');
        } else if (error.message.includes('authentication failed')) {
            console.error('💡 Check your MongoDB username and password');
        }
        
        return false;
    }
};

// Main startup check function
const runStartupCheck = async () => {
    console.log('Starting comprehensive system check...\n');
    
    const checks = [
        { name: 'Node.js Version', fn: checkNodeVersion },
        { name: 'Required Files', fn: checkRequiredFiles },
        { name: 'Dependencies', fn: checkDependencies },
        { name: 'Environment Variables', fn: checkEnvironmentVariables },
        { name: 'Port Availability', fn: checkPortAvailability },
        { name: 'Database Connection', fn: testDatabaseConnection }
    ];

    let allChecksPassed = true;

    for (const check of checks) {
        try {
            const result = await check.fn();
            if (!result) {
                allChecksPassed = false;
            }
        } catch (error) {
            console.error(`❌ ${check.name} check failed:`, error.message);
            allChecksPassed = false;
        }
    }

    console.log('\n' + '='.repeat(50));
    
    if (allChecksPassed) {
        console.log('🎉 ALL CHECKS PASSED! Your backend is ready to start.');
        console.log('💡 Run: npm start or node index.js');
    } else {
        console.log('❌ SOME CHECKS FAILED! Please fix the issues above before starting.');
        process.exit(1);
    }
    
    console.log('='.repeat(50) + '\n');
};

// Run if called directly
if (require.main === module) {
    runStartupCheck();
}

module.exports = { runStartupCheck };
