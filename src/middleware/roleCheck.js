module.exports = (allowedTypes) => (req, res, next) => {
  if (!allowedTypes.includes(req.user.type)) {
    return res.status(403).json({ 
      error: `Requires ${allowedTypes.join('/')} role` 
    });
  }
  next();
};