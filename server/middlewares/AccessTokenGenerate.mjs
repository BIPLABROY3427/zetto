import Users from "../models/Users.mjs";
import { verifyToken } from '../utils/jwt.mjs';

export const LoginCheck = async (req, res, next) => {
    try {
        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader !== 'undefined') {
            const bearer = bearerHeader.split(' ');
            const bearerToken = bearer[1];
            req.token = bearerToken;
            const { userId, data } = await verifyToken(bearerToken);
            const userCheck = await Users.findById(userId);
            if (!userCheck || !(userCheck.password == Buffer.from(data, 'base64').toString('utf-8'))) {
                return res.status(401).json({ status: false, message: 'Invalid credentials', action: 'logout' });
            }
            req.userId = userId;
            next();
        } else {
            return res.status(401).json({ status: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        return res.status(500).json({ status: false, message: "logout" });
    }
};
