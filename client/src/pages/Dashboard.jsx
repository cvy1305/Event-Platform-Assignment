import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/events/EventCard';
import {
  HiCalendar,
  HiTicket,
  HiPlus,
  HiUser
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('myEvents');
  const [myEvents, setMyEvents] = useState([]);
  const [myRSVPs, setMyRSVPs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, rsvpsRes] = await Promise.all([
        api.get('/events/user/my-events'),
        api.get('/events/user/my-rsvps')
      ]);
      setMyEvents(eventsRes.data.data);
      setMyRSVPs(rsvpsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'myEvents', label: 'My Events', icon: HiCalendar, count: myEvents.length },
    { id: 'myRSVPs', label: 'My RSVPs', icon: HiTicket, count: myRSVPs.length }
  ];

  const currentEvents = activeTab === 'myEvents' ? myEvents : myRSVPs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-indigo-100 p-2 rounded-full">
              <HiUser className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome, {user?.name}!
            </h1>
          </div>
          <p className="text-gray-600">Manage your events and RSVPs from here</p>
        </div>
        <Link
          to="/create-event"
          className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <HiPlus className="h-5 w-5" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <HiCalendar className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Events Created</p>
            <p className="text-2xl font-bold text-gray-900">{myEvents.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <HiTicket className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Events Attending</p>
            <p className="text-2xl font-bold text-gray-900">{myRSVPs.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-4 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : currentEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentEvents.map(event => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                {activeTab === 'myEvents' ? (
                  <HiCalendar className="h-8 w-8 text-gray-400" />
                ) : (
                  <HiTicket className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'myEvents'
                  ? 'No events created yet'
                  : 'No RSVPs yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'myEvents'
                  ? 'Start by creating your first event'
                  : 'Browse events and start RSVPing'}
              </p>
              <Link
                to={activeTab === 'myEvents' ? '/create-event' : '/'}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {activeTab === 'myEvents' ? (
                  <>
                    <HiPlus className="h-5 w-5 mr-2" />
                    Create Event
                  </>
                ) : (
                  'Browse Events'
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
