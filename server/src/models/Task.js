const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Task title is required.' },
        notEmpty: { msg: 'Task title cannot be empty.' },
        len: {
          args: [1, 255],
          msg: 'Task title must be between 1 and 255 characters.',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'in_progress', 'completed']],
          msg: 'Status must be one of: pending, in_progress, completed.',
        },
      },
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: {
          args: [['low', 'medium', 'high']],
          msg: 'Priority must be one of: low, medium, high.',
        },
      },
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date',
      validate: {
        isDate: { msg: 'Please provide a valid date.' },
      },
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      get() {
        const rawValue = this.getDataValue('tags');
        if (!rawValue || rawValue === '') return [];
        return rawValue.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('tags', value.join(','));
        } else if (typeof value === 'string') {
          this.setDataValue('tags', value);
        } else {
          this.setDataValue('tags', '');
        }
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate: async (task) => {
        // Automatically set completedAt when status changes to completed
        if (task.changed('status') && task.status === 'completed') {
          task.completedAt = new Date();
        }
        // Clear completedAt if status changes away from completed
        if (task.changed('status') && task.status !== 'completed') {
          task.completedAt = null;
        }
      },
      beforeCreate: async (task) => {
        if (task.status === 'completed' && !task.completedAt) {
          task.completedAt = new Date();
        }
      },
    },
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['due_date'],
      },
      {
        fields: ['user_id', 'status'],
      },
    ],
  });

  // Define associations
  Task.associate = (models) => {
    Task.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Task;
};
