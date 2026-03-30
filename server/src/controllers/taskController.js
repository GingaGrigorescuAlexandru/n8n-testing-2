const { Op } = require('sequelize');
const { Task } = require('../models');

/**
 * Create a new task
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    // Validate input
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.',
      });
    }

    if (title.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Task title must be less than 255 characters.',
      });
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be one of: low, medium, high.',
      });
    }

    // Validate status if provided
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: pending, in_progress, completed.',
      });
    }

    // Validate dueDate if provided
    if (dueDate && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid due date.',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      status: status || 'pending',
      completed: false,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tasks for the authenticated user
 * GET /api/tasks
 * Supports query params: status, priority, search, sortBy, order, page, limit
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      completed,
      search,
      sortBy = 'createdAt',
      order = 'DESC',
      page = 1,
      limit = 20,
    } = req.query;

    // Build where clause
    const where = { userId: req.user.id };

    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (validStatuses.includes(status)) {
        where.status = status;
      }
    }

    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(priority)) {
        where.priority = priority;
      }
    }

    if (completed !== undefined) {
      where.completed = completed === 'true';
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Validate sort parameters
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'priority', 'dueDate', 'status'];
    const validOrders = ['ASC', 'DESC'];
    const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sanitizedOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      order: [[sanitizedSortBy, sanitizedOrder]],
      limit: limitNum,
      offset,
    });

    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single task by ID
 * GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
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
 * Update a task
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, status, completed } = req.body;

    const task = await Task.findOne({
      where: { id, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    // Validate title if provided
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot be empty.',
        });
      }
      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Task title must be less than 255 characters.',
        });
      }
      task.title = title.trim();
    }

    // Validate priority if provided
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be one of: low, medium, high.',
        });
      }
      task.priority = priority;
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be one of: pending, in_progress, completed.',
        });
      }
      task.status = status;
      // Auto-set completed based on status
      if (status === 'completed') {
        task.completed = true;
      }
    }

    if (description !== undefined) {
      task.description = description ? description.trim() : null;
    }

    if (dueDate !== undefined) {
      if (dueDate && isNaN(Date.parse(dueDate))) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid due date.',
        });
      }
      task.dueDate = dueDate || null;
    }

    if (completed !== undefined) {
      task.completed = Boolean(completed);
      if (completed && task.status !== 'completed') {
        task.status = 'completed';
      }
      if (!completed && task.status === 'completed') {
        task.status = 'pending';
      }
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    await task.destroy();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle task completion status
 * PATCH /api/tasks/:id/toggle
 */
const toggleTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    task.completed = !task.completed;
    task.status = task.completed ? 'completed' : 'pending';
    await task.save();

    return res.status(200).json({
      success: true,
      message: `Task marked as ${task.completed ? 'completed' : 'pending'}.`,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task statistics for the dashboard
 * GET /api/tasks/stats
 */
const getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const total = await Task.count({ where: { userId } });
    const completed = await Task.count({ where: { userId, completed: true } });
    const pending = await Task.count({ where: { userId, status: 'pending' } });
    const inProgress = await Task.count({ where: { userId, status: 'in_progress' } });
    const highPriority = await Task.count({ where: { userId, priority: 'high', completed: false } });

    const overdue = await Task.count({
      where: {
        userId,
        completed: false,
        dueDate: {
          [Op.lt]: new Date(),
          [Op.ne]: null,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          completed,
          pending,
          inProgress,
          highPriority,
          overdue,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTask,
  getTaskStats,
};
