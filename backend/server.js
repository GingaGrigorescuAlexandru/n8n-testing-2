require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Import models and set up associations
const User = require('./models/userModel')(sequelize);
const Task = require('./models/taskModel')(sequelize);

// Define associations
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Make sequelize and models accessible in routes via req.app
app.set('sequelize', sequelize);
app.set('models', { User, Task });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models with database (use { alter: true } in development)
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized (alter mode).');
    } else {
      await sequelize.sync();
      console.log('✅ Database models synchronized.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;