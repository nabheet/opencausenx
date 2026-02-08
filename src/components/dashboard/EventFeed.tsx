/**
 * Event Feed Component
 * 
 * WHY: Display recent world events
 */

'use client';

import React, { useEffect, useState } from 'react';

interface Event {
    id: string;
    summary: string;
    eventType: string;
    region: string;
    timestamp: Date | string;
    confidenceScore: number;
}

export function EventFeed() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events?limit=10');
            const data = await response.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatEventType = (type: string) => {
        return type
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString();
    };

    if (loading) {
        return <div className="text-gray-500">Loading events...</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Global Events</h2>

            <div className="space-y-3">
                {events.length === 0 ? (
                    <p className="text-gray-500">No events found. Run event ingestion to populate.</p>
                ) : (
                    events.map((event) => (
                        <div
                            key={event.id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                    {formatEventType(event.eventType)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {event.region} · {formatDate(event.timestamp)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700">{event.summary.substring(0, 200)}{event.summary.length > 200 ? '...' : ''}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
