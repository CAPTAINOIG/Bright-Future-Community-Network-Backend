const activityModel = require("../models/activity.model");
const communityIdeaModel = require("../models/communityidea.model");

class CommunityIdeaService {
  async createCommunityIdea(communityIdea) {
    const {
      name,
      title,
      challenge,
      beneficiary,
      category,
      priority,
      estimatedBudget,
      community,
      solution,
      feasibilityStatus,
    } = communityIdea;
    if (!name || !challenge || !beneficiary || !community || !solution) {
      const err = new Error("All fields are required");
      err.status = 400;
      throw err;
    }
    const communityIdeas = await communityIdeaModel.create({
      name,
      title,
      challenge,
      category,
      feasibilityStatus,
      priority,
      estimatedBudget,
      beneficiary,
      solution,
      community,
    });
    await activityModel.create({
      type: "community_idea_created",
      content: `New community idea: ${name}`,
      performedBy: name,
      relatedId: communityIdeas._id,
    });
    return communityIdeas.toJSON();
  }

  async getCommunityIdea(query = {}) {
    const {
      page = 1,
      search = '',
      limit = 10,
      feasibilityStatus,
      priority,
      category,
    } = query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (String(search).trim()) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { challenge: { $regex: search, $options: "i" } },
        { solution: { $regex: search, $options: "i" } },
        { community: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (feasibilityStatus) {
      filter.feasibilityStatus = feasibilityStatus;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (category) {
      filter.category = category;
    }
    const [communityIdeas, total] = await Promise.all([
      communityIdeaModel
        .find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      communityIdeaModel.countDocuments(filter),
    ]);
    return {
      communityIdeas: communityIdeas.map((v) => v.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCommunityIdeaById (id) {
    const communityIdea = await communityIdeaModel.findById(id)
       if (!communityIdea) {
      const err = new Error("Community idea not found");
      err.status = 404;
      throw err;
    }
    return communityIdea.toJSON();
  }

  async updateCommunityIdea (id, updateData) {
    const communityIdea = await communityIdeaModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!communityIdea) {
      const err = new Error("Community idea not found");
      err.status = 404;
      throw err;
    }
    return communityIdea.toJSON();
  }

  async deleteCommunityIdea (id) {
    const communityIdea = await communityIdeaModel.findByIdAndDelete(id)
    if(!communityIdea) {
      const err = new Error("Community idea not found");
      err.status = 404;
      throw err;
    }
    return { message: 'Community idea deleted successfully', id: id };
  }
}

module.exports = new CommunityIdeaService();