import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Redis Client Setup
const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '11296')
  }
});

redisClient.on('error', err => console.error('Redis Client Error:', err));
redisClient.connect().catch(console.error);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI!, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  
  // Create indexes for collections
  const db = mongoose.connection;
  Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('companies').createIndex({ name: 1 }),
    db.collection('ambassadors').createIndex({ email: 1 }, { unique: true }),
    db.collection('jobs').createIndex({ status: 1, createdAt: -1 }),
    db.collection('applications').createIndex({ jobId: 1, ambassadorId: 1 }),
    db.collection('tasks').createIndex({ applicationId: 1, status: 1 }),
    db.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 })
  ]).then(() => {
    console.log('Database indexes created successfully');
  }).catch(err => {
    console.error('Error creating database indexes:', err);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
