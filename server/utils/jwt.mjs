import jwt from 'jsonwebtoken';
const JWTTokenSecret = 'GetwayJWTSecretKey';

export const generateAccessToken = (userId, deviceId) => {
    return jwt.sign({ userId, deviceId }, JWTTokenSecret, { expiresIn: '35m', algorithm: "HS256" }); // Token valid for 35 minutes
};

export const generateRefreshToken = (userId, deviceId, data) => {
    return jwt.sign({ userId, deviceId, data }, JWTTokenSecret, { expiresIn: '360d' }); // Token valid for 360 days
};

export const resetPasswordToken = (userId, deviceId) => {
    return jwt.sign({ userId, deviceId }, JWTTokenSecret, { expiresIn: '360d' }); // Token valid for 360 days
};
export const verifyToken = (token) => {
    return jwt.verify(token, JWTTokenSecret);
};
