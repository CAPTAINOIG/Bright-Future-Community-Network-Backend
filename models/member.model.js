const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const memberSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  community: {
    type: String,
    required: true,
    trim: true,
  },
  interests: {
    type: [String],
    required: true,
    default: undefined,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'At least one interests is required',
    },
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  skill: {
    type: String,
    required: true,
    default: undefined,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
},
  {
    timestamps: true,
  },
);

memberSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Member', memberSchema); 