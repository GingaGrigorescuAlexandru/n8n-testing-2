const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middlewares/authMiddleware');

// All task routes require authentication
router.use(authenticate);

// Task statistics (must be before /:id to avoid conflict)
router.get('/stats', taskController.getTaskStats);

// CRUD routes
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Toggle task completion
router.patch('/:id/toggle', taskController.toggleTask);

module.exports = router;
