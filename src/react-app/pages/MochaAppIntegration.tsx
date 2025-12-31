import { useState, useEffect } from 'react';
import { Link } from 'react-router';

interface WebhookEvent {
  id: number;
  event_type: string;
  app_id: string;
  payload: string;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

interface EventStats {
  total: number;
  processed: number;
  pending: number;
}

export default function MochaAppIntegration() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState<EventStats>({ total: 0, processed: 0, pending: 0 });
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const embeddedAppId = '019b707b-b33f-7a1c-a703-57213a84f433';
  const webhookEndpoint = 'POST https://fruitfulglobal.mocha.app/api/mocha-app/webhook';
  const sourceAppUrl = 'https://getmocha.com/apps/01998656-078a-7df0-b9d7-0ff35c0ca316';

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/mocha-app/events?limit=100');
      const data = await response.json();
      
      if (data.events) {
        setEvents(data.events);
        setStats({
          total: data.total || 0,
          processed: data.processed || 0,
          pending: data.pending || 0
        });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchEvents, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const markAsProcessed = async (eventId: number) => {
    try {
      await fetch(`/api/mocha-app/events/${eventId}/process`, {
        method: 'PUT'
      });
      fetchEvents();
    } catch (error) {
      console.error('Error marking event as processed:', error);
    }
  };

  const deleteEvent = async (eventId: number) => {
    try {
      await fetch(`/api/mocha-app/events/${eventId}`, {
        method: 'DELETE'
      });
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const clearAllEvents = async () => {
    if (!confirm('Are you sure you want to clear all webhook events?')) return;
    
    try {
      await fetch('/api/mocha-app/events', {
        method: 'DELETE'
      });
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error clearing events:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const parsePayload = (payloadString: string) => {
    try {
      return JSON.parse(payloadString);
    } catch {
      return payloadString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a1a1c] to-black">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-4xl">🔗</span>
              <div>
                <h1 className="text-2xl font-black text-white">Mocha App Integration</h1>
                <p className="text-xs text-gray-400">Embedded app + webhook data stream</p>
              </div>
            </Link>
            <div className="flex gap-4">
              <button
                onClick={() => fetchEvents()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <span>🔄</span> Refresh
              </button>
              <Link to="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-3xl font-black text-blue-400">{stats.total}</div>
            <div className="text-white font-semibold">Total Events</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-black text-green-400">{stats.processed}</div>
            <div className="text-white font-semibold">Processed</div>
          </div>
          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/30 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-3xl font-black text-orange-400">{stats.pending}</div>
            <div className="text-white font-semibold">Pending</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Embedded App */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📱</span> Embedded Mocha App
            </h2>
            <p className="text-gray-400 text-sm mb-4">Live interactive instance</p>
            
            <div className="bg-black/30 rounded-lg p-4 border border-gray-700 mb-4">
              <div className="text-sm text-gray-400 mb-2">App ID:</div>
              <code className="text-indigo-400 bg-gray-900/50 px-3 py-2 rounded font-mono text-xs block break-all">
                {embeddedAppId}
              </code>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-2 border-indigo-500/30 rounded-xl aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🌐</div>
                <div className="text-white font-bold mb-2">Embedded App View</div>
                <div className="text-gray-400 text-sm">App ID: {embeddedAppId}</div>
                <a 
                  href={sourceAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Open Source App →
                </a>
              </div>
            </div>
          </div>

          {/* Webhook Endpoint */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🔌</span> Webhook Endpoint
            </h2>
            
            <div className="bg-black/30 rounded-lg p-4 border border-gray-700 mb-4">
              <div className="text-sm text-gray-400 mb-2">Configure this endpoint in the other Mocha app to send data here</div>
              <code className="text-green-400 bg-gray-900/50 px-3 py-2 rounded font-mono text-xs block break-all">
                {webhookEndpoint}
              </code>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <span className="text-gray-400 text-sm">Auto-refresh events</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    autoRefresh 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {autoRefresh ? '✓ Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => fetchEvents()}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  🔄 Refresh Now
                </button>
                <button
                  onClick={clearAllEvents}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4">
              <div className="text-sm text-gray-300">
                <div className="font-bold text-white mb-2">💡 Quick Setup</div>
                <ol className="space-y-1 text-xs">
                  <li>1. Copy the webhook endpoint above</li>
                  <li>2. Configure it in your source Mocha app</li>
                  <li>3. Events will appear below automatically</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Events List */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>📬</span> Webhook Events
              </h2>
              <div className="text-sm text-gray-400">
                {stats.total} events received
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-5xl mb-4">⚙️</div>
                <div className="text-gray-400">Loading events...</div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <div className="text-gray-400 mb-2">No webhook events yet</div>
                <div className="text-gray-500 text-sm">Events will appear here when received</div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`bg-black/30 rounded-lg p-4 border cursor-pointer transition-all hover:bg-black/40 ${
                      selectedEvent?.id === event.id 
                        ? 'border-blue-500 ring-2 ring-blue-500/50' 
                        : event.processed 
                        ? 'border-green-500/30' 
                        : 'border-orange-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-white font-semibold flex items-center gap-2">
                          {event.processed ? '✅' : '⏳'}
                          <span className="text-sm">{event.event_type}</span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          ID: {event.id} • {formatDate(event.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!event.processed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsProcessed(event.id);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-semibold transition-all"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(event.id);
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-semibold transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-gray-400 text-xs">
                      App ID: {event.app_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span>🔍</span> Event Details
            </h2>

            {selectedEvent ? (
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4 border border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1">Event ID</div>
                      <div className="text-white font-semibold">{selectedEvent.id}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Type</div>
                      <div className="text-white font-semibold">{selectedEvent.event_type}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">App ID</div>
                      <div className="text-white font-mono text-xs break-all">{selectedEvent.app_id}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Status</div>
                      <div className={`font-semibold ${selectedEvent.processed ? 'text-green-400' : 'text-orange-400'}`}>
                        {selectedEvent.processed ? '✅ Processed' : '⏳ Pending'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-400 mb-1">Received</div>
                      <div className="text-white text-xs">{formatDate(selectedEvent.created_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg p-4">
                  <div className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span>📦</span> Payload
                  </div>
                  <pre className="text-xs text-gray-300 bg-black/40 p-4 rounded-lg overflow-x-auto border border-gray-700">
                    {JSON.stringify(parsePayload(selectedEvent.payload), null, 2)}
                  </pre>
                </div>

                <div className="flex gap-3">
                  {!selectedEvent.processed && (
                    <button
                      onClick={() => markAsProcessed(selectedEvent.id)}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                    >
                      ✓ Mark as Processed
                    </button>
                  )}
                  <button
                    onClick={() => deleteEvent(selectedEvent.id)}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                  >
                    🗑️ Delete Event
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👈</div>
                <div className="text-gray-400 mb-2">Select an event to view details</div>
                <div className="text-gray-500 text-sm">Click on an event from the list</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
