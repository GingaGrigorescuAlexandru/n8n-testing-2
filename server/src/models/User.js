const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Username already exists.',
      },
      validate: {
        notNull: { msg: 'Username is required.' },
        notEmpty: { msg: 'Username cannot be empty.' },
        len: {
          args: [3, 50],
          msg: 'Username must be between 3 and 50 characters.',
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        msg: 'Email already exists.',
      },
      validate: {
        notNull: { msg: 'Email is required.' },
        notEmpty: { msg: 'Email cannot be empty.' },
        isEmail: { msg: 'Please provide a valid email address.' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Password is required.' },
        notEmpty: { msg: 'Password cannot be empty.' },
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters long.',
        },
      },
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'last_name',
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
    },
  });

  // Instance method to compare passwords
  User.prototype.comparePassword = async function (candidatePassword) {
    // Need to fetch with password since default scope excludes it
    const userWithPassword = await User.scope('withPassword').findByPk(this.id);
    if (!userWithPassword) return false;
    return bcrypt.compare(candidatePassword, userWithPassword.password);
  };

  // Instance method to return safe user object (without password)
  User.prototype.toSafeObject = function () {
    const { id, username, email, firstName, lastName, created_at, updated_at } = this.toJSON();
    return { id, username, email, firstName, lastName, created_at, updated_at };
  };

  // Class method to find user by email with password
  User.findByEmailWithPassword = async function (email) {
    return User.scope('withPassword').findOne({ where: { email } });
  };

  // Define associations
  User.associate = (models) => {
    User.hasMany(models.Task, {
      foreignKey: 'user_id',
      as: 'tasks',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return User;
};
