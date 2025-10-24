# NewsPulse Backend API

A robust and secure backend API for the NewsPulse application, providing authentication services and news aggregation from NewsAPI.org.

## 🚀 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Password Security**: Bcrypt hashing with salt rounds
- **News Aggregation**: Fetch top headlines and search news articles
- **User Profiles**: Manage user preferences and bookmarks
- **Photo Upload**: Profile picture upload support
- **MongoDB Integration**: Efficient data storage with Mongoose
- **Error Handling**: Comprehensive error handling and validation
- **CORS Support**: Cross-origin resource sharing enabled

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- NewsAPI.org API key

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the Backend directory with the following:
   ```env
   PORT=5000
   NEWS_API=your_newsapi_key_here
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:3000
   ```

3. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📡 API Endpoints

### Health Check
- **GET** `/health` - Check if API is running

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: multipart/form-data

Fields:
- username: string (required, 3-30 characters)
- email: string (required, valid email)
- password: string (required, min 6 characters)
- photo: file (optional, image only, max 5MB)

Response:
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "username": "username",
    "email": "email@example.com",
    "photo": "path/to/photo",
    "preferences": {...},
    "createdAt": "timestamp",
    "lastLogin": null
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "username": "username",
    "email": "email@example.com",
    ...
  }
}
```

#### Get User Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "username",
    "email": "email@example.com",
    "photo": "path/to/photo",
    "preferences": {...},
    "createdAt": "timestamp",
    "lastLogin": "timestamp"
  }
}
```

#### Update User Preferences (Protected)
```http
PUT /api/auth/preferences
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "categories": ["technology", "business"],
  "emailNotifications": true
}

Response:
{
  "success": true,
  "message": "Preferences updated successfully",
  "user": {...}
}
```

### News Routes (`/api/news`)

#### Get Top Headlines
```http
GET /api/news/headlines?category=technology&country=us&pageSize=20&page=1

Query Parameters:
- category: general|business|entertainment|health|science|sports|technology
- country: country code (us, gb, in, etc.)
- pageSize: number (default: 20, max: 100)
- page: number (default: 1)

Response:
{
  "success": true,
  "totalResults": 100,
  "articles": [...],
  "category": "technology",
  "country": "us"
}
```

#### Search News
```http
GET /api/news/search?q=bitcoin&sortBy=publishedAt&pageSize=20&page=1

Query Parameters:
- q: search query (required)
- sortBy: relevancy|popularity|publishedAt
- pageSize: number (default: 20, max: 100)
- page: number (default: 1)
- language: language code (en, es, fr, etc.)

Response:
{
  "success": true,
  "totalResults": 500,
  "articles": [...],
  "query": "bitcoin"
}
```

#### Get News Sources
```http
GET /api/news/sources?category=technology&language=en&country=us

Query Parameters:
- category: news category (optional)
- language: language code (default: en)
- country: country code (optional)

Response:
{
  "success": true,
  "sources": [...]
}
```

#### Get Available Categories
```http
GET /api/news/categories

Response:
{
  "success": true,
  "categories": [
    { "id": "general", "name": "General" },
    { "id": "business", "name": "Business" },
    ...
  ]
}
```

## 🗄️ Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  passwordHash: String (required, hashed),
  photo: String (optional),
  bookmarks: [ObjectId],
  preferences: {
    categories: [String],
    emailNotifications: Boolean
  },
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **JWT Authentication**: Secure token-based authentication (7-day expiration)
3. **Input Validation**: Comprehensive validation for all user inputs
4. **Error Handling**: Detailed error messages without exposing sensitive data
5. **File Upload Security**: Type and size restrictions on file uploads
6. **CORS Protection**: Configurable CORS policy
7. **Rate Limiting Ready**: Architecture supports rate limiting middleware

## 📁 Project Structure

```
Backend/
├── config/
│   └── db.js              # Database configuration
├── controllers/
│   ├── authController.js  # Authentication logic
│   └── newsController.js  # News API logic
├── middleware/
│   └── authMiddleware.js  # JWT verification middleware
├── models/
│   └── User.js           # User schema and methods
├── routes/
│   ├── authRoutes.js     # Authentication endpoints
│   └── newsRoutes.js     # News API endpoints
├── uploads/              # User uploaded files
├── .env                  # Environment variables
├── index.js              # Main server file
├── package.json          # Dependencies
└── README.md            # Documentation
```

## 🧪 Testing the API

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -F "username=testuser" \
  -F "email=test@example.com" \
  -F "password=password123"
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get headlines:**
```bash
curl http://localhost:5000/api/news/headlines?category=technology
```

### Using Postman

1. Import the collection from `/docs/postman_collection.json` (if available)
2. Set the `BASE_URL` environment variable to `http://localhost:5000`
3. After login, copy the token and set it in the Authorization header

## 🚨 Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NEWS_API` | NewsAPI.org API key | `your_api_key` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/newspulse` |
| `JWT_SECRET` | JWT signing secret | `random_secret_string` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 📝 Notes

- Token expires after 7 days
- Maximum file upload size: 5MB
- Supported image formats: jpeg, jpg, png, gif, webp
- Password minimum length: 6 characters
- Username must be 3-30 characters (letters, numbers, underscores only)

## 🤝 Contributing

1. Follow existing code style
2. Add comments for complex logic
3. Test all endpoints before committing
4. Update documentation for new features

## 📄 License

ISC

## 👤 Author

NewsPulse Team

---

**Need help?** Check the health endpoint: `http://localhost:5000/health`
