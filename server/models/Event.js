import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  capacity: {
    type: Number,
    required: [true, 'Event capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  image: {
    type: String,
    required: [true, 'Event image is required']
  },
  imagePublicId: {
    type: String
  },
  category: {
    type: String,
    enum: ['conference', 'workshop', 'meetup', 'seminar', 'webinar', 'other'],
    default: 'other'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attendeeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for searching and filtering
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
