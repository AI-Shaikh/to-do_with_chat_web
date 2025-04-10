import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js"; 
import { getMessages, sendMessage, getUsersForSidebar } from "../controllers/chatController.js";
import subscriptionMiddleware from '../middleware/subs.middleware.js';

const router =express.Router();

router.get("/user", protectRoute,subscriptionMiddleware, getUsersForSidebar);

router.get("/:id",protectRoute,subscriptionMiddleware, getMessages);

router.post("/send/:id",protectRoute,subscriptionMiddleware, sendMessage);

export default router;