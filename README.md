# Instagram Clone

A full-stack Instagram clone built with React, Node.js, Express, and SQLite. Features include user authentication, posting photos, likes, comments, following/followers, and real-time interactions.

## Features

- **User Authentication**: Register, login, and logout with JWT tokens
- **Photo Sharing**: Upload and share photos with captions and location
- **Social Interactions**: Like posts, comment, and follow other users
- **Real-time Updates**: Live notifications using Socket.io
- **Stories**: Share temporary stories (coming soon)
- **User Profiles**: Customizable profiles with avatar uploads
- **Responsive Design**: Mobile-first design that works on all devices
- **Explore Page**: Discover new content and users

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database
- **JWT** for authentication
- **Multer** for file uploads
- **Sharp** for image processing
- **Socket.io** for real-time features
- **bcryptjs** for password hashing

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Lucide React** for icons
- **Socket.io Client** for real-time features

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd instagram-clone
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search/:query` - Search users

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/feed` - Get user feed
- `GET /api/posts/explore` - Get explore posts
- `GET /api/posts/user/:username` - Get user posts
- `DELETE /api/posts/:postId` - Delete a post

### Likes & Comments
- `POST /api/likes/toggle` - Like/unlike a post
- `POST /api/comments` - Add a comment
- `GET /api/comments/post/:postId` - Get post comments

### Follows
- `POST /api/follows/toggle` - Follow/unfollow a user
- `GET /api/follows/suggestions` - Get follow suggestions

## Project Structure

```
instagram-clone/
├── backend/
│   ├── models/
│   │   └── database.js          # Database initialization
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management routes
│   │   ├── posts.js             # Post management routes
│   │   ├── comments.js          # Comment routes
│   │   ├── likes.js             # Like routes
│   │   └── follows.js           # Follow routes
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── uploads/                 # Uploaded files storage
│   ├── server.js                # Express server setup
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx        # Main layout component
    │   │   ├── PostCard.jsx      # Individual post component
    │   │   ├── CommentSection.jsx # Comments component
    │   │   └── ...
    │   ├── pages/
    │   │   ├── Login.jsx         # Login page
    │   │   ├── Register.jsx      # Registration page
    │   │   ├── Home.jsx          # Main feed page
    │   │   └── ...
    │   ├── context/
    │   │   └── AuthContext.jsx   # Authentication context
    │   ├── utils/
    │   │   └── api.js            # API utilities
    │   ├── App.jsx               # Main app component
    │   └── main.jsx              # Entry point
    └── package.json
```

## Database Schema

The application uses SQLite with the following tables:
- `users` - User information
- `posts` - Photo posts
- `comments` - Post comments
- `likes` - Post likes
- `follows` - User relationships
- `stories` - User stories (coming soon)
- `notifications` - User notifications

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
```

## Demo Accounts

For testing purposes, you can create demo accounts or use the registration form.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is for educational purposes only.

## Acknowledgments

- Inspired by Instagram's design and functionality
- Built with modern web technologies
- Uses icons from Lucide React