import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import mongoose from 'mongoose';
import User from '../models/User.mjs';
import Transaction from '../models/Transaction.mjs';
import { logActivity } from '../services/activityLogger.mjs';
import { moderateImage } from '../services/MediaModerationService.mjs';

// Get all users
// Accessible by: admin, staff
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = {};
    if (search.trim() !== '') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    const skipAmount = (parseInt(page) - 1) * parseInt(limit);

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('customRole')
        .sort({ createdAt: -1 })
        .skip(skipAmount)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({ 
      status: true, 
      users,
      pagination: {
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ status: false, message: 'Server error fetching users' });
  }
};

// Update user role
// Accessible by: admin only
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    let finalRole = role;
    let finalCustomRole = null;

    // Check if the provided role is actually an ObjectId (a Custom Role)
    if (role && mongoose.Types.ObjectId.isValid(role) && role.length === 24) {
      finalRole = 'admin';
      finalCustomRole = role;
    } else {
      const validRoles = ['superadmin', 'admin', 'user'];
      if (!validRoles.includes(finalRole)) {
        return res.status(400).json({ status: false, message: 'Invalid role' });
      }
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ status: false, message: 'User not found' });

    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ status: false, message: 'Cannot modify superadmin role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: finalRole, customRole: finalCustomRole },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    res.status(200).json({ status: true, message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ status: false, message: 'Server error updating user role' });
  }
};

// Delete user
// Accessible by: admin only
export const deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ status: false, message: 'User not found' });
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ status: false, message: 'Cannot delete superadmin' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ status: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ status: false, message: 'Server error deleting user' });
  }
};

// Update user permissions (e.g. commission rate)
// Accessible by: admin, superadmin
// Helper for granular permissions
const hasPerm = (req, mod, action) => {
  if (req.user.role === 'superadmin') return true;
  if (!req.user.customRole || !req.user.customRole.permissions) return false;
  return req.user.customRole.permissions.get(mod)?.[action] === true;
};

export const updateUserPermissions = async (req, res) => {
  try {
    const { commission, role, customRole, permissions, isActive, isVip, frozenDetails, isPayinEnabled, isPayoutEnabled, name, email, businessName, website, phoneNumber } = req.body;

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ status: false, message: 'User not found' });

    const updateData = {};
    const needsUserMgmtPerm = (
      commission !== undefined || permissions !== undefined || customRole !== undefined || 
      isPayinEnabled !== undefined || isPayoutEnabled !== undefined || 
      name || email || businessName || website || phoneNumber || role
    );

    if (needsUserMgmtPerm && !hasPerm(req, 'User Management', 'edit')) {
      return res.status(403).json({ status: false, message: 'You do not have permission to edit user profile data' });
    }

    if (commission) updateData.commission = commission;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (customRole !== undefined) updateData.customRole = customRole || null;

    if (isActive !== undefined) {
      if (!hasPerm(req, 'User Ban/Unban', 'edit')) {
        return res.status(403).json({ status: false, message: 'You do not have permission to ban or unban users' });
      }
      if (targetUser.role === 'superadmin' && isActive === false) {
        return res.status(403).json({ status: false, message: 'Cannot deactivate superadmin' });
      }
      updateData.isActive = isActive;
    }

    if (isVip !== undefined) {
      if (!hasPerm(req, 'VIP Management', 'edit')) {
        return res.status(403).json({ status: false, message: 'You do not have permission to manage VIP status' });
      }
      updateData.isVip = isVip;
    }

    let netChange = 0;
    if (frozenDetails !== undefined && Array.isArray(frozenDetails)) {
      if (!hasPerm(req, 'User Freeze/Unfreeze', 'edit')) {
        return res.status(403).json({ status: false, message: 'You do not have permission to freeze or unfreeze funds' });
      }
      updateData.frozenDetails = frozenDetails;
      const newFrozenAmount = frozenDetails.reduce((sum, detail) => sum + (Number(detail.amount) || 0), 0);
      updateData.frozenAmount = newFrozenAmount;
      netChange = newFrozenAmount - (targetUser.frozenAmount || 0);
      if (netChange !== 0) {
        updateData.walletBalance = (targetUser.walletBalance || 0) - netChange;
      }
    }

    if (isPayinEnabled !== undefined) updateData.isPayinEnabled = isPayinEnabled;
    if (isPayoutEnabled !== undefined) updateData.isPayoutEnabled = isPayoutEnabled;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (businessName !== undefined) updateData.businessName = businessName;
    if (website !== undefined) updateData.website = website;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    // Only allow role change if they are not superadmin, and not upgrading to superadmin
    if (role && targetUser.role !== 'superadmin' && role !== 'superadmin') {
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    if (netChange !== 0) {
      await Transaction.create({
        merchantId: user._id,
        transactionId: (netChange > 0 ? 'FRZ_' : 'UFRZ_') + Date.now() + Math.floor(Math.random() * 1000),
        type: netChange > 0 ? 'freeze' : 'unfreeze',
        amount: Math.abs(netChange),
        status: 'completed',
        description: netChange > 0 ? 'Funds frozen by admin' : 'Frozen funds released by admin'
      });
    }

    res.status(200).json({ status: true, message: 'Permissions updated successfully', user });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ status: false, message: 'Server error updating permissions' });
  }
};

