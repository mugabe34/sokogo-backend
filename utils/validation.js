// Comprehensive Validation Utilities for Sokogo Backend

const { validationError } = require('../middleware/errorHandler');

// Email validation
const isValidEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
};

// Phone number validation
const isValidPhoneNumber = (phone) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,20}$/;
    return phoneRegex.test(phone);
};

// Password validation
const isValidPassword = (password) => {
    return password && password.length >= 6;
};

// UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Price validation
const isValidPrice = (price) => {
    return !isNaN(price) && parseFloat(price) > 0 && parseFloat(price) < 999999999999.99;
};

// Category validation
const isValidCategory = (category) => {
    const validCategories = ['MOTORS', 'PROPERTY', 'ELECTRONICS'];
    return validCategories.includes(category);
};

// Status validation
const isValidStatus = (status) => {
    const validStatuses = ['ACTIVE', 'SOLD', 'EXPIRED', 'SUSPENDED'];
    return validStatuses.includes(status);
};

// Role validation
const isValidRole = (role) => {
    const validRoles = ['buyer', 'seller', 'admin'];
    return validRoles.includes(role);
};

// String validation (not empty, trimmed)
const isValidString = (str, minLength = 1, maxLength = 1000) => {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
};

// User registration validation
const validateUserRegistration = (userData) => {
    const errors = [];
    const { firstName, lastName, email, phoneNumber, password, role } = userData;

    if (!isValidString(firstName, 1, 100)) {
        errors.push('First name is required and must be 1-100 characters');
    }

    if (!isValidString(lastName, 1, 100)) {
        errors.push('Last name is required and must be 1-100 characters');
    }

    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
        errors.push('Invalid phone number format');
    }

    if (!isValidPassword(password)) {
        errors.push('Password must be at least 6 characters long');
    }

    if (role && !isValidRole(role)) {
        errors.push('Invalid role. Must be buyer, seller, or admin');
    }

    return errors;
};

// User login validation
const validateUserLogin = (loginData) => {
    const errors = [];
    const { email, password } = loginData;

    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }

    if (!password || password.length < 1) {
        errors.push('Password is required');
    }

    return errors;
};

// Item creation validation
const validateItemCreation = (itemData) => {
    const errors = [];
    const { 
        title, description, category, subcategory, price, 
        currency, district, city, seller, status 
    } = itemData;

    if (!isValidString(title, 1, 200)) {
        errors.push('Title is required and must be 1-200 characters');
    }

    if (!isValidString(description, 1, 5000)) {
        errors.push('Description is required and must be 1-5000 characters');
    }

    if (!category || !isValidCategory(category)) {
        errors.push('Valid category is required (MOTORS, PROPERTY, ELECTRONICS)');
    }

    if (!isValidString(subcategory, 1, 100)) {
        errors.push('Subcategory is required and must be 1-100 characters');
    }

    if (!price || !isValidPrice(price)) {
        errors.push('Valid price is required (must be positive number)');
    }

    if (currency && !isValidString(currency, 1, 10)) {
        errors.push('Currency must be 1-10 characters');
    }

    if (!isValidString(district, 1, 100)) {
        errors.push('District is required and must be 1-100 characters');
    }

    if (!isValidString(city, 1, 100)) {
        errors.push('City is required and must be 1-100 characters');
    }

    if (!seller || !isValidUUID(seller)) {
        errors.push('Valid seller ID is required');
    }

    if (status && !isValidStatus(status)) {
        errors.push('Invalid status. Must be ACTIVE, SOLD, EXPIRED, or SUSPENDED');
    }

    return errors;
};

// Validation middleware factory
const validate = (validationFunction) => {
    return (req, res, next) => {
        const errors = validationFunction(req.body);
        
        if (errors.length > 0) {
            return next(validationError(errors));
        }
        
        next();
    };
};

// Sanitize input data
const sanitizeInput = (data) => {
    if (typeof data === 'string') {
        return data.trim();
    }
    
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return data;
};

module.exports = {
    isValidEmail,
    isValidPhoneNumber,
    isValidPassword,
    isValidUUID,
    isValidPrice,
    isValidCategory,
    isValidStatus,
    isValidRole,
    isValidString,
    validateUserRegistration,
    validateUserLogin,
    validateItemCreation,
    validate,
    sanitizeInput
};
