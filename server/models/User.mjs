import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'user'],
      default: 'user'
    },
    permissions: {
      type: [String],
      default: []
    },
    customRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    // --- KYC Fields ---
    kycStatus: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending'
    },
    kycDocuments: [
      {
        docType: { type: String, enum: ['Aadhar', 'PAN', 'Other'] },
        url: { type: String }
      }
    ],
    kycRejectionReason: { type: String, default: '' },
    // --- Merchant specific fields ---
    apiKey: { type: String, default: '' },
    businessName: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' },
    callbackUrl: { type: String, trim: true, default: '' },
    webhookSecret: { type: String, default: '' },
    walletBalance: { type: Number, default: 0 },
    frozenAmount: { type: Number, default: 0 },
    frozenDetails: [
      {
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    isVip: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isPayinEnabled: { type: Boolean, default: true },
    isPayoutEnabled: { type: Boolean, default: true },
    totalReceived: { type: Number, default: 0 },
    totalWithdrawals: { type: Number, default: 0 },
    upiPool: [
      {
        upiId: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: true },
        dailyLimit: { type: Number, default: 100000 },
        currentVolume: { type: Number, default: 0 },
      }
    ],
    commission: {
      payin: {
        percent: { type: Number, default: 10 }, // Default 10%
        flat: { type: Number, default: 0 }      // Default ₹0
      },
      payout: {
        percent: { type: Number, default: 3 },  // Default 3%
        flat: { type: Number, default: 10 }     // Default ₹10
      }
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
