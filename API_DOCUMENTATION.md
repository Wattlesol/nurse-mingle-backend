# Orange Backend API Documentation

## Base URL
```
http://localhost:3004/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Response data (if any)
  "error": "Error message" // Only present if success is false
}
```

## Pagination
Paginated endpoints accept these query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination info:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Authentication Endpoints

### Register with Email
```http
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "fullName": "John Doe",
  "age": 25,
  "gender": "male",
  "location": "New York"
}
```

### Login with Email
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Firebase Login
```http
POST /auth/firebase
```

**Body:**
```json
{
  "idToken": "firebase-id-token"
}
```

### Guest Login
```http
POST /auth/guest
```

**Body:**
```json
{
  "deviceId": "unique-device-id"
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

### Logout
```http
POST /auth/logout
```
*Requires authentication*

---

## User Endpoints

### Get Current User Profile
```http
GET /users/profile
```
*Requires authentication*

### Update Profile
```http
PUT /users/profile
```
*Requires authentication*

**Body:**
```json
{
  "username": "newusername",
  "fullName": "New Name",
  "bio": "My bio",
  "age": 26,
  "gender": "male",
  "location": "Los Angeles"
}
```

### Get User by ID
```http
GET /users/{id}
```

### Search Users
```http
GET /users/search?q=john&page=1&limit=20
```

### Follow User
```http
POST /users/{id}/follow
```
*Requires authentication*

### Unfollow User
```http
DELETE /users/{id}/follow
```
*Requires authentication*

### Get User Followers
```http
GET /users/{id}/followers?page=1&limit=20
```

### Get User Following
```http
GET /users/{id}/following?page=1&limit=20
```

---

## Post Endpoints

### Get Posts Feed
```http
GET /posts?page=1&limit=20
```

### Create Post
```http
POST /posts
```
*Requires authentication*

**Body:**
```json
{
  "content": "Post content",
  "image": "https://s3-url/image.jpg",
  "video": "https://s3-url/video.mp4"
}
```

### Get Post by ID
```http
GET /posts/{id}
```

### Get User Posts
```http
GET /posts/user/{userId}?page=1&limit=20
```

### Update Post
```http
PUT /posts/{id}
```
*Requires authentication*

**Body:**
```json
{
  "content": "Updated content"
}
```

### Delete Post
```http
DELETE /posts/{id}
```
*Requires authentication*

### Like Post
```http
POST /posts/{id}/like
```
*Requires authentication*

### Unlike Post
```http
DELETE /posts/{id}/like
```
*Requires authentication*

### Get Post Comments
```http
GET /posts/{postId}/comments?page=1&limit=20
```

### Add Comment
```http
POST /posts/{postId}/comments
```
*Requires authentication*

**Body:**
```json
{
  "content": "Comment content"
}
```

### Update Comment
```http
PUT /posts/comments/{id}
```
*Requires authentication*

### Delete Comment
```http
DELETE /posts/comments/{id}
```
*Requires authentication*

---

## Story Endpoints

### Get Stories Feed
```http
GET /stories?page=1&limit=20
```

### Create Story
```http
POST /stories
```
*Requires authentication*

**Body:**
```json
{
  "image": "https://s3-url/image.jpg",
  "video": "https://s3-url/video.mp4"
}
```

### Get User Stories
```http
GET /stories/user/{userId}
```

### Get Story by ID
```http
GET /stories/{id}
```

### View Story
```http
POST /stories/{id}/view
```
*Requires authentication*

### Delete Story
```http
DELETE /stories/{id}
```
*Requires authentication*

---

## Message Endpoints

### Get Conversations
```http
GET /messages/conversations?page=1&limit=20
```
*Requires authentication*

### Get Conversation Messages
```http
GET /messages/conversations/{userId}?page=1&limit=50
```
*Requires authentication*

### Send Message
```http
POST /messages/send
```
*Requires authentication*

**Body:**
```json
{
  "receiverId": "user-id",
  "content": "Message content",
  "messageType": "text",
  "image": "https://s3-url/image.jpg",
  "video": "https://s3-url/video.mp4"
}
```

### Get Unread Count
```http
GET /messages/unread-count
```
*Requires authentication*

### Mark Message as Read
```http
PUT /messages/{id}/read
```
*Requires authentication*

### Delete Message
```http
DELETE /messages/{id}
```
*Requires authentication*

---

## Live Streaming Endpoints

### Generate Live Token
```http
POST /live/token
```
*Requires authentication and live permission*

**Body:**
```json
{
  "channelName": "live-channel-name",
  "isHost": true
}
```

### Generate Call Token
```http
POST /live/call-token
```
*Requires authentication*

**Body:**
```json
{
  "receiverId": "user-id",
  "callType": "video"
}
```

### Get Call History
```http
GET /live/call-history?page=1&limit=20
```
*Requires authentication*

---

## Upload Endpoints

### Upload Profile Image
```http
POST /upload/profile-image
```
*Requires authentication*
*Content-Type: multipart/form-data*

**Form Data:**
- `image`: Image file

### Upload Cover Image
```http
POST /upload/cover-image
```
*Requires authentication*
*Content-Type: multipart/form-data*

### Upload Post Media
```http
POST /upload/post-media
```
*Requires authentication*
*Content-Type: multipart/form-data*

**Form Data:**
- `image`: Image file (optional)
- `video`: Video file (optional)

### Upload Story Media
```http
POST /upload/story-media
```
*Requires authentication*
*Content-Type: multipart/form-data*

### Upload Document
```http
POST /upload/document
```
*Requires authentication*
*Content-Type: multipart/form-data*

**Form Data:**
- `document`: Document file

---

## Notification Endpoints

### Get Notifications
```http
GET /notifications?page=1&limit=20&type=like
```
*Requires authentication*

### Get Unread Count
```http
GET /notifications/unread-count
```
*Requires authentication*

### Mark as Read
```http
PUT /notifications/{id}/read
```
*Requires authentication*

### Mark All as Read
```http
PUT /notifications/read-all
```
*Requires authentication*

### Delete Notification
```http
DELETE /notifications/{id}
```
*Requires authentication*

### Update Device Token
```http
POST /notifications/device-token
```
*Requires authentication*

**Body:**
```json
{
  "deviceToken": "firebase-device-token"
}
```

---

## Admin Endpoints
*All admin endpoints require admin authentication*

### Get Dashboard
```http
GET /admin/dashboard
```

### Get Users
```http
GET /admin/users?page=1&limit=20&search=john&status=active&verified=true&loginType=email
```

### Block User
```http
PUT /admin/users/{id}/block
```

**Body:**
```json
{
  "reason": "Violation of terms"
}
```

### Unblock User
```http
PUT /admin/users/{id}/unblock
```

### Verify User
```http
PUT /admin/users/{id}/verify
```

### Grant Live Permission
```http
PUT /admin/users/{id}/live-permission
```

**Body:**
```json
{
  "canGoLive": true
}
```

### Get Posts
```http
GET /admin/posts?page=1&limit=20&search=content&status=active
```

### Delete Post
```http
DELETE /admin/posts/{id}
```

**Body:**
```json
{
  "reason": "Inappropriate content"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Socket.IO Events

### Connection
```javascript
const socket = io('ws://localhost:3004', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Chat Events
- `join_chat` - Join a chat room
- `send_message` - Send a message
- `new_message` - Receive a new message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

### Live Events
- `join_live_room` - Join live stream
- `leave_live_room` - Leave live stream
- `live_comment` - Send live comment
- `send_live_gift` - Send virtual gift

### Call Events
- `call_user` - Initiate call
- `incoming_call` - Receive call
- `call_response` - Accept/reject call
- `call_ended` - Call ended

---

## Rate Limits
- Default: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per minute
- Upload endpoints: 10 requests per minute

---

## File Upload Limits
- Images: 10MB max, formats: jpg, jpeg, png, gif, webp
- Videos: 10MB max, formats: mp4, mov, avi, mkv
- Documents: 10MB max, images only
