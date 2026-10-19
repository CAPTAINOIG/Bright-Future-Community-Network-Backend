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
    enum: ['Planned', 'Ongoing', 'Completed', 'On Hold'],
    default: 'Planned',
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
  image: {
    type: String,
    trim: true,
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
