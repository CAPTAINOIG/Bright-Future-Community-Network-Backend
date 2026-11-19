const mongoose = require('mongoose');

const programRegistrationSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
      unique: true,
    },
    community: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    consentAt: {
      type: Date,
      required: true,
    },
    attended: {
      type: Boolean,
      default: false,
    },
    isActive: {
    type: Boolean,
    default: true,
  },
  },
  { timestamps: true },
);

programRegistrationSchema.index({ program: 1, email: 1 }, { unique: true });

programRegistrationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('ProgramRegistration', programRegistrationSchema);
