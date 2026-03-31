const Task = require('../models/taskModel');
const { validateTaskInput } = require('../utils/validationUtils');

/**
 * @desc    Get all tasks for the authenticated user
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Build query filters
    const where = { userId };

    // Filter by completed status if provided
    if (req.query.completed !== undefined) {
      where.completed = req.query.completed === 'true';
    }

    // Filter by priority if provided
    if (req.query.priority && ['low', 'medium', 'high'].includes(req.query.priority)) {
      where.priority = req.query.priority;
    }

    // Sorting
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
    const orderField = allowedSortFields.includes(sortField) ? sortField : 'createdAt';

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      order: [[orderField, sortOrder]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, priority, dueDate } = req.body;

    // Validate input
    const validationError = validateTaskInput({ title, description, priority, dueDate });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      completed: false,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    next(error);
  }
};

/**
 * @desc    Update an existing task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { title, description, completed, priority, dueDate } = req.body;

    // Validate input if title is being updated
    if (title !== undefined) {
      const validationError = validateTaskInput({ title, description, priority, dueDate });
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }
    }

    // Build update object with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (completed !== undefined) updateData.completed = Boolean(completed);
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate || null;

    await task.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await task.destroy();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle task completion status
 * @route   PATCH /api/tasks/:id/toggle
 * @access  Private
 */
const toggleTaskComplete = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await task.update({ completed: !task.completed });

    return res.status(200).json({
      success: true,
      message: `Task marked as ${task.completed ? 'completed' : 'incomplete'}`,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task statistics for the dashboard
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const totalTasks = await Task.count({ where: { userId } });
    const completedTasks = await Task.count({ where: { userId, completed: true } });
    const pendingTasks = await Task.count({ where: { userId, completed: false } });
    const highPriorityTasks = await Task.count({ where: { userId, priority: 'high', completed: false } });
    const mediumPriorityTasks = await Task.count({ where: { userId, priority: 'medium', completed: false } });
    const lowPriorityTasks = await Task.count({ where: { userId, priority: 'low', completed: false } });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          byPriority: {
            high: highPriorityTasks,
            medium: mediumPriorityTasks,
            low: lowPriorityTasks,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  getTaskStats,
};
