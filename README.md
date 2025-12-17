# EventHub - Mini Event Platform

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) application that allows users to create, view, and RSVP to events.

## Features

### Core Features
- **User Authentication**: Secure signup and login with JWT token-based authentication
- **Event Management**: Create, view, edit, and delete events with image upload
- **RSVP System**: Join and leave events with capacity enforcement and concurrency handling
- **Search & Filter**: Search events by title/description, filter by category and date range
- **User Dashboard**: View events you've created and events you're attending
- **Responsive Design**: Fully responsive UI that works on desktop, tablet, and mobile

### Technical Features
- **JWT Authentication**: Stateless session management with JSON Web Tokens
- **Cloudinary Integration**: Cloud-based image upload and storage
- **Atomic Operations**: Race condition prevention for RSVP system
- **MVC Architecture**: Clean separation of concerns in the backend

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Cloudinary for image storage
- Multer for file upload handling

### Frontend
- React.js (Vite)
- Tailwind CSS
- React Router DOM
- Axios for API calls
- React Hot Toast for notifications
- React Icons

## Project Structure

```
Event-Platform/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── events/
│   │   │   │   ├── EventCard.jsx
│   │   │   │   └── SearchFilter.jsx
│   │   │   └── layout/
│   │   │       ├── Footer.jsx
│   │   │       ├── Layout.jsx
│   │   │       └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── CreateEvent.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EditEvent.jsx
│   │   │   ├── EventDetail.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express backend
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── eventController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── Event.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── eventRoutes.js
│   ├── utils/
│   │   ├── cloudinaryUpload.js
│   │   └── generateToken.js
│   ├── .env.example
│   ├── index.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Event-Platform
```

### 2. Setup Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit the `.env` file with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/event-platform
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Setup Frontend

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Create .env file (optional - defaults to localhost:5000)
cp .env.example .env
```

### 4. Run the Application

**Start the backend server:**
```bash
cd server
npm run dev
```
Server will run on http://localhost:5000

**Start the frontend (in a new terminal):**
```bash
cd client
npm run dev
```
Frontend will run on http://localhost:5173

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (Protected) |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events (with search/filter) |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create event (Protected) |
| PUT | `/api/events/:id` | Update event (Protected - Owner only) |
| DELETE | `/api/events/:id` | Delete event (Protected - Owner only) |
| POST | `/api/events/:id/rsvp` | RSVP to event (Protected) |
| DELETE | `/api/events/:id/rsvp` | Cancel RSVP (Protected) |
| GET | `/api/events/user/my-events` | Get user's created events (Protected) |
| GET | `/api/events/user/my-rsvps` | Get user's RSVPs (Protected) |

## RSVP Capacity and Concurrency Handling

### The Challenge
When multiple users try to RSVP for the last available spot simultaneously, we need to ensure:
1. **Capacity is strictly enforced** - Never exceed the maximum capacity
2. **No race conditions** - Concurrent requests don't both succeed for the last spot
3. **No duplicate RSVPs** - A user can only RSVP once per event

### The Solution: Atomic Updates

I use MongoDB's `findOneAndUpdate` with atomic operators to handle this challenge. Here's how it works:

```javascript
// From server/controllers/eventController.js - joinEvent function

const event = await Event.findOneAndUpdate(
  {
    _id: eventId,
    // Condition 1: User is not already in attendees (prevents duplicates)
    attendees: { $ne: userId },
    // Condition 2: Current attendee count is less than capacity
    $expr: { $lt: ['$attendeeCount', '$capacity'] }
  },
  {
    // Action 1: Add user to attendees array
    $push: { attendees: userId },
    // Action 2: Increment count atomically
    $inc: { attendeeCount: 1 }
  },
  { new: true }
);
```

### Why This Works

1. **Single Atomic Operation**: The `findOneAndUpdate` query combines the check and update in one atomic database operation. MongoDB guarantees this operation is isolated - no other operation can modify the document between our check and update.

2. **Condition-Based Update**: The query conditions ensure that:
   - `attendees: { $ne: userId }` - Only updates if user is NOT already in the list
   - `$expr: { $lt: ['$attendeeCount', '$capacity'] }` - Only updates if there's still room

3. **If Conditions Fail**: If either condition fails (user already RSVPed or event is full), the operation returns `null` and no changes are made.

4. **Race Condition Scenario**: When two users try to RSVP for the last spot:
   - Both requests reach the database almost simultaneously
   - MongoDB processes them one at a time (atomic)
   - First request: succeeds, attendeeCount becomes equal to capacity
   - Second request: `$lt` condition fails, returns null, user gets "Event is full" message

### Benefits of This Approach
- **No Transactions Needed**: Simpler than using MongoDB transactions
- **No Application-Level Locking**: All logic is handled by the database
- **Consistent State**: The database is always in a valid state
- **Easy to Understand**: The logic is clear and maintainable

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables (same as `.env` file)

### Frontend Deployment (Vercel)

1. Import your GitHub repository on Vercel
2. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
3. Add environment variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://your-api.onrender.com/api`)

### Database (MongoDB Atlas)

1. Create a free cluster on MongoDB Atlas
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for all)
4. Get the connection string and use it in `MONGODB_URI`

## Features Implemented

### Required Features
- [x] User Authentication (Sign Up & Login with JWT)
- [x] Event Management (CRUD operations)
- [x] Image Upload (Cloudinary integration)
- [x] RSVP System with capacity enforcement
- [x] Concurrency handling for simultaneous RSVPs
- [x] No duplicate RSVPs per user
- [x] Responsive UI (Desktop, Tablet, Mobile)

### Bonus Features
- [x] Search by title/description
- [x] Filter by category and date range
- [x] User Dashboard (My Events & My RSVPs)
- [x] Form validation
- [x] Toast notifications
- [x] Pagination

## License

MIT
