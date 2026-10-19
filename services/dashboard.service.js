const memberModel = require('../models/member.model');
const projectModel = require('../models/projects.model');
const eventModel = require('../models/events.model');
const activityModel = require('../models/activity.model');
const newsModel = require('../models/news.model');
const moment = require('moment');

class DashboardService {
  async getOverviewStats() {
    const [totalMembers, activeMembers, ongoingProjects, upcomingEvents] = await Promise.all([
      memberModel.countDocuments(),
      memberModel.countDocuments({ isActive: true }),
      projectModel.countDocuments({ status: 'Ongoing' }),
      eventModel.countDocuments({ status: 'Upcoming', date: { $gte: new Date() } }),
    ]);

    return {
      totalMembers,
      activeMembers,
      ongoingProjects,
      upcomingEvents,
    };
  }

  async getEngagementData() {
    // Member registrations for the last 7 months
    const engagementData = [];
    for (let i = 6; i >= 0; i--) {
      const startOfMonth = moment().subtract(i, 'months').startOf('month').toDate();
      const endOfMonth = moment().subtract(i, 'months').endOf('month').toDate();
      const monthName = moment().subtract(i, 'months').format('MMM');

      const count = await memberModel.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      engagementData.push({
        month: monthName,
        count,
      });
    }

    return engagementData;
  }

  async getRecentActivities() {
    const activities = await activityModel.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      content: activity.content,
      performedBy: activity.performedBy,
      time: moment(activity.createdAt).fromNow(),
    }));
  }

  async getTopContent() {
    const topNews = await newsModel.find()
      .sort({ views: -1 })
      .limit(3);

    return topNews.map((news, index) => ({
      rank: `0${index + 1}`,
      title: news.title,
      views: news.views,
      likes: news.likes,
    }));
  }

  async getDashboardOverview() {
    const [stats, engagement, recentActivity, topContent] = await Promise.all([
      this.getOverviewStats(),
      this.getEngagementData(),
      this.getRecentActivities(),
      this.getTopContent(),
    ]);

    return {
      stats,
      engagement,
      recentActivity,
      topContent,
    };
  }
}

module.exports = new DashboardService();
