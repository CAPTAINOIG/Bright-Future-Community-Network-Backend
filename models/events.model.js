const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Past', 'Cancelled'],
    default: 'Upcoming',
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

eventSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Event', eventSchema);
