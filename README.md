# 🎮 TicTac+ - Advanced AAA-Style Tic Tac Toe Game

A cutting-edge, animated Tic Tac Toe game with real-time multiplayer capabilities, AI fallback, and stunning visual effects. Built with modern React architecture and enterprise-level scalability.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (for real-time features)

### Installation

1. **Clone and setup**
```bash
git clone <repository-url>
cd tictac-plus
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. **Environment Setup**
```bash
# Copy environment files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

4. **Start Development**
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

## 🏗️ Architecture

### Frontend
- **React 18** with Hooks & Suspense
- **Redux Toolkit** for state management
- **TailwindCSS + SCSS** for styling
- **Framer Motion + Lottie** for animations
- **Vite** for build tooling

### Backend
- **Node.js + Express** server
- **Socket.IO** for real-time communication
- **MongoDB** with Mongoose ODM
- **Redis** for session management

## 🎯 Features

- ✅ Real-time multiplayer gameplay
- ✅ Advanced AI opponent (multiple difficulties)
- ✅ Stunning animations and effects
- ✅ Progressive Web App support
- ✅ Responsive design
- ✅ Accessibility compliant (WCAG 2.1 AA)
- ✅ Leaderboard system
- ✅ Player profiles and statistics

## 📱 Development

### Scripts
```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code

# Backend
npm run dev          # Start development server
npm run start        # Start production server
npm run test         # Run tests
```

### Project Structure
```
tictac-plus/
├── frontend/        # React application
├── backend/         # Node.js server
├── shared/          # Shared utilities and types
├── docs/           # Documentation
└── scripts/        # Build and deployment scripts
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_APP_NAME=TicTac+
```

**Backend (.env)**
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/tictacplus
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
NODE_ENV=development
```

## 🚀 Deployment

### Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
1. Build frontend: `npm run build`
2. Deploy backend to your server
3. Configure environment variables
4. Start services

## 🧪 Testing

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Supertest for API
- **E2E Tests**: Cypress for full workflow
- **Performance**: Lighthouse CI

## 📊 Performance Targets

- **Load Time**: < 2s initial load
- **Animations**: 60fps smooth animations
- **Scalability**: 10,000+ concurrent players
- **Uptime**: 99.9% reliability

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Socket.IO for real-time capabilities
- Framer Motion for smooth animations
- TailwindCSS for utility-first styling


docker logs tictacplus-backend  # For backend logs
docker logs tictacplus-frontend  # For frontend logs
docker logs tictacplus-nginx  # For nginx logs
