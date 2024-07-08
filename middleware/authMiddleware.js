// Protected Middleware
const jwt = require('jsonwebtoken');

export const verifyToken = (req, res, next) => {

    const token = req.headers['authorization']?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ status: 'Forbidden', message: 'No token provided' });
    }
  
    // token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET, (err, decoded) => { 
      if (err) {
        return res.status(500).json({ status: 'Failed', message: 'Failed to authenticate token' });
      }
  
      req.userId = decoded.userId;
      next();
    });
  };

