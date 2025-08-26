# Sokogo Classifieds Backend API

A robust Node.js backend API for the Sokogo Classifieds marketplace platform with comprehensive error handling and production-ready features.

## Features

- **User Authentication**: Register, login, and JWT-based authentication
- **Item Management**: Create, read, update, delete classified listings
- **Search & Filtering**: Advanced search and filtering capabilities
- **Category Support**: Motors, Property, and Electronics categories
- **Error Handling**: Comprehensive error handling and validation
- **CORS Support**: Production-ready CORS configuration
- **Database**: MongoDB with Mongoose ODM
- **Security**: Password hashing, input validation, and sanitization

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

## Quick Start

### 1. Installation
```bash
git clone https://github.com/mugabe34/sokogo-backend.git
cd sokogo-backend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Run Startup Check (Recommended)
```bash
npm run check
```

### 4. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Safe start (runs check first)
npm run start:safe
```

## Environment Variables

Required variables in `.env`:

```env
# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/sokogo

# Server
PORT=8000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# CORS
FRONTEND_URL=http://localhost:3002
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run check` | Run comprehensive startup check |
| `npm run start:safe` | Run check then start server |
| `npm run kill-port` | Kill process on port 8000 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Items/Classifieds
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item by ID
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Utility
- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api` - API documentation

## Database Schema

### Supabase Setup
1. Go to your Supabase project
2. Open SQL Editor
3. Run the schema from `schema/bulletproof_schema.sql`

This creates:
- **users** table with authentication fields
- **items** table for classified listings
- **Indexes** for performance
- **RLS policies** for security
- **Triggers** for automatic timestamps

## Deployment

### Render.com
1. Connect your GitHub repository
2. Set environment variables:
   ```
   MONGODB_URL=your-mongodb-connection-string
   PORT=8000
   JWT_SECRET=your-jwt-secret
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

### Vercel (Frontend)
Update your frontend API base URL:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://sokogo-backend.onrender.com'
  : 'http://localhost:8000';
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
npm run kill-port
```

**MongoDB connection failed:**
- Check internet connection
- Verify MONGODB_URL in .env
- Ensure MongoDB cluster is running

**CORS errors:**
- Check FRONTEND_URL in .env
- Verify frontend URL matches CORS config

**Environment variables missing:**
```bash
npm run check
```

**Dependencies issues:**
```bash
npm install
npm audit fix
```

### Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable (database error)

## Development

### File Structure
```
sokogo-backend/
├── config/          # Database configuration
├── controller/      # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── schema/          # Database schemas
├── scripts/         # Utility scripts
├── utils/           # Helper utilities
├── .env.example     # Environment template
└── index.js         # Main server file
```

### Adding New Features
1. Create model in `models/`
2. Create controller in `controller/`
3. Create routes in `routes/`
4. Add routes to `index.js`
5. Update API documentation

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Rate limiting ready
- ✅ Error handling without data leaks
- ✅ Environment variable validation

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests and checks
5. Submit pull request

## License

ISC License
