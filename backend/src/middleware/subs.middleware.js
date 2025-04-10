const subscriptionMiddleware = (req, res, next) => {
  if (!req.user.subscription) {
    return res.status(403).json({ error: 'Subscription required for accessing chat' });
  }
  next();
};

export default subscriptionMiddleware;
