import express from 'express';
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from '../controllers/todoController.js';

const router = express.Router();

// Apply protectRoute middleware to all routes
router.use(protectRoute);

router.get('/', getTodos);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

export default router;
