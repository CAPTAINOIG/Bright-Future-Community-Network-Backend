const projectModel = require("../models/projects.model");
const activityModel = require("../models/activity.model");

class ProjectService {
  async createProject(projectData) {
    const { title, description, status, progress, startDate, endDate, image } = projectData;

    const project = await projectModel.create({
      title,
      description,
      status,
      progress,
      startDate,
      endDate,
      image,
    });

    await activityModel.create({
      type: 'project_updated',
      content: `New project created: ${title}`,
      performedBy: 'Admin',
      relatedId: project._id,
    });

    return project.toJSON();
  }

  async getAllProjects(query = {}) {
    const { page = 1, limit = 10, search = '', status } = query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    const [projects, total] = await Promise.all([
      projectModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      projectModel.countDocuments(filter),
    ]);

    return {
      projects: projects.map((p) => p.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectById(id) {
    const project = await projectModel.findById(id);
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }
    return project.toJSON();
  }

  async updateProject(id, updateData) {
    const project = await projectModel.findById(id);
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    Object.assign(project, updateData);
    await project.save();

    await activityModel.create({
      type: 'project_updated',
      content: `Project updated: ${project.title}`,
      performedBy: 'Admin',
      relatedId: project._id,
    });

    return project.toJSON();
  }

  async deleteProject(id) {
    const project = await projectModel.findByIdAndDelete(id);
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }
    return { message: 'Project deleted successfully', id: project._id };
  }
}

module.exports = new ProjectService();
