import express from 'express';
import { createSubscription } from '../controllers/subscriptionController.js';
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post('/', createSubscription);

export default router;
