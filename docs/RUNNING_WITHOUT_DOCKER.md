# Running StreetWiseWeb Without Docker

If you're having Docker issues, you can run the application directly with Node.js.

## 🚀 **Quick Start (No Docker)**

### **Step 1: Install Dependencies**
```bash
# Install all dependencies
npm run install-all

# Or install individually:
cd backend && npm install
cd ../frontend && npm install
```

### **Step 2: Set Up Environment Variables**

Create your environment files:

**Backend: `backend/.env`**
```bash
# Copy from .env.example and fill in your values
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

**Frontend: `frontend/.env`**
```bash
# Frontend environment variables
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### **Step 3: Start the Application**

**Option 1: Start Both (Recommended)**
```bash
# From root directory
npm run dev
```

**Option 2: Start Individually**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### **Step 4: Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Test authentication: http://localhost:3000/register

## 🔧 **Troubleshooting**

### **Port Conflicts**
If ports 3000 or 3001 are in use:
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill processes if needed
taskkill /PID <process-id> /F
```

### **Module Not Found Errors**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

npm run install-all
```

### **Environment Variables Not Loading**
- Make sure `.env` files are in correct directories
- Restart the application after changing environment variables
- Check file names (`.env` not `.env.txt`)

## 📋 **Development Workflow**

### **Backend Development**
```bash
cd backend
npm run dev  # Starts with nodemon (auto-restart)
```

### **Frontend Development**
```bash
cd frontend
npm start   # Starts with hot reload
```

### **Testing**
```bash
# Run all tests
npm test

# Backend tests only
cd backend && npm test

# Frontend tests only
cd frontend && npm test
```

## 🔄 **When to Use Docker vs Direct**

### **Use Direct Node.js When:**
- ✅ Quick development and testing
- ✅ Docker Desktop not available
- ✅ Simpler debugging
- ✅ Local development

### **Use Docker When:**
- ✅ Production deployment
- ✅ Consistent environments
- ✅ Team collaboration
- ✅ CI/CD pipelines

## 🐳 **Docker Alternative Later**

Once Docker Desktop is running, you can switch back to Docker:

```bash
# Make sure Docker Desktop is running
docker --version

# Then use Docker commands
docker-compose up --build
```

For now, use the direct Node.js approach to test authentication!