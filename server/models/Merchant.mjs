import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, },
  name: { type: String, default: 'Default API Key', },
  isActive: { type: Boolean, default: true, },
  createdAt: { type: Date, default: Date.now, }
});

const merchantSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide a name'], trim: true, maxlength: [50, 'Name cannot be more than 50 characters'], },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email',],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  apiKeys: [apiKeySchema],
  resetPasswordOtp: String,
  resetPasswordExpires: Date,
  isVerified: { type: Boolean, default: false, }, // Could be used in future for email verification
  callbackUrl: { type: String, trim: true, default: '', },
  webhookSecret: { type: String, default: '', },
  role: { type: String, enum: ['merchant'], default: 'merchant', },
  walletBalance: { type: Number, default: 0, },
  totalReceived: { type: Number, default: 0, },
  totalWithdrawals: { type: Number, default: 0, },
  upiPool: [
    {
      upiId: { type: String, required: true, trim: true, },
      isActive: { type: Boolean, default: true, },
      dailyLimit: { type: Number, default: 100000, },
      currentVolume: { type: Number, default: 0, },
    }
  ],
},
  {
    timestamps: true,
  }
);

const Merchant = mongoose.model('Merchant', merchantSchema);
export default Merchant;
