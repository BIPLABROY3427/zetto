import User from '../models/User.mjs';

// Get all users
// Accessible by: admin, staff
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('customRole').sort({ createdAt: -1 });
    res.status(200).json({ status: true, users });
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
    const allowedRoles = ['admin', 'user']; // Cannot make new superadmin this way
    
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ status: false, message: 'Invalid role' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ status: false, message: 'User not found' });

    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ status: false, message: 'Cannot modify superadmin role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
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
export const updateUserPermissions = async (req, res) => {
  try {
    const { commission, role, customRole, permissions, isActive, isVip, frozenAmount, frozenReason, isPayinEnabled, isPayoutEnabled, name, email, businessName, website, phoneNumber } = req.body;
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ status: false, message: 'User not found' });

    const updateData = {};
    if (commission) {
      updateData.commission = commission;
    }
    
    if (permissions !== undefined) {
      updateData.permissions = permissions;
    }

    if (customRole !== undefined) {
      updateData.customRole = customRole || null;
    }

    if (isActive !== undefined) {
      // Don't allow deactivating the superadmin
      if (targetUser.role === 'superadmin' && isActive === false) {
        return res.status(403).json({ status: false, message: 'Cannot deactivate superadmin' });
      }
      updateData.isActive = isActive;
    }

    if (isVip !== undefined) {
      updateData.isVip = isVip;
    }

    if (frozenAmount !== undefined) {
      updateData.frozenAmount = Number(frozenAmount);
      if (Number(frozenAmount) === 0) {
        updateData.frozenReason = '';
      } else if (frozenReason !== undefined) {
        updateData.frozenReason = frozenReason;
      }
    }
    
    if (isPayinEnabled !== undefined) {
      updateData.isPayinEnabled = isPayinEnabled;
    }

    if (isPayoutEnabled !== undefined) {
      updateData.isPayoutEnabled = isPayoutEnabled;
    }

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

    res.status(200).json({ status: true, message: 'Permissions updated successfully', user });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ status: false, message: 'Server error updating permissions' });
  }
};

// Get user specific transactions
// Accessible by: admin, superadmin
import Transaction from '../models/Transaction.mjs';
export const getUserTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'payment' or 'withdrawal'
    
    let query = { merchantId: id };
    if (type) {
      query.type = type;
    }
    
    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ status: true, data: transactions });
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
    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: true, // Auto verified
      role: role || 'user',
      apiKeys: [{
        key: crypto.randomBytes(32).toString('hex'),
        name: 'Default API Key',
        isActive: true,
        createdAt: new Date()
      }]
    });

    res.status(201).json({ status: true, message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ status: false, message: 'Server error creating user' });
  }
};

// @desc    Update current user's profile
// @route   PUT /api/v1/users/profile
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
    const { commission } = req.body;
    
    if (!commission || !commission.payin || !commission.payout) {
      return res.status(400).json({ status: false, message: 'Invalid commission format' });
    }

    // Only update users who are merchants (role='user' or those who use gateway, basically we can update everyone except superadmin maybe? 
    // Or just update everyone, superadmin commission doesn't matter much)
    // Exclude superadmins and VIP users from global commission updates
    const result = await User.updateMany(
      { role: { $ne: 'superadmin' }, isVip: { $ne: true } }, 
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
