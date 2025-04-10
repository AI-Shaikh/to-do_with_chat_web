import express from "express";
import { signup, login, logout, updateProfile, checkAuth } from "../controllers/authController.js"
import {  protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup",signup);

router.post("/login",login);

router.post("/logout",logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute,checkAuth);

// authRoutes.js
router.get('/profile', protectRoute, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    googleTokens: req.user.googleTokens
  });
});

export default router