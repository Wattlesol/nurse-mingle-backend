# Orange Backend - Node.js API

A comprehensive Node.js backend for a social media and live streaming platform, converted from PHP Laravel to Node.js with Express, Prisma, PostgreSQL, Firebase, AWS S3, Socket.IO, and Agora integration.

## 🚀 Features

### Core Features
- **User Authentication**: Email, Firebase (Google/Facebook), Guest login
- **Social Media**: Posts, Stories, Comments, Likes, Follow system
- **Real-time Messaging**: Socket.IO powered chat system
- **Live Streaming**: Agora-powered voice/video calls and live streaming
- **Media Storage**: AWS S3 integration for images and videos
- **Admin Panel**: Comprehensive admin management system
- **Push Notifications**: Firebase Cloud Messaging
- **Virtual Economy**: Diamonds, coins, and gifts system

### Technical Features
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens + Firebase Auth
- **File Upload**: AWS S3 with Multer
- **Real-time**: Socket.IO for chat and live features
- **Voice/Video**: Agora SDK integration
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Express-validator
- **Error Handling**: Centralized error management

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Firebase project (for authentication)
- AWS S3 bucket (for media storage)
- Agora account (for voice/video calls)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NodeProject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/orange_db"
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-token-secret
   
   # Firebase
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   
   # AWS S3
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_S3_BUCKET=your-s3-bucket-name
   
   # Agora
   AGORA_APP_ID=your-agora-app-id
   AGORA_APP_CERTIFICATE=your-agora-app-certificate
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed database with initial data
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email |
| POST | `/api/auth/login` | Login with email |
| POST | `/api/auth/firebase` | Login with Firebase |
| POST | `/api/auth/guest` | Guest login |
| POST | `/api/auth/admin` | Admin login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/users/search` | Search users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users/:id/follow` | Follow user |
| DELETE | `/api/users/:id/follow` | Unfollow user |
| GET | `/api/users/:id/followers` | Get user followers |
| GET | `/api/users/:id/following` | Get user following |

### Live Streaming Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/live/token` | Generate live streaming token |
| POST | `/api/live/call-token` | Generate voice/video call token |
| GET | `/api/live/call-history` | Get call history |

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/profile-image` | Upload profile image |
| POST | `/api/upload/cover-image` | Upload cover image |
| POST | `/api/upload/post-media` | Upload post media |
| POST | `/api/upload/story-media` | Upload story media |
| POST | `/api/upload/document` | Upload verification document |

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed database with initial data
```

### Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.js  # Prisma client
│   ├── firebase.js  # Firebase admin setup
│   └── aws.js       # AWS S3 configuration
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
└── app.js          # Main application file
```

### Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- **User**: User accounts and profiles
- **Post**: User posts with media
- **Story**: Temporary stories (24h)
- **Message**: Chat messages
- **Follow**: User follow relationships
- **LiveRoom**: Live streaming rooms
- **Gift**: Virtual gifts system
- **Notification**: Push notifications

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Cross-origin request security
- **Helmet.js**: Security headers
- **Input Validation**: Request validation
- **File Upload Security**: Type and size restrictions

## 🌐 Real-time Features

### Socket.IO Events

**Chat Events:**
- `join_chat` - Join a chat room
- `send_message` - Send a message
- `typing_start/stop` - Typing indicators

**Live Streaming Events:**
- `join_live_room` - Join live stream
- `live_comment` - Send live comment
- `send_live_gift` - Send virtual gift

**Call Events:**
- `call_user` - Initiate voice/video call
- `call_response` - Accept/reject call
- `call_ended` - End call

## 📱 Mobile App Integration

### Firebase Authentication
- Google Sign-In
- Facebook Login
- Email/Password
- Guest access

### Agora Integration
- Voice calls
- Video calls
- Live streaming
- Screen sharing

### Push Notifications
- Real-time messaging
- Live stream notifications
- Follow notifications
- Gift notifications

## 🚀 Deployment

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   EXPOSE 3004
   CMD ["npm", "start"]
   ```

2. **Build and run**
   ```bash
   docker build -t orange-backend .
   docker run -p 3004:3004 --env-file .env orange-backend
   ```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3004
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
# ... other production configs
```

## 🧪 Testing

```bash
# Run tests (to be implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📊 Monitoring

- Health check endpoint: `/health`
- Database connection monitoring
- Memory usage tracking
- Error logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Status**: ✅ Core structure complete, ready for full implementation
**Version**: 1.0.0
**Last Updated**: 2024
