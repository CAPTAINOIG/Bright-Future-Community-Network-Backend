const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Planning', 'Fundraising', 'Active', 'Cancelled', 'Ongoing', 'Completed', 'On Hold'],
    default: 'Planning',
  },
  budget: {
    type: Number,
    default: 0,
    min: 0,
  },
  category: {
    type: String,
    enum: ['Education', 'HealthCare', 'Welfare', 'Community Development', 'Youth Empowerment', 'Women Empowerment', 'Environment', 'Infrastructure', 'Food', 'Shelter', 'Other'],
    default: 'Other',
  },
  targetBeneficiaries: {
    type: Number,
    default: 0,
    min: 0,
  },
  projectLead: {
    type: String,
    trim: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
},
{
  timestamps: true,
},
);

projectSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Project', projectSchema);
