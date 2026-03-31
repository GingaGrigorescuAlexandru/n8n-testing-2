const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');

// All task routes require authentication
router.use(authenticate);

// @route   GET /api/tasks
// @desc    Get all tasks for the authenticated user
// @access  Private
router.get('/', taskController.getAllTasks);

// @route   GET /api/tasks/stats
// @desc    Get task statistics for the authenticated user
// @access  Private
router.get('/stats', taskController.getTaskStats);

// @route   GET /api/tasks/:id
// @desc    Get a single task by ID
// @access  Private
router.get('/:id', taskController.getTaskById);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', taskController.createTask);

// @route   PUT /api/tasks/:id
// @desc    Update a task by ID
// @access  Private
router.put('/:id', taskController.updateTask);

// @route   PATCH /api/tasks/:id/toggle
// @desc    Toggle task completion status
// @access  Private
router.patch('/:id/toggle', taskController.toggleTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task by ID
// @access  Private
router.delete('/:id', taskController.deleteTask);

// @route   DELETE /api/tasks
// @desc    Delete all completed tasks for the authenticated user
// @access  Private
router.delete('/completed/clear', taskController.clearCompleted);

module.exports = router;