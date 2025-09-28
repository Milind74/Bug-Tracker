# 🐛 Mini-Jira Bug Tracker

A full-stack bug tracking application built with React, Node.js, and MongoDB. Features include user authentication, bug management, real-time search, analytics, and role-based access control.

![Bug Tracker Dashboard](https://via.placeholder.com/800x400?text=Bug+Tracker+Dashboard)

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Role-based access (Developer, Tester, Admin)
- Beautiful gradient login/signup pages

### 🐛 Bug Management
- Create, read, update, delete bugs
- Priority levels (Low, Medium, High, Critical)
- Status tracking (Open, In Progress, Resolved, Closed, Reopened)
- Assign bugs to team members
- Add comments and track discussions
- Tag system for categorization

### 🔍 Advanced Search & Filtering
- Real-time search with debouncing
- Filter by status, priority, assignee
- Partial text matching
- Search in titles and descriptions

### 📊 Analytics Dashboard
- Bug statistics and trends
- Status and priority distribution charts
- Monthly trend analysis
- Assignee workload visualization
- Interactive charts with Recharts

### 🎨 Modern UI/UX
- Material-UI design system
- Responsive design
- Glass-morphism effects
- Loading states and error handling
- Pagination (10 items per page)

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** + **Zod** for form validation
- **Recharts** for analytics
- **Vite** for build tooling

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for validation
- **CORS** enabled

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mini-jira-bug-tracker.git
   cd mini-jira-bug-tracker
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd bug-tracker-server
   npm install

   # Install frontend dependencies
   cd ../bug-tracker-client
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in `bug-tracker-server/`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bug-tracker
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   PORT=5000
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Start backend server
   cd bug-tracker-server
   npm run dev

   # Terminal 2: Start frontend client
   cd bug-tracker-client  
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
Mini-Jira/
├── bug-tracker-client/          # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React contexts (Auth)
│   │   ├── hooks/               # Custom hooks
│   │   ├── pages/               # Page components
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # API utilities
│   │   └── Routes.tsx           # App routing
│   └── package.json
├── bug-tracker-server/          # Node.js backend
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # MongoDB schemas
│   │   ├── routes/              # API routes
│   │   ├── utils/               # Server utilities
│   │   └── index.ts             # Server entry point
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Bugs
- `GET /api/bugs` - List bugs (with pagination & filters)
- `POST /api/bugs` - Create new bug
- `GET /api/bugs/:id` - Get bug details
- `PUT /api/bugs/:id` - Update bug
- `DELETE /api/bugs/:id` - Delete bug
- `GET /api/bugs/analytics` - Bug analytics
- `GET /api/bugs/export` - Export bugs to CSV

### Comments
- `GET /api/bugs/:id/comments` - Get bug comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Users
- `GET /api/users` - List all users

## 🎯 Key Features Implemented

- ✅ **Pagination**: 10 items per page with Previous/Next navigation
- ✅ **Real-time Search**: Debounced search (200ms) with partial matching
- ✅ **Error Handling**: User-friendly error messages from API responses
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Form Validation**: Zod schemas with React Hook Form
- ✅ **Authentication**: JWT tokens with auto-logout
- ✅ **Role Management**: Developer, Tester roles
- ✅ **Beautiful UI**: Material-UI with gradient themes

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd bug-tracker-client
npm run build
# Deploy to Vercel
```

### Backend (Render/Railway)
```bash
cd bug-tracker-server
npm run build
# Deploy to your chosen platform
```

### Environment Variables for Production
```env
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
PORT=5000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- MongoDB team for the flexible database
- React team for the amazing frontend framework

## 📞 Support

If you have any questions or issues, please open an issue on GitHub or contact me at your-email@example.com.

---

**Happy Bug Tracking!** 🐛✨