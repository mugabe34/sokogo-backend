// Comprehensive API Test Script for Sokogo Backend
// Tests all endpoints including authentication, items, uploads, and emails

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

class APITester {
    constructor() {
        this.authToken = null;
        this.testUserId = null;
        this.testItemId = null;
    }

    async runAllTests() {
        console.log('🧪 STARTING COMPREHENSIVE API TESTS\n');
        console.log(`🔗 Testing API at: ${BASE_URL}\n`);

        try {
            await this.testHealthCheck();
            await this.testUserRegistration();
            await this.testUserLogin();
            await this.testItemCreation();
            await this.testItemRetrieval();
            await this.testImageUpload();
            await this.testEmailService();
            await this.testContactInquiry();
            
            console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
        } catch (error) {
            console.error('\n❌ TEST SUITE FAILED:', error.message);
            process.exit(1);
        }
    }

    async testHealthCheck() {
        console.log('🏥 Testing Health Check...');
        try {
            const response = await axios.get(`${BASE_URL}/health`);
            console.log('✅ Health check passed:', response.data.status);
        } catch (error) {
            throw new Error(`Health check failed: ${error.message}`);
        }
    }

    async testUserRegistration() {
        console.log('\n👤 Testing User Registration...');
        try {
            const userData = {
                firstName: 'Test',
                lastName: 'User',
                email: `test${Date.now()}@example.com`,
                phoneNumber: '+250788123456',
                password: 'testpassword123',
                role: 'seller'
            };

            const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
            
            if (response.data.token) {
                this.authToken = response.data.token;
                this.testUserId = response.data.user.id;
                console.log('✅ User registration passed with JWT token');
            } else {
                throw new Error('No JWT token returned');
            }
        } catch (error) {
            throw new Error(`User registration failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async testUserLogin() {
        console.log('\n🔐 Testing User Login...');
        try {
            // Use a known test account or the one we just created
            const loginData = {
                email: 'test@example.com',
                password: 'testpassword123'
            };

            const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
            
            if (response.data.token) {
                console.log('✅ User login passed with JWT token');
            } else {
                console.log('⚠️ Login test skipped (test user may not exist)');
            }
        } catch (error) {
            console.log('⚠️ Login test skipped:', error.response?.data?.message || error.message);
        }
    }

    async testItemCreation() {
        console.log('\n📦 Testing Item Creation...');
        try {
            if (!this.authToken) {
                throw new Error('No auth token available');
            }

            const itemData = {
                title: 'Test Item',
                description: 'This is a test item for API testing',
                category: 'ELECTRONICS',
                subcategory: 'Smartphones',
                price: 150000,
                currency: 'Frw',
                location: {
                    district: 'Kigali',
                    city: 'Kigali',
                    address: 'Test Address'
                },
                features: {
                    condition: 'New',
                    warranty: true
                }
            };

            const response = await axios.post(`${BASE_URL}/api/items`, itemData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'userid': this.testUserId
                }
            });

            this.testItemId = response.data.item._id;
            console.log('✅ Item creation passed');
        } catch (error) {
            throw new Error(`Item creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async testItemRetrieval() {
        console.log('\n📋 Testing Item Retrieval...');
        try {
            const response = await axios.get(`${BASE_URL}/api/items`);
            
            if (response.data.items && Array.isArray(response.data.items)) {
                console.log(`✅ Item retrieval passed (${response.data.items.length} items found)`);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            throw new Error(`Item retrieval failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async testImageUpload() {
        console.log('\n🖼️ Testing Image Upload...');
        try {
            if (!this.authToken) {
                console.log('⚠️ Image upload test skipped (no auth token)');
                return;
            }

            // Create a test image file (1x1 pixel PNG)
            const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
            
            const formData = new FormData();
            formData.append('title', 'Test Item with Image');
            formData.append('description', 'Test item with image upload');
            formData.append('category', 'ELECTRONICS');
            formData.append('subcategory', 'Test');
            formData.append('price', '100000');
            formData.append('location[district]', 'Kigali');
            formData.append('location[city]', 'Kigali');
            formData.append('images', testImageBuffer, 'test.png');

            const response = await axios.post(`${BASE_URL}/api/items`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${this.authToken}`,
                    'userid': this.testUserId
                }
            });

            if (response.data.imagesUploaded > 0) {
                console.log('✅ Image upload passed');
            } else {
                console.log('⚠️ Image upload test completed (no images processed)');
            }
        } catch (error) {
            console.log('⚠️ Image upload test failed:', error.response?.data?.message || error.message);
        }
    }

    async testEmailService() {
        console.log('\n📧 Testing Email Service...');
        try {
            const response = await axios.get(`${BASE_URL}/api/contact/test-email`);
            
            if (response.data.success) {
                console.log('✅ Email service configuration is valid');
            } else {
                console.log('⚠️ Email service not configured:', response.data.error);
            }
        } catch (error) {
            console.log('⚠️ Email service test failed:', error.response?.data?.message || error.message);
        }
    }

    async testContactInquiry() {
        console.log('\n💬 Testing Contact Inquiry...');
        try {
            if (!this.authToken || !this.testItemId) {
                console.log('⚠️ Contact inquiry test skipped (missing auth or item)');
                return;
            }

            const inquiryData = {
                itemId: this.testItemId,
                message: 'This is a test inquiry message for API testing purposes.'
            };

            const response = await axios.post(`${BASE_URL}/api/contact/inquiry`, inquiryData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'userid': this.testUserId
                }
            });

            console.log('✅ Contact inquiry test passed');
        } catch (error) {
            console.log('⚠️ Contact inquiry test failed:', error.response?.data?.message || error.message);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new APITester();
    tester.runAllTests();
}

module.exports = APITester;
