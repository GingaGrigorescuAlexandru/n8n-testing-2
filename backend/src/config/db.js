const { Sequelize } = require('sequelize');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'todo_app';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_DIALECT = 'postgres';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

// Define Models
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
    },
  },
  email: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'users',
});

const Task = sequelize.define('Task', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: Sequelize.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200],
    },
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  completed: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  priority: {
    type: Sequelize.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  category: {
    type: Sequelize.STRING(50),
    allowNull: true,
    defaultValue: 'general',
  },
  dueDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
    field: 'due_date',
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'tasks',
});

// Associations
User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Task,
};