require('dotenv').config();

const config = {
  // Server configuration
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'todo_app',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Bcrypt salt rounds
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
};

// Validate critical configuration in production
if (config.nodeEnv === 'production') {
  const requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD', 'DB_NAME', 'DB_USER'];
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
    console.error('❌ JWT_SECRET must be changed from default value in production.');
    process.exit(1);
  }
}

module.exports = config;