const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  published: {
    type: Boolean,
    default: true,
  },
},
{
  timestamps: true,
},
);

newsSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('News', newsSchema);
