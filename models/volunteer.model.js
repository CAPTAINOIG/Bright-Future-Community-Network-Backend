const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  community: {
    type: String,
    required: true,
    trim: true,
  },
  skills: {
    type: [String],
    required: true,
    default: undefined,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'At least one skill is required',
    },
  },
  availability: {
    type: String,
    required: true,
    trim: true,
  },
  experience: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
},
{
  timestamps: true,
},
);

volunteerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Volunteer', volunteerSchema);
