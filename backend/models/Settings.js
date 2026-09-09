import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    retentionPeriod: {
      type: Number,
      default: 3,
      min: 1
    },
    retentionUnit: {
      type: String,
      enum: ['months', 'days'],
      default: 'months'
    },
    billingCycle: {
      type: String,
      enum: ['10days', '15days', 'monthly', 'custom'],
      default: '10days'
    },
    settlementDay: {
      type: Number,
      default: 10
    },
    dairyName: {
      type: String,
      default: 'GDairy Central',
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
