# StreetWiseWeb Production-Ready Implementation Plan
**Focus: Small Customer Segment with Database & User Management**

---

## 📊 **Current State Analysis**

### **Data Storage**
- **Current**: In-memory storage using JavaScript `Map()` objects
- **Location**: `backend/services/cache/CacheManager.js`
- **Stored Data**:
  - Analysis results (24hr TTL)
  - PDF cache (1hr TTL)
  - No user data (stateless)
  - No persistent storage

### **Authentication & Sessions**
- **Current**: Completely stateless
- **No user accounts**: Users can't save/retrieve analyses
- **No session management**: Each request is independent
- **No access control**: Public API endpoints

### **Data Models**
- **Frontend**: Well-defined models in `/frontend/src/models/`
- **Backend**: No formal models, just in-memory objects
- **Schema**: No database schema exists

---

## 🎯 **Production Architecture for Small Customers**

### **Target Customer Profile**
- **Freelancers & Agencies**: 1-10 team members
- **Small Businesses**: Basic accessibility compliance needs
- **Budget Conscious**: $10-50/month pricing range
- **Simple Needs**: User accounts, saved reports, basic collaboration

---

## 🗄️ **Database Design & Recommendations**

### **Database Options Comparison**

| Database | Pros | Cons | Cost | Complexity | Recommendation |
|----------|------|------|------|------------|----------------|
| **PostgreSQL** | ✅ ACID, JSON support, mature<br/>✅ Excellent performance<br/>✅ Rich ecosystem | ❌ Requires SQL knowledge<br/>❌ Setup complexity | $15-25/mo | Medium | **Recommended** |
| **MySQL** | ✅ Widely supported<br/>✅ Good performance<br/>✅ Familiar to developers | ❌ Limited JSON support<br/>❌ Less feature-rich | $10-20/mo | Medium | Good alternative |
| **MongoDB** | ✅ Flexible schema<br/>✅ Good for JSON data<br/>✅ Easy to start | ❌ No ACID transactions<br/>❌ Potential consistency issues | $15-30/mo | Low | Not recommended |
| **SQLite** | ✅ Zero configuration<br/>✅ Perfect for small scale<br/>✅ File-based | ❌ No concurrent writes<br/>❌ Limited scalability | Free | Very Low | **For MVP only** |

### **Recommended Database Schema (PostgreSQL)**

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    plan_type VARCHAR(50) DEFAULT 'free', -- free, basic, premium
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'
);

-- Projects table (for organizing analyses)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'
);

-- Analyses table (main analysis results)
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'overview', -- overview, detailed
    language VARCHAR(10) DEFAULT 'en',
    
    -- Analysis results
    overall_score INTEGER,
    accessibility_score INTEGER,
    seo_score INTEGER,
    performance_score INTEGER,
    
    -- Raw data (JSON)
    analysis_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- For cache management
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
    error_message TEXT,
    
    -- Indexes
    INDEX idx_user_analyses (user_id, created_at DESC),
    INDEX idx_project_analyses (project_id, created_at DESC),
    INDEX idx_url_analyses (url, created_at DESC)
);

-- Analysis issues (extracted for better querying)
CREATE TABLE analysis_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    issue_id VARCHAR(255) NOT NULL, -- From axe-core or custom
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50), -- critical, serious, moderate, minor
    category VARCHAR(100), -- forms, images, navigation, etc
    wcag_criteria JSONB DEFAULT '[]',
    elements JSONB DEFAULT '[]',
    remediation JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_analysis_issues (analysis_id),
    INDEX idx_severity_issues (severity),
    INDEX idx_category_issues (category)
);

-- User sessions (for auth)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET,
    
    INDEX idx_user_sessions (user_id),
    INDEX idx_token_lookup (token_hash),
    INDEX idx_session_expiry (expires_at)
);

