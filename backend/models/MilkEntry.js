import mongoose from 'mongoose';

const milkEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: String, // Stored as YYYY-MM-DD string to avoid timezone shifts
      required: [true, 'Date is required'],
      index: true
    },
    session: {
      type: String,
      enum: ['morning', 'evening'],
      required: [true, 'Session is required']
    },
    litres: {
      type: Number,
      required: [true, 'Milk litres is required'],
      min: [0.01, 'Litres must be greater than 0']
    },
    milkPricePerLitre: {
      type: Number,
      required: [true, 'Milk price per litre is required'],
      min: [0, 'Price per litre cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'credited'],
      default: 'unpaid',
      index: true
    },
    settlementDate: {
      type: String,
      default: null
    },
    dairyName: {
      type: String,
      default: 'GDairy Central',
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast period queries and duplicate prevention per user/session/date if needed
milkEntrySchema.index({ user: 1, date: -1, session: 1 });
milkEntrySchema.index({ date: -1, session: 1 });
milkEntrySchema.index({ user: 1, createdAt: -1 });

const MilkEntry = mongoose.model('MilkEntry', milkEntrySchema);
export default MilkEntry;
