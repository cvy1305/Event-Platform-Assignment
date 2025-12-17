import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  HiCalendar,
  HiLocationMarker,
  HiUserGroup,
  HiUser,
  HiArrowLeft,
  HiPencil,
  HiTrash,
  HiCheckCircle,
  HiXCircle
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.data);
    } catch (error) {
      toast.error('Event not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const isOrganizer = user && event?.organizer?._id === user._id;
  const hasRSVPed = user && event?.attendees?.some(a => a._id === user._id);
  const spotsLeft = event ? event.capacity - event.attendeeCount : 0;
  const isFullyBooked = spotsLeft <= 0;
  const isPastEvent = event && new Date(event.date) < new Date();

  const handleRSVP = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to RSVP');
      navigate('/login');
      return;
    }

    setRsvpLoading(true);
    try {
      if (hasRSVPed) {
        await api.delete(`/events/${id}/rsvp`);
        toast.success('RSVP cancelled successfully');
      } else {
        await api.post(`/events/${id}/rsvp`);
        toast.success('RSVP successful!');
      }
      fetchEvent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'RSVP failed');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      conference: 'bg-blue-100 text-blue-800',
      workshop: 'bg-green-100 text-green-800',
      meetup: 'bg-purple-100 text-purple-800',
      seminar: 'bg-yellow-100 text-yellow-800',
      webinar: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition"
      >
        <HiArrowLeft className="h-5 w-5 mr-2" />
        Back to Events
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Event Image */}
        <div className="relative h-64 md:h-96">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getCategoryColor(event.category)}`}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </span>
            {isPastEvent && (
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-800 text-white">
                Past Event
              </span>
            )}
          </div>
        </div>

        {/* Event Content */}
        <div className="p-6 md:p-8">
          {/* Title and Actions */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {event.title}
            </h1>

            {isOrganizer && (
              <div className="flex gap-2">
                <Link
                  to={`/events/${id}/edit`}
                  className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                >
                  <HiPencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-700 mr-2"></div>
                  ) : (
                    <HiTrash className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              {/* Date and Time */}
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <HiCalendar className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{formatDate(event.date)}</p>
                  <p className="text-gray-600">{formatTime(event.date)}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <HiLocationMarker className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Capacity */}
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <HiUserGroup className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Capacity</p>
                  <p className="text-gray-600">
                    {event.attendeeCount} / {event.capacity} spots filled
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isFullyBooked ? 'bg-red-500' : 'bg-indigo-600'
                      }`}
                      style={{
                        width: `${Math.min((event.attendeeCount / event.capacity) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <HiUser className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Organizer</p>
                  <p className="text-gray-600">{event.organizer?.name || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* RSVP Section */}
          {!isOrganizer && !isPastEvent && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {isFullyBooked && !hasRSVPed ? (
                    <p className="text-red-600 font-medium flex items-center">
                      <HiXCircle className="h-5 w-5 mr-2" />
                      This event is fully booked
                    </p>
                  ) : hasRSVPed ? (
                    <p className="text-green-600 font-medium flex items-center">
                      <HiCheckCircle className="h-5 w-5 mr-2" />
                      You're attending this event!
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRSVP}
                  disabled={rsvpLoading || (isFullyBooked && !hasRSVPed)}
                  className={`px-6 py-3 rounded-lg font-medium transition flex items-center disabled:cursor-not-allowed ${
                    hasRSVPed
                      ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                  }`}
                >
                  {rsvpLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : null}
                  {hasRSVPed ? 'Cancel RSVP' : 'RSVP Now'}
                </button>
              </div>
            </div>
          )}

          {/* Attendees List */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Attendees ({event.attendees.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {event.attendees.map((attendee) => (
                  <span
                    key={attendee._id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                  >
                    <HiUser className="h-4 w-4 mr-1" />
                    {attendee.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
