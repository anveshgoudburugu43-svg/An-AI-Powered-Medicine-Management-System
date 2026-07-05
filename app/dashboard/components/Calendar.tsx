'use client';

import { useState, useEffect } from 'react';
import { Clock, MessageSquare, Calendar as CalendarIcon, AlertTriangle, ChevronLeft, ChevronRight, Package } from 'lucide-react';

interface InventoryItem {
  id: string;
  medicine_id: string;
  batch_number?: string;
  quantity_in_stock: number;
  medicines: {
    id: string;
    name: string;
    expiry_date: string;
    dosage?: string;
  };
}

interface Message {
  id: string;
  subject: string;
  sender: {
    full_name?: string;
    email: string;
  };
  created_at: string;
  tag: string;
}

interface CalendarEvent {
  type: 'expiry' | 'message';
  data: InventoryItem | Message | any;
  date: string;
  priority: 'high' | 'medium' | 'low' | 'safe';
}

export default function Calendar() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredEvents, setHoveredEvents] = useState<CalendarEvent[]>([]);

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT', 'SUN'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchInventory(),
      fetchMessages()
    ]);
  };

  const fetchInventory = async () => {
    try {
      // Fetch inventory to get batches and expiries
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data || []);
      }
    } catch (error) {
      console.error('Calendar: Error fetching inventory:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages?type=received');
      if (response.ok) {
        const data = await response.json();
        // Only show messages from the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentMessages = (data || []).filter((msg: any) =>
          new Date(msg.created_at) > thirtyDaysAgo
        );
        setMessages(recentMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const getEventsForDay = (day: number): CalendarEvent[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];

    // Normalize today to start of day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events: CalendarEvent[] = [];

    // Check for expirations
    inventory.forEach(item => {
      if (!item.medicines?.expiry_date) return;

      const expiryDateStr = new Date(item.medicines.expiry_date).toISOString().split('T')[0];
      const expiryDate = new Date(item.medicines.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      // We only care if the item expires ON this calendar day
      if (expiryDateStr === dateStr) {
        // Calculate days from today (can be negative if expired)
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Determine priority based on proximity to today
        // <= 7 days (1 week): High
        // <= 15 days: Medium
        // <= 30 days (1 month): Low
        // Expired items also get high priority but we might style them differently or alert
        let priority: 'high' | 'medium' | 'low' | 'safe' = 'safe';

        if (diffDays <= 7) {
          priority = 'high';
        } else if (diffDays <= 15) {
          priority = 'medium';
        } else if (diffDays <= 30) {
          priority = 'low';
        } else {
          priority = 'safe';
        }

        // Add event
        events.push({
          type: 'expiry',
          data: item,
          date: dateStr,
          priority
        });
      }
    });

    // Add messages
    messages.forEach(msg => {
      const msgDate = new Date(msg.created_at).toISOString().split('T')[0];
      if (msgDate === dateStr) {
        events.push({
          type: 'message',
          data: msg,
          date: dateStr,
          priority: msg.tag === 'urgent' ? 'high' : msg.tag === 'low_stock' ? 'medium' : 'low'
        });
      }
    });

    return events.sort((a, b) => {
      const priorityOrder = { high: 4, medium: 3, low: 2, safe: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid: (number | null)[][] = [];
    let week: (number | null)[] = [];

    // Adjust for Monday start
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Fill initial empty days
    for (let i = 0; i < adjustedFirstDay; i++) {
      week.push(null);
    }

    // Fill days
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }

    // Fill remaining empty days
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      grid.push(week);
    }

    // Ensure we have 6 rows
    while (grid.length < 6) {
      grid.push([null, null, null, null, null, null, null]);
    }

    return grid;
  };

  const handleDayHover = (day: number | null) => {
    if (day) {
      const events = getEventsForDay(day);
      setHoveredDay(day);
      setHoveredEvents(events);
    } else {
      setHoveredDay(null);
      setHoveredEvents([]);
    }
  };

  const getEventIndicators = (events: CalendarEvent[]) => {
    const indicators = [];
    const hasExpiry = events.some(e => e.type === 'expiry');
    const hasMessage = events.some(e => e.type === 'message');
    const hasHighPriority = events.some(e => e.priority === 'high');

    const hasSafePriority = events.some(e => e.priority === 'safe');

    if (hasExpiry) {
      let colorClass = 'bg-orange-500';
      if (hasHighPriority) colorClass = 'bg-red-500';
      else if (!events.some(e => e.priority === 'medium' || e.priority === 'low') && hasSafePriority) colorClass = 'bg-green-500';

      indicators.push(
        <div key="expiry" className={`absolute top-1 right-1 w-2 h-2 rounded-full ${colorClass}`}></div>
      );
    }

    if (hasMessage) {
      indicators.push(
        <div key="message" className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      );
    }

    return indicators;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const calendarGrid = getCalendarGrid();

  return (
    <div className="h-full flex flex-col relative min-h-[350px]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-white text-sm font-medium">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={() => navigateMonth('next')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-[10px] text-white font-semibold py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-6 gap-2 min-h-[280px]">
        {calendarGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day, dayIndex) => {
              const eventsOnDay = day ? getEventsForDay(day) : [];
              const hasEvents = eventsOnDay.length > 0;
              const hasExpiry = eventsOnDay.some(e => e.type === 'expiry');
              const hasMessage = eventsOnDay.some(e => e.type === 'message');
              const hasHighPriority = eventsOnDay.some(e => e.priority === 'high');
              const hasMediumPriority = eventsOnDay.some(e => e.priority === 'medium');
              const hasLowPriority = eventsOnDay.some(e => e.priority === 'low');
              const hasSafePriority = eventsOnDay.some(e => e.priority === 'safe');

              let cellClasses = '';
              if (hasExpiry && hasHighPriority) {
                cellClasses = 'bg-[rgba(239,68,68,0.2)] border-red-500/50';
              } else if (hasExpiry && (hasMediumPriority || hasLowPriority)) {
                cellClasses = 'bg-[rgba(249,115,22,0.2)] border-orange-500/50';
              } else if (hasExpiry && hasSafePriority) {
                cellClasses = 'bg-green-500/20 border-green-500/50';
              } else if (hasMessage) {
                cellClasses = 'bg-[rgba(59,130,246,0.2)] border-blue-500/50';
              }

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    text-center text-[14px] py-4 cursor-pointer transition-colors flex items-center justify-center rounded-md relative min-h-[45px]
                    ${day ? 'text-white hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)]' : ''}
                    ${cellClasses}
                  `}
                  onMouseEnter={() => handleDayHover(day)}
                  onMouseLeave={() => handleDayHover(null)}
                >
                  {day}
                  {hasEvents && getEventIndicators(eventsOnDay)}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredDay && hoveredEvents.length > 0 && (
        <div className="absolute z-50 bg-[#1a2332] border border-[rgba(255,255,255,0.3)] rounded-lg p-3 shadow-xl max-w-xs"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        >
          <div className="text-white font-semibold text-sm mb-2">
            Events on {new Date(currentDate.getFullYear(), currentDate.getMonth(), hoveredDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="space-y-3">
            {hoveredEvents.map((event, index) => (
              <div key={index} className="border-t border-[rgba(255,255,255,0.1)] pt-2 first:border-t-0 first:pt-0">
                {event.type === 'expiry' && (
                  <div className="flex items-start space-x-2">
                    <Clock className={`mt-0.5 ${event.priority === 'high' ? 'text-red-500' : event.priority === 'safe' ? 'text-green-500' : 'text-orange-500'}`} size={12} />
                    <div>
                      <div className="text-white font-medium text-xs">{(event.data as InventoryItem).medicines?.name}</div>
                      <div className={`text-xs ${event.priority === 'high' ? 'text-red-400' : event.priority === 'safe' ? 'text-green-400' : 'text-orange-400'}`}>
                        {(() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const expiryDate = new Date((event.data as InventoryItem).medicines.expiry_date);
                          expiryDate.setHours(0, 0, 0, 0);
                          const diffTime = expiryDate.getTime() - today.getTime();
                          const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                          if (daysUntilExpiry === 0) return 'Expires today';
                          if (daysUntilExpiry === 1) return 'Expires tomorrow';
                          if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
                          return `Expires in ${daysUntilExpiry} days`;
                        })()}
                      </div>
                      {(event.data as InventoryItem).medicines?.dosage && (
                        <div className="text-gray-400 text-xs">{(event.data as InventoryItem).medicines.dosage}</div>
                      )}
                      {(event.data as InventoryItem).batch_number && (
                        <div className="text-gray-400 text-xs">Batch: {(event.data as InventoryItem).batch_number}</div>
                      )}
                      <div className="text-gray-400 text-xs">Qty: {(event.data as InventoryItem).quantity_in_stock}</div>
                    </div>
                  </div>
                )}
                {event.type === 'message' && (
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="text-blue-500 mt-0.5" size={12} />
                    <div>
                      <div className="text-white font-medium text-xs">{(event.data as Message).subject}</div>
                      <div className="text-blue-400 text-xs">Message received</div>
                      <div className="text-gray-400 text-xs">
                        From: {(event.data as Message).sender?.full_name || (event.data as Message).sender?.email || 'Unknown'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}