// Get user specific transactions
// Accessible by: admin, superadmin
export const getUserTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, page = 1, limit = 10 } = req.query;

    let query = { merchantId: id };
    if (type && type !== 'all') {
      query.type = type;
    }

    const skipAmount = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skipAmount)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.status(200).json({ 
      status: true, 
      data: transactions,
      pagination: {
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting user transactions:', error);
    res.status(500).json({ status: false, message: 'Server error fetching user transactions' });
  }
};

// Create a new user (Directly by Admin/Superadmin without OTP)
// Accessible by: superadmin
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let finalRole = role || 'user';
    let finalCustomRole = null;

    // Check if the provided role is actually an ObjectId (a Custom Role)
    if (role && mongoose.Types.ObjectId.isValid(role) && role.length === 24) {
      finalRole = 'admin'; // Custom roles are assigned to admins
      finalCustomRole = role;
    }

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: true, // Auto verified
      role: finalRole,
      customRole: finalCustomRole,
      apiKey: crypto.randomBytes(8).toString('hex')
    });

    res.status(201).json({ status: true, message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ status: false, message: 'Server error creating user' });
  }
};

// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('customRole');
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }
    res.status(200).json({ status: true, user });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ status: false, message: 'Server error getting profile' });
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
export const updateMyProfile = async (req, res) => {
  try {
    const { name, businessName, website, phoneNumber } = req.body;

    // Email cannot be updated without verification, so we don't allow it here

    const updateData = {};
    if (name) updateData.name = name;
    if (businessName !== undefined) updateData.businessName = businessName;
    if (website !== undefined) updateData.website = website;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

    // Log Activity
    logActivity(req.user._id, 'profile_update', 'Updated personal or business profile', req);

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ status: false, message: 'Server error updating profile' });
  }
};

// @desc    Update commission for all merchants (bulk update)
// @route   PUT /api/v1/users/bulk-commission
// @access  Superadmin
export const updateAllUsersCommission = async (req, res) => {
  try {
    const { commission, includeVip } = req.body;

    if (!commission || !commission.payin || !commission.payout) {
      return res.status(400).json({ status: false, message: 'Invalid commission format' });
    }

    const filter = {};
    if (!includeVip) {
      filter.isVip = { $ne: true };
    }

    const result = await User.updateMany(
      filter,
      { $set: { commission } }
    );

    res.status(200).json({
      status: true,
      message: `Commission updated for ${result.modifiedCount} users successfully`
    });
  } catch (error) {
    console.error('Error updating bulk commission:', error);
    res.status(500).json({ status: false, message: 'Server error updating bulk commission' });
  }
};

