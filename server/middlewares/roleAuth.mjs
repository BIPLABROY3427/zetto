import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';

// Verifies the user is logged in (has valid token) and attaches user to req
export const verifyAuth = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.user = await User.findById(decoded.id).populate('customRole');
        
        if (!req.user) {
            return res.status(401).json({ message: 'User belonging to this token no longer exists' });
        }

        if (req.user.isActive === false) {
            return res.status(403).json({ message: 'Your account has been banned. Please contact support for further assistance.' });
        }
        
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
};

// Checks if the logged in user has one of the required roles
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'User role not authorized to access this route' });
        }
        next();
    };
};
