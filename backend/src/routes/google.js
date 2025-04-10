import express from 'express';
import { getAuthUrl, getTokens } from '../lib/googleOAuth.js';
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Endpoint to get the Google OAuth URL
router.get('/auth-url', protectRoute, (req, res) => {
  const url = getAuthUrl();
  res.json({ url });
});

// Endpoint to handle OAuth callback; expects a "code" query parameter
router.get('/callback', protectRoute, async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: 'Code not provided' });
  }
  try {
    const tokens = await getTokens(code);
    req.user.googleTokens = tokens;
    await req.user.save();

    // Redirect to the frontend with a success flag
    res.redirect('http://localhost:5173/todo?google_connected=true');
  } catch (error) {
    // Redirect to frontend with an error flag
    res.redirect(`http://localhost:5173/todo?google_error=${error.message}`);
  }
});

router.post('/disconnect', protectRoute, async (req, res) => {
  try {
    req.user.googleTokens = undefined;
    await req.user.save();
    res.json({ message: "Google Calendar disconnected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