// Upload KYC Document
export const uploadKYC = async (req, res) => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');

    // Ensure upload dir exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      let tempFilePath = null;
      try {
        if (err) {
          return res.status(400).json({ status: false, message: 'File upload error' });
        }

        const docType = Array.isArray(fields.docType) ? fields.docType[0] : fields.docType;
        const file = Array.isArray(files.document) ? files.document[0] : files.document;

        if (!docType || !file) {
          return res.status(400).json({ status: false, message: 'Document type and file are required' });
        }

        tempFilePath = file.filepath;

        // Moderate image for NSFW content
        await moderateImage(tempFilePath);

        // Generate safe random filename
        const safeFilename = crypto.randomBytes(16).toString('hex') + '.webp';
        const finalPath = path.join(uploadDir, safeFilename);

        // Process image with Sharp (compress and convert to webp)
        const imageProcessor = sharp(tempFilePath);
        const metadata = await imageProcessor.metadata();

        if (!metadata.width || !metadata.height || metadata.width > 10000 || metadata.height > 10000) {
          throw new Error('Image dimensions are invalid or too large');
        }

        await imageProcessor
          .withMetadata(false)
          .webp({ quality: 80, effort: 4 })
          .toFile(finalPath);

        const fileUrl = `/uploads/${safeFilename}`;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ status: false, message: 'User not found' });

        // Clean up old images if they exist before uploading new one
        if (user.kycDocuments && user.kycDocuments.length > 0) {
          user.kycDocuments.forEach(doc => {
            if (doc.url) {
              const oldFilePath = path.join(process.cwd(), doc.url);
              if (fs.existsSync(oldFilePath)) {
                try {
                  fs.unlinkSync(oldFilePath);
                } catch (e) {
                  console.error('Error deleting old KYC document:', e);
                }
              }
            }
          });
        }

        user.kycDocuments = [{ docType, url: fileUrl }]; // Reset and add new
        user.kycStatus = 'submitted';
        await user.save();

        res.status(200).json({
          status: true,
          message: 'KYC document uploaded successfully',
          kycStatus: user.kycStatus,
          kycDocuments: user.kycDocuments
        });
      } catch (innerError) {
        console.warn(`[KYC Upload] ${innerError.message}`);
        res.status(400).json({ status: false, message: innerError.message || 'Error processing document' });
      } finally {
        // Always clean up the temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (cleanupErr) {
            console.error('Failed to clean up temp file:', cleanupErr);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error uploading KYC:', error);
    res.status(500).json({ status: false, message: 'Server error during KYC upload' });
  }
};
// Approve KYC
export const approveKYC = async (req, res) => {
  try {
    if (!hasPerm(req, 'KYC Verification', 'edit')) {
      return res.status(403).json({ status: false, message: 'You do not have permission to verify KYC' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: false, message: 'User not found' });

    user.kycStatus = 'approved';
    user.kycRejectionReason = ''; // Clear reason on approval
    await user.save();

    res.status(200).json({ status: true, message: 'KYC approved successfully', user });
  } catch (error) {
    console.error('Error approving KYC:', error);
    res.status(500).json({ status: false, message: 'Server error approving KYC' });
  }
};

// Reject KYC
export const rejectKYC = async (req, res) => {
  try {
    if (!hasPerm(req, 'KYC Verification', 'edit')) {
      return res.status(403).json({ status: false, message: 'You do not have permission to verify KYC' });
    }
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ status: false, message: 'Rejection reason is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: false, message: 'User not found' });

    // Clean up old images from storage
    if (user.kycDocuments && user.kycDocuments.length > 0) {
      user.kycDocuments.forEach(doc => {
        if (doc.url) {
          // doc.url is like "/uploads/ymn2jojjnrl7krmn2tysv0ydq.png"
          const filePath = path.join(process.cwd(), doc.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }

    user.kycStatus = 'rejected';
    user.kycRejectionReason = reason;
    user.kycDocuments = []; // Clear database array
    await user.save();

    res.status(200).json({ status: true, message: 'KYC rejected successfully', user });
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    res.status(500).json({ status: false, message: 'Server error rejecting KYC' });
  }
};
