# Travel Health Platform - Backend

This is the backend server for the Travel Health Platform, built with Node.js, Express, TypeScript, and MongoDB.

## Prerequisites

- Node.js (v18 or later)
- MongoDB
- npm or yarn

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   ./scripts/setup-env.sh
   ```
   Then edit the `.env` file with your actual credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Deployment

### Render Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Set all required variables in Render dashboard

### Environment Variables

Required environment variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `SENTRY_DSN` - Sentry DSN for error tracking
- `LOG_LEVEL` - Winston logger level
- `CLIENT_URL` - Frontend URL for CORS
- `SMTP_*` - SMTP settings for email
- `EMAIL_FROM` - Sender email address

## API Documentation

### Health Check

- GET `/api/health` - Check server health status

### Authentication

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password with token

## WebSocket Events

- `connection` - Client connects
- `disconnect` - Client disconnects
- `subscribe:job` - Subscribe to job updates
- `unsubscribe:job` - Unsubscribe from job updates

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License.
