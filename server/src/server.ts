import mongoose from 'mongoose';
import { app, server } from './app';
import { logInfo, logError } from './config/logger';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-health';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    logInfo('Connected to MongoDB');
    
    // Start server
    server.listen(PORT, () => {
      logInfo(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logError(error as Error, { context: 'MongoDB Connection' });
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(error, { context: 'Uncaught Exception' });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logError(reason as Error, { context: 'Unhandled Rejection' });
  process.exit(1);
});
