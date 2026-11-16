const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    programmeType: {
      type: String,
      enum: ["Seminar", "Training", "Workshop", "Conference", "Outreach", "Community Engagement", "Mentorship", "others"],
    },
    location: {
      type: String,
      required: true,
    },
    objective: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled', 'Ongoing'],
      default: 'Pending',
    },
    coordinator: {
      type: String,
      required: false,
    },
    duration: {
      type: String,
      required: false,
    },
    participant: {
      type: Number,
      required: true,
    },
    beneficiary: {
      type: String,
      required: true,
      default: 'Entire communities across Oyo State.',
    },
    registrationFee: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

programSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Program", programSchema);
