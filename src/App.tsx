import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Users, IndianRupee } from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  venue: string;
  price: number;
  capacity: number;
  image_url: string;
}

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'current' | 'ended'>('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (event: Event) => {
    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: event.price * 100,
        currency: "INR",
        name: "College Events",
        description: `Registration for ${event.title}`,
        handler: async (response: any) => {
          const { error } = await supabase
            .from('registrations')
            .insert({
              event_id: event.id,
              payment_id: response.razorpay_payment_id,
              status: 'completed'
            });

          if (error) throw error;
          toast.success('Registration successful!');
        },
        prefill: {
          name: "Student Name",
          email: "student@example.com"
        },
        theme: {
          color: "#6366F1"
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('Registration failed');
    }
  };

  const filteredEvents = events.filter(event => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    switch (filter) {
      case 'upcoming':
        return startDate > now;
      case 'current':
        return startDate <= now && endDate >= now;
      case 'ended':
        return endDate < now;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-indigo-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">College Events</h1>
          <p className="mt-2 text-indigo-100">Discover and register for exciting events</p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex space-x-4 mb-8">
          {['upcoming', 'current', 'ended'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">Loading events...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                  <p className="mt-2 text-gray-600 line-clamp-2">{event.description}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{format(new Date(event.start_date), 'PPP')}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{format(new Date(event.start_date), 'p')}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{event.capacity} seats</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <IndianRupee className="w-4 h-4 mr-2" />
                      <span>₹{event.price}</span>
                    </div>
                  </div>

                  {filter === 'upcoming' && (
                    <button
                      onClick={() => handleRegistration(event)}
                      className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Register Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;