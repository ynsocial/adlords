#!/bin/bash

# Create .env file if it doesn't exist
touch .env

# Add environment variables
cat > .env << EOL
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/travel-health

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Sentry Configuration
SENTRY_DSN=your_sentry_dsn_here

# Logging Configuration
LOG_LEVEL=debug

# CORS Configuration
CLIENT_URL=http://localhost:3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
EMAIL_FROM=Travel Health <noreply@travel-health.com>
EOL

echo "Environment variables have been set up in .env file"
echo "Please update the values with your actual credentials"
