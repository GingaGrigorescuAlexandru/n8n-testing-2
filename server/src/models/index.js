const { Sequelize } = require('sequelize');
const dbConfig = require('../config/dbConfig');

// Initialize Sequelize based on dialect
let sequelize;

if (dbConfig.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage,
    logging: dbConfig.logging || false,
    define: dbConfig.define || {},
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging || false,
      define: dbConfig.define || {},
      pool: dbConfig.pool || {},
      dialectOptions: dbConfig.dialectOptions || {},
    }
  );
}

// Import model definitions
const User = require('./User')(sequelize);
const Task = require('./Task')(sequelize);

// Collect all models
const models = {
  User,
  Task,
};

// Run associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async (options = {}) => {
  try {
    const defaultOptions = { alter: process.env.NODE_ENV === 'development' };
    const syncOptions = { ...defaultOptions, ...options };
    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  ...models,
  testConnection,
  syncDatabase,
};
