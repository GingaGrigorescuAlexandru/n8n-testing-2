require('dotenv').config();

const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
};

if (process.env.NODE_ENV === 'production' && authConfig.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
  console.warn('WARNING: Using default JWT secret in production. Please set JWT_SECRET environment variable.');
}

module.exports = authConfig;