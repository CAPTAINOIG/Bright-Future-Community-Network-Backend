const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['member_registered', 'volunteer_applied', 'project_updated', 'event_opened', 'news_published', 'news_collected', 'news_status_changed'],
  },
  content: {
    type: String,
    required: true,
  },
  performedBy: {
    type: String, // Can be a name or a reference
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Activity', activitySchema);
