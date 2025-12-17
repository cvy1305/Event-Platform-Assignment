import express from 'express';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getMyEvents,
  getMyRSVPs
} from '../controllers/eventController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEvent);

// Protected routes
router.post('/', protect, upload.single('image'), createEvent);
router.put('/:id', protect, upload.single('image'), updateEvent);
router.delete('/:id', protect, deleteEvent);

// RSVP routes
router.post('/:id/rsvp', protect, joinEvent);
router.delete('/:id/rsvp', protect, leaveEvent);

// User dashboard routes
router.get('/user/my-events', protect, getMyEvents);
router.get('/user/my-rsvps', protect, getMyRSVPs);

export default router;