-- Usage tracking (for billing/limits)
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- analysis, report_generated, pdf_download
    resource_id UUID, -- analysis_id, project_id, etc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_user_usage (user_id, created_at DESC),
    INDEX idx_action_usage (action, created_at DESC)
);
```

---

## 🔐 **User Management Options**

### **Authentication Approaches Comparison**

| Approach | Pros | Cons | Complexity | Cost | Recommendation |
|----------|------|------|------------|------|----------------|
| **JWT + Database Sessions** | ✅ Stateless tokens<br/>✅ Scalable<br/>✅ Mobile friendly | ❌ Token management<br/>❌ Refresh complexity | Medium | Low | **Recommended** |
| **Traditional Sessions** | ✅ Simple to implement<br/>✅ Server-side control<br/>✅ Easy revocation | ❌ Not stateless<br/>❌ Scaling challenges | Low | Low | Good for MVP |
| **Auth0/Firebase Auth** | ✅ Feature-rich<br/>✅ No maintenance<br/>✅ Social logins | ❌ Monthly cost<br/>❌ Vendor lock-in | Very Low | $25-100/mo | Overkill for small customers |
| **Supabase Auth** | ✅ Open source<br/>✅ Database included<br/>✅ Modern features | ❌ Learning curve<br/>❌ Newer technology | Medium | $25-50/mo | Good alternative |

### **Recommended Auth Implementation: JWT + Database Sessions**

```javascript
// User Model (backend/models/User.js)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
  constructor(db) {
    this.db = db;
  }

  async create(userData) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const user = await this.db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, company) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name`,
      [userData.email, passwordHash, userData.firstName, userData.lastName, userData.company]
    );
    return user.rows[0];
  }

  async authenticate(email, password) {
    const user = await this.db.query(
      'SELECT id, email, password_hash, first_name, last_name, plan_type FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (user.rows.length === 0) return null;
    
    const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValid) return null;
    
    const { password_hash, ...userWithoutPassword } = user.rows[0];
    return userWithoutPassword;
  }

  async createSession(userId, userAgent, ipAddress) {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await this.db.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, expiresAt, userAgent, ipAddress]
    );
    
    return token;
  }
}
```

---

## 🏗️ **Production Infrastructure Stack**

### **Recommended Technology Stack**

```yaml
# Production Docker Compose
version: '3.8'
services:
  # Application
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/streetwiseweb
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis
    
  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
    
  # Database
  db:
    image: postgres:15-alpine
    environment:
          - POSTGRES_DB=streetwiseweb
    - POSTGRES_USER=streetwiseweb_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    
  # Caching
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
```

### **Cost Analysis for Small Customers**

| Component | Option | Monthly Cost | Notes |
|-----------|--------|-------------|-------|
| **Hosting** | DigitalOcean Droplet (2GB) | $12 | Sufficient for 100-500 users |
|  | Hetzner VPS (4GB) | $8 | Better price/performance |
|  | Railway/Render | $20-40 | Managed, easier deployment |
| **Database** | Managed PostgreSQL | $15-25 | Recommended for production |
|  | Self-hosted on VPS | $0 | Included in VPS cost |
| **Storage** | Object Storage (S3/DO Spaces) | $5 | For report PDFs, screenshots |
| **CDN** | CloudFlare | $0-20 | Free tier sufficient initially |
| **Monitoring** | Simple monitoring | $0-10 | Basic alerting |
| **Total** |  | **$25-60/mo** | For 100-500 small customers |

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Database Integration (Week 1-2)**

1. **Setup Database**
   ```bash
   # Add to package.json
   npm install pg pg-types uuid bcrypt jsonwebtoken
   npm install --save-dev @types/pg
   ```

2. **Create Database Service**
   ```javascript
   // backend/services/database.js
   const { Pool } = require('pg');
   
   class DatabaseService {
     constructor() {
       this.pool = new Pool({
         connectionString: process.env.DATABASE_URL,
         ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
       });
     }
   
     async query(text, params) {
       const client = await this.pool.connect();
       try {
         return await client.query(text, params);
       } finally {
         client.release();
       }
     }
   }
   
   module.exports = new DatabaseService();
   ```

3. **Migrate Cache to Database**
   - Replace `CacheManager` with database queries
   - Keep Redis for session caching
   - Migrate analysis storage to `analyses` table

### **Phase 2: User Authentication (Week 2-3)**

