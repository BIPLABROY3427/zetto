import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: false, // true for hardcoded 'Super Admin' role
    },
    permissions: {
      // Structure: { moduleName: { view: true, create: false, edit: false, delete: false } }
      type: Map,
      of: new mongoose.Schema({
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      }, { _id: false }),
      default: {}
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Role', roleSchema);
