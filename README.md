# Travel Health Ambassador Platform

A comprehensive SaaS platform for managing travel health brand ambassador programs.

## Deployment Instructions

### Prerequisites
- Node.js 18 or later
- MongoDB Atlas account
- Redis Cloud account
- GitHub account
- Netlify account
- Render account

### Environment Setup

1. **Server (.env)**
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
```

2. **Client (.env)**
```env
VITE_API_URL=your_api_url
VITE_SOCKET_URL=your_socket_url
```

### Deployment Steps

#### GitHub Setup
1. Create a new repository
2. Push the code to GitHub
3. Set up the following repository secrets:
   - MONGODB_URI
   - REDIS_USERNAME
   - REDIS_PASSWORD
   - REDIS_HOST
   - REDIS_PORT
   - RENDER_API_KEY
   - RENDER_SERVICE_ID
   - NETLIFY_AUTH_TOKEN
   - NETLIFY_SITE_ID

#### Netlify Deployment (Frontend)
1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set environment variables in Netlify dashboard
4. Deploy

#### Render Deployment (Backend)
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select Docker as the environment
4. Configure environment variables
5. Deploy

### Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   # Server
   cd server
   npm install

   # Client
   cd client
   npm install
   ```
3. Start development servers:
   ```bash
   # Server
   npm run dev

   # Client
   npm run dev
   ```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:
- Runs tests for both client and server
- Builds both applications
- Deploys to Netlify (frontend) and Render (backend) on successful builds
- Automated deployments only trigger on the main branch
