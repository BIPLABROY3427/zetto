import jwt from 'jsonwebtoken';

// Always read secret from environment – never hardcode
const JWTTokenSecret = process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET;

if (!JWTTokenSecret) {
    throw new Error('❌ JWT_SECRET is missing in environment variables');
}

export const generateAccessToken = (userId, deviceId) => {
    return jwt.sign({ userId, deviceId }, JWTTokenSecret, { expiresIn: '35m', algorithm: "HS256" });
};

export const generateRefreshToken = (userId, deviceId, data) => {
    return jwt.sign({ userId, deviceId, data }, JWTTokenSecret, { expiresIn: '360d' });
};

export const resetPasswordToken = (userId, deviceId) => {
    return jwt.sign({ userId, deviceId }, JWTTokenSecret, { expiresIn: '15m' }); // was '360d' — fixed
};

export const verifyToken = (token) => {
    return jwt.verify(token, JWTTokenSecret);
};
