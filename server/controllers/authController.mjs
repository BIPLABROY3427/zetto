import User from '../models/User.mjs';
import ActivityLog from '../models/ActivityLog.mjs';
import jwt from 'jsonwebtoken';
import { redisClient } from '../config/config.mjs';
import { sendSignupOTP, sendPasswordResetOTP } from '../utils/email.mjs';
import { logActivity } from '../services/activityLogger.mjs';

const generateTokens = (userId) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('❌ JWT_SECRET or JWT_REFRESH_SECRET is missing in environment variables');
  }
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '360d',
  });
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const signupData = { name, email, password, otp };

    // Save to Redis, expire in 10 minutes (600 seconds)
    await redisClient.setEx(`signup:${email}`, 600, JSON.stringify(signupData));

    // Send email
    await sendSignupOTP(email, otp, name);

    res.status(200).json({
      message: 'OTP sent to email. Please verify to complete registration.',
      requireOtp: true,
      email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const storedDataStr = await redisClient.get(`signup:${email}`);
    if (!storedDataStr) {
      return res.status(400).json({ message: 'Session expired. Please sign up again.' });
    }

    const storedData = JSON.parse(storedDataStr);

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    storedData.otp = otp;

    // Refresh Redis timeout (10 mins)
    await redisClient.setEx(`signup:${email}`, 600, JSON.stringify(storedData));

    // Send email
    await sendSignupOTP(email, otp, storedData.name);

    res.status(200).json({ message: 'New OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedDataStr = await redisClient.get(`signup:${email}`);
    if (!storedDataStr) {
      return res.status(400).json({ message: 'OTP expired or invalid session. Please sign up again.' });
    }

    const storedData = JSON.parse(storedDataStr);

    // Track OTP attempts to prevent brute-force
    storedData.attempts = (storedData.attempts || 0) + 1;
    if (storedData.attempts > 5) {
      await redisClient.del(`signup:${email}`);
      return res.status(429).json({ message: 'Too many failed attempts. Please sign up again.' });
    }
    // Write updated attempts back
    await redisClient.setEx(`signup:${email}`, 600, JSON.stringify(storedData));

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: `Invalid OTP (${5 - storedData.attempts + 1} attempts remaining)` });
    }

    // Check if user somehow was created while waiting for OTP
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Auto-assign superadmin if none exists
    const hasSuperAdmin = await User.exists({ role: 'superadmin' });
    const assignRole = hasSuperAdmin ? 'user' : 'superadmin';

    const user = new User({
      name: storedData.name,
      email: storedData.email,
      password: storedData.password,
      role: assignRole
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens.push(refreshToken);

    await user.save();

    // Remove from redis
    await redisClient.del(`signup:${email}`);

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password').populate('customRole');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been banned. Please contact support for further assistance.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save();

    // Format role details to send to frontend
    const userRoleData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.customRole ? user.customRole.toObject({ flattenMaps: true }).permissions : null
    };

    res.status(200).json({
      message: 'Login successful',
      user: userRoleData,
      token: accessToken,
      refreshToken,
    });

    // Log Activity (Non-blocking)
    logActivity(user._id, 'login', 'Successfully logged in to dashboard', req);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: tokenFromRequest } = req.body;

    if (!tokenFromRequest) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    // Optional: Check if token exists in DB (for tracking compromised tokens)
    const userWithToken = await User.findOne({ refreshTokens: tokenFromRequest });

    jwt.verify(tokenFromRequest, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        if (userWithToken) {
           // Token compromised or expired, but let's just reject for now
           userWithToken.refreshTokens = userWithToken.refreshTokens.filter(t => t !== tokenFromRequest);
           await userWithToken.save();
        }
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      if (!userWithToken) {
        return res.status(403).json({ message: 'Invalid refresh token (not found in DB)' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(userWithToken._id);

      // Rotate token
      userWithToken.refreshTokens = userWithToken.refreshTokens.filter((t) => t !== tokenFromRequest);
      userWithToken.refreshTokens.push(newRefreshToken);
      await userWithToken.save();

      res.status(200).json({
        token: accessToken,
        refreshToken: newRefreshToken,
      });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { refreshToken: tokenToInvalidate } = req.body;

    if (userId && tokenToInvalidate) {
      // Properly invalidate the specific refresh token from the database
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: tokenToInvalidate }
      });
    }

    res.status(200).json({ message: 'Logout successful' });

    if (userId) {
      logActivity(userId, 'logout', 'Ended session', req);
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to Redis, expire in 10 minutes
    await redisClient.setEx(`reset:${email}`, 600, otp);

    await sendPasswordResetOTP(email, otp, user.name);

    res.status(200).json({ message: 'Password reset OTP sent to email', requireOtp: true, email });
  } catch (error) {
    console.error('Forgot Password error:', error);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Track OTP attempts to prevent brute-force
    const attemptKey = `reset_attempts:${email}`;
    const attempts = Number(await redisClient.get(attemptKey) || 0);
    if (attempts >= 5) {
      await redisClient.del(`reset:${email}`);
      await redisClient.del(attemptKey);
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    const storedOtp = await redisClient.get(`reset:${email}`);

    if (!storedOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (storedOtp !== otp) {
      await redisClient.incr(attemptKey);
      await redisClient.expire(attemptKey, 600);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    user.refreshTokens = []; // Log out from all devices
    await user.save(); // password hashing is handled by mongoose pre-save hook

    await redisClient.del(`reset:${email}`);

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });

    // Log Activity (Non-blocking)
    logActivity(user._id, 'password_change', 'Password was successfully reset', req);

  } catch (error) {
    console.error('Reset Password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    // Fetch last 50 logs sorted by creation date
    const logs = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('Fetch Activity Logs Error:', error);
    res.status(500).json({ message: 'Internal server error fetching logs' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, currentRefreshToken } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Since we need to compare password, we must fetch user with password selected
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;

    // Log out from all other devices, keep current session if token provided
    if (currentRefreshToken && user.refreshTokens.includes(currentRefreshToken)) {
      user.refreshTokens = [currentRefreshToken];
    } else {
      user.refreshTokens = [];
    }

    await user.save(); // Password hashing is handled by mongoose pre-save hook

    res.status(200).json({ message: 'Password changed successfully' });

    // Log Activity (Non-blocking)
    logActivity(user._id, 'password_change', 'Changed account password', req);

  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Internal server error while changing password' });
  }
};
