const mongoose = require("mongoose");

const communityIdeaSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
    },
    challenge: {
      type: String,
      required: true,
      trim: true,
    },
    solution: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: false,
      trim: true,
    },
    category: {
      type: String,
      required: false,
      enum: ["Health", "Infrastructure", "Education", "Agriculture", "Economic Development"],
      default : "All Categories"
    },
    feasibilityStatus: {
      type: String,
      required: false,
      enum: ["Under Review", "Approved", "Rejected", "Pending"],
      default: "Pending",
    },
    priority: {
      type: String,
      required: false,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    community: {
      type: String,
      required: true,
      default: 0,
    },
    estimatedBudget: {
      type: Number,
      required: false,
    },
    beneficiary: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);
communityIdeaSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("CommunityIdea", communityIdeaSchema);