1. **Auth Middleware**
   ```javascript
   // backend/middleware/auth.js
   const jwt = require('jsonwebtoken');
   const User = require('../models/User');
   
   async function authenticateToken(req, res, next) {
     const authHeader = req.headers['authorization'];
     const token = authHeader && authHeader.split(' ')[1];
   
     if (!token) {
       return res.status(401).json({ error: 'Access token required' });
     }
   
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const user = await User.findById(decoded.userId);
       req.user = user;
       next();
     } catch (error) {
       return res.status(403).json({ error: 'Invalid or expired token' });
     }
   }
   ```

2. **Auth Routes**
   ```javascript
   // backend/routes/auth.js
   router.post('/register', async (req, res) => {
     // User registration logic
   });
   
   router.post('/login', async (req, res) => {
     // User login logic
   });
   
   router.post('/logout', authenticateToken, async (req, res) => {
     // Session invalidation logic
   });
   ```

3. **Frontend Auth Integration**
   ```javascript
   // frontend/src/contexts/AuthContext.js
   const AuthContext = createContext();
   
   export function AuthProvider({ children }) {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);
   
     // Auth methods: login, logout, register
   }
   ```

### **Phase 3: User Dashboard (Week 3-4)**

1. **Project Management**
   - Create/edit/delete projects
   - Associate analyses with projects
   - Project-based analysis history

2. **Analysis History**
   - List user's past analyses
   - Filter by project, date, URL
   - Re-run analyses on saved URLs

3. **User Settings**
   - Profile management
   - Notification preferences
   - Usage statistics

### **Phase 4: Production Deployment (Week 4)**

1. **Environment Configuration**
   ```bash
   # .env.production
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=your-secret-key
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Docker Production Setup**
   - Multi-stage builds for optimization
   - Health checks and restart policies
   - SSL certificate management

3. **Monitoring & Logging**
   - Application monitoring (PM2/Docker health checks)
   - Database monitoring
   - Error tracking (Sentry)

---

## 💰 **Pricing Strategy for Small Customers**

### **Freemium Model**
- **Free Tier**: 5 analyses/month, basic reports
- **Basic Plan** ($15/mo): 50 analyses/month, project management, PDF reports
- **Professional** ($35/mo): 200 analyses/month, team collaboration, API access

### **Usage Limits Implementation**
```javascript
// backend/middleware/rateLimiting.js
async function checkUsageLimit(req, res, next) {
  const user = req.user;
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const usage = await db.query(
    `SELECT COUNT(*) as count FROM usage_logs 
     WHERE user_id = $1 AND action = 'analysis' 
     AND created_at >= $2`,
    [user.id, `${currentMonth}-01`]
  );
  
  const limit = getPlanLimit(user.plan_type);
  if (usage.rows[0].count >= limit) {
    return res.status(429).json({ 
      error: 'Monthly analysis limit exceeded',
      upgrade_url: '/upgrade'
    });
  }
  
  next();
}
```

---

## 🔧 **Migration Strategy**

### **Step 1: Gradual Migration**
1. Deploy database alongside existing in-memory cache
2. Dual-write to both systems
3. Gradually migrate read operations to database
4. Remove in-memory cache once stable

### **Step 2: Data Migration**
```javascript
// scripts/migrate-cache-to-db.js
async function migrateCacheToDatabase() {
  const analyses = cacheManager.getAllAnalyses();
  
  for (const analysis of analyses) {
    await db.query(
      `INSERT INTO analyses (id, url, analysis_data, created_at) 
       VALUES ($1, $2, $3, $4)`,
      [analysis.id, analysis.url, analysis.data, analysis.timestamp]
    );
  }
}
```

### **Step 3: Frontend Updates**
- Add authentication components
- Update API calls to include auth tokens
- Add user dashboard and project management
- Implement usage tracking and limits

---

## ✅ **Success Metrics**

1. **Technical Metrics**
   - Database response time < 100ms
   - 99.9% uptime
   - < 5 second analysis completion

2. **Business Metrics**
   - User registration rate
   - Free to paid conversion (target: 5-10%)
   - Monthly active users
   - Customer support tickets

3. **User Experience**
   - Session duration
   - Feature adoption rate
   - User satisfaction scores

---

This implementation plan provides a solid foundation for production deployment focused on small customers while maintaining cost-effectiveness and simplicity. The modular approach allows for gradual implementation and testing at each phase.