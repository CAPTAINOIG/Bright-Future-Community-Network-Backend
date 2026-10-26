const eventModel = require("../models/events.model");
const activityModel = require("../models/activity.model");

class EventService {
  async createEvent(eventData) {
    const { title, description, date, location, status, image } = eventData;

    const event = await eventModel.create({
      title,
      description,
      date,
      location,
      status: typeof status === 'string' && status.trim() === '' ? undefined : status,
      image,
    });

    await activityModel.create({
      type: 'event_opened',
      content: `New event created: ${title}`,
      performedBy: 'Admin',
      relatedId: event._id,
    });

    return event.toJSON();
  }

  async getAllEvents(query = {}) {
    const { page = 1, limit = 10, search = '', status } = query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    const [events, total] = await Promise.all([
      eventModel.find(filter).skip(skip).limit(Number(limit)).sort({ date: 1 }),
      eventModel.countDocuments(filter),
    ]);

    return {
      events: events.map((e) => e.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventById(id) {
    const event = await eventModel.findById(id);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }
    return event.toJSON();
  }

  async updateEvent(id, updateData) {
    const event = await eventModel.findById(id);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    const { status, ...rest } = updateData;

    if (typeof status === 'string' && status.trim() !== '') {
      event.status = status;
    }

    Object.assign(event, rest);
    await event.save();

    await activityModel.create({
      type: 'event_opened',
      content: `Event updated: ${event.title}`,
      performedBy: 'Admin',
      relatedId: event._id,
    });

    return event.toJSON();
  }

  async deleteEvent(id) {
    const event = await eventModel.findByIdAndDelete(id);
    if (!event) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }
    return { message: 'Event deleted successfully', id: event._id };
  }
}

module.exports = new EventService();
