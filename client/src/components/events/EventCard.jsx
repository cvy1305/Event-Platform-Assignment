import { Link } from 'react-router-dom';
import { HiCalendar, HiLocationMarker, HiUserGroup } from 'react-icons/hi';

const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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

  const spotsLeft = event.capacity - event.attendeeCount;
  const isFullyBooked = spotsLeft <= 0;

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

  return (
    <Link to={`/events/${event._id}`} className="block">
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transform hover:scale-105 transition duration-300"
          />
          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </span>
          {isFullyBooked && (
            <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Fully Booked
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-grow flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {event.title}
          </h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
            {event.description}
          </p>

          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <HiCalendar className="h-4 w-4 text-indigo-500" />
              <span>{formatDate(event.date)} at {formatTime(event.date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <HiLocationMarker className="h-4 w-4 text-indigo-500" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <HiUserGroup className="h-4 w-4 text-indigo-500" />
              <span>
                {isFullyBooked ? (
                  <span className="text-red-600">No spots left</span>
                ) : (
                  <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              By {event.organizer?.name || 'Unknown'}
            </span>
            <span className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
