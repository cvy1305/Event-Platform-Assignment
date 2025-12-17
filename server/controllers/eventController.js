import mongoose from 'mongoose';
import Event from '../models/Event.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';

// @desc    Create new event
// @route   POST /api/events
// @access  Private
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, capacity, category } = req.body;

    // Check if image is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    // Create event
    const event = await Event.create({
      title,
      description,
      date,
      location,
      capacity: parseInt(capacity),
      category: category || 'other',
      image: result.secure_url,
      imagePublicId: result.public_id,
      organizer: req.user._id
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all events with search and filter
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
    const { search, category, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    let query = {};

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Only show upcoming events (date >= today)
    if (!startDate && !endDate) {
      query.date = { $gte: new Date() };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (only organizer)
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    const { title, description, date, location, capacity, category } = req.body;

    // Prepare update data
    const updateData = {
      title: title || event.title,
      description: description || event.description,
      date: date || event.date,
      location: location || event.location,
      capacity: capacity ? parseInt(capacity) : event.capacity,
      category: category || event.category
    };

    // Check if new capacity is less than current attendees
    if (updateData.capacity < event.attendeeCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce capacity below current attendee count (${event.attendeeCount})`
      });
    }

    // If new image is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (event.imagePublicId) {
        await deleteFromCloudinary(event.imagePublicId);
      }

      // Upload new image
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.image = result.secure_url;
      updateData.imagePublicId = result.public_id;
    }

    // Update event
    event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('organizer', 'name email');

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (only organizer)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    // Delete image from Cloudinary
    if (event.imagePublicId) {
      await deleteFromCloudinary(event.imagePublicId);
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    RSVP to an event (Join)
// @route   POST /api/events/:id/rsvp
// @access  Private
//
// CRITICAL BUSINESS LOGIC: This handles concurrent RSVP requests safely
// We use MongoDB's findOneAndUpdate with atomic operations to prevent race conditions
// The query ensures we only add user if:
// 1. Event exists
// 2. User is not already in attendees list (no duplicates)
// 3. Current attendee count is less than capacity (capacity enforcement)
export const joinEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    // Use atomic update to handle concurrent requests safely
    // This single operation checks conditions and updates in one atomic step
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        // Ensure user is not already attending (no duplicates)
        attendees: { $ne: userId },
        // Ensure capacity is not exceeded (capacity enforcement)
        // $expr allows comparing two fields in the document
        $expr: { $lt: ['$attendeeCount', '$capacity'] }
      },
      {
        // Add user to attendees array
        $push: { attendees: userId },
        // Increment attendee count atomically
        $inc: { attendeeCount: 1 }
      },
      { new: true }
    ).populate('organizer', 'name email');

    // If event is null, the update didn't happen
    // This means either: event not found, user already joined, or capacity full
    if (!event) {
      // Find the event to determine the exact reason
      const existingEvent = await Event.findById(eventId);

      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Check if user already RSVPed
      if (existingEvent.attendees.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You have already RSVPed to this event'
        });
      }

      // Must be capacity issue
      return res.status(400).json({
        success: false,
        message: 'Event is at full capacity'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully RSVPed to event',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel RSVP (Leave event)
// @route   DELETE /api/events/:id/rsvp
// @access  Private
export const leaveEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    // Use atomic update to remove user from attendees
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        // Only update if user is in attendees list
        attendees: userId
      },
      {
        // Remove user from attendees array
        $pull: { attendees: userId },
        // Decrement attendee count atomically
        $inc: { attendeeCount: -1 }
      },
      { new: true }
    ).populate('organizer', 'name email');

    if (!event) {
      // Check if event exists
      const existingEvent = await Event.findById(eventId);

      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You are not RSVPed to this event'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully cancelled RSVP',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get events created by user
// @route   GET /api/events/my-events
// @access  Private
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get events user has RSVPed to
// @route   GET /api/events/my-rsvps
// @access  Private
export const getMyRSVPs = async (req, res) => {
  try {
    const events = await Event.find({ attendees: req.user._id })
      .populate('organizer', 'name email')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
