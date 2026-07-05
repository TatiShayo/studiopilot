"use client";

import { useState } from "react";
import { 
  Client, 
  Location, 
  ClassType, 
  Staff, 
  ClassSchedule, 
  ClassInstance, 
  Booking 
} from "@/lib/db";
import { bookClassAction, cancelBookingAction } from "../dashboard/actions";
import { 
  Flame, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Check, 
  X, 
  ChevronRight, 
  Users, 
  Sparkles,
  AlertCircle
} from "lucide-react";

interface BookingClientProps {
  clients: Client[];
  locations: Location[];
  classTypes: ClassType[];
  staff: Staff[];
  schedules: ClassSchedule[];
  instances: ClassInstance[];
  bookings: Booking[];
}

const CALENDAR_DATES = [
  { label: "Mon", dateStr: "2026-06-29", display: "Jun 29" },
  { label: "Tue", dateStr: "2026-06-30", display: "Jun 30" },
  { label: "Wed", dateStr: "2026-07-01", display: "Jul 1" },
  { label: "Thu", dateStr: "2026-07-02", display: "Jul 2" },
  { label: "Fri", dateStr: "2026-07-03", display: "Jul 3" },
  { label: "Sat", dateStr: "2026-07-04", display: "Jul 4" },
  { label: "Sun", dateStr: "2026-07-05", display: "Jul 5" },
  { label: "Mon", dateStr: "2026-07-06", display: "Jul 6" },
  { label: "Tue", dateStr: "2026-07-07", display: "Jul 7" },
  { label: "Wed", dateStr: "2026-07-08", display: "Jul 8" },
  { label: "Thu", dateStr: "2026-07-09", display: "Jul 9" },
  { label: "Fri", dateStr: "2026-07-10", display: "Jul 10" },
  { label: "Sat", dateStr: "2026-07-11", display: "Jul 11" },
  { label: "Sun", dateStr: "2026-07-12", display: "Jul 12" }
];

export default function BookingClient({
  clients,
  locations,
  classTypes,
  staff,
  schedules,
  instances,
  bookings
}: BookingClientProps) {
  // Demo Mode: acting client state
  const [actingClientId, setActingClientId] = useState(clients[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState("2026-06-29");
  const [loadingInstanceId, setLoadingInstanceId] = useState<string | null>(null);

  const actingClient = clients.find(c => c.id === actingClientId) || null;

  // Process classes for the selected date
  const dayInstances = instances.filter(inst => inst.date === selectedDate && !inst.is_cancelled);

  const dayClasses = dayInstances.map(inst => {
    const sched = schedules.find(s => s.id === inst.class_schedule_id);
    const classType = sched ? classTypes.find(ct => ct.id === sched.class_type_id) : null;
    const instructor = sched ? staff.find(s => s.id === sched.instructor_id) : null;
    const location = sched ? locations.find(l => l.id === sched.location_id) : null;
    
    // Bookings list for this session
    const sessionBookings = bookings.filter(b => b.class_instance_id === inst.id);
    const activeBookingsCount = sessionBookings.filter(b => b.status === "booked").length;
    const waitlistBookings = sessionBookings.filter(b => b.status === "waitlist");

    // Check if the current acting client has a booking
    const myBooking = sessionBookings.find(
      b => b.client_id === actingClientId && b.status !== "cancelled"
    );

    let waitlistPosition = 0;
    if (myBooking && myBooking.status === "waitlist") {
      const sortedWaitlist = waitlistBookings.sort(
        (a, b) => new Date(a.booked_at).getTime() - new Date(b.booked_at).getTime()
      );
      waitlistPosition = sortedWaitlist.findIndex(b => b.id === myBooking.id) + 1;
    }

    return {
      id: inst.id,
      name: classType?.name || "Group Fitness Class",
      description: classType?.description || "A high energy studio session designed to keep you moving.",
      duration: classType?.duration_minutes || 60,
      price: classType?.price || 0,
      color: classType?.color || "#14b8a6",
      capacity: classType?.capacity || 12,
      booked: activeBookingsCount,
      waitlisted: waitlistBookings.length,
      instructor: instructor?.name || "TBA",
      location: location?.name || "Main Room",
      myBooking,
      waitlistPosition
    };
  }).sort((a, b) => a.id.localeCompare(b.id));

  // Handle booking action
  const handleBookClass = async (instanceId: string) => {
    if (!actingClientId) {
      alert("Please select a client from the dropdown first to act as a user.");
      return;
    }

    setLoadingInstanceId(instanceId);
    const res = await bookClassAction({
      client_id: actingClientId,
      class_instance_id: instanceId
    });
    setLoadingInstanceId(null);

    if (res.success) {
      if (res.status === "waitlist") {
        alert("Class is at full capacity! You have been added to the waitlist.");
      } else {
        alert("Success! You are booked into the class.");
      }
    } else {
      alert("Booking failed: " + res.error);
    }
  };

  // Handle cancel booking action
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setLoadingInstanceId(bookingId);
    const res = await cancelBookingAction(bookingId);
    setLoadingInstanceId(null);

    if (res.success) {
      alert("Booking cancelled successfully.");
    } else {
      alert("Cancellation failed: " + res.error);
    }
  };

  return (
    <div className="bg-[#09100f] text-gray-200 min-h-screen font-sans">
      
      {/* Header */}
      <header className="border-b border-[#1a2e2b] bg-[#111a19]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-[#14b8a6]" />
            <span className="font-bold text-lg tracking-wider text-white">
              Studio<span className="text-[#14b8a6]">Pilot</span>
            </span>
            <span className="text-[10px] bg-[#1a2e2b] text-teal-accent border border-[#14b8a6]/20 px-2 py-0.5 rounded font-semibold ml-2">
              CLIENT PORTAL
            </span>
          </div>

          <div className="text-right">
            <p className="text-xs text-teal-accent font-medium">Downtown Sanctuary</p>
            <p className="text-[10px] text-gray-500">Booking Calendar</p>
          </div>
        </div>
      </header>

      {/* Acting Client Bar (Demo mode helper) */}
      <div className="bg-[#111a19] border-b border-[#1a2e2b] py-3.5 px-6 sticky top-16 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-500 shrink-0" />
            <p className="text-gray-400">
              <strong className="text-white">DEMO MODE:</strong> Select which client you want to act as to test waitlists & booking logic.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-450 whitespace-nowrap">Acting as:</span>
            <select
              value={actingClientId}
              onChange={(e) => setActingClientId(e.target.value)}
              className="bg-[#09100f] border border-[#1a2e2b] text-[#14b8a6] text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#14b8a6]/50"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.membership_tier} Plan)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        
        {/* Calendar Strip */}
        <div className="bg-[#111a19] border border-[#1a2e2b] rounded-xl p-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {CALENDAR_DATES.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`px-4 py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? "bg-[#14b8a6] text-[#09100f] font-black scale-105"
                      : "bg-[#09100f] border border-[#1a2e2b] text-gray-450 hover:text-white"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider">{day.label}</span>
                  <span className="text-sm font-bold">{day.display}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Classes List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#14b8a6]" />
              Schedule for {selectedDate}
            </h2>
            <span className="text-xs text-gray-450">Active: {dayClasses.length} sessions</span>
          </div>

          {dayClasses.length === 0 ? (
            <div className="bg-[#111a19] border border-[#1a2e2b] p-12 text-center rounded-xl">
              <AlertCircle className="h-10 w-10 text-gray-650 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No classes scheduled on this day.</p>
              <p className="text-xs text-gray-650 mt-1">Please select another date in the calendar strip above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayClasses.map((cls) => {
                const spotsLeft = cls.capacity - cls.booked;
                const isFull = spotsLeft <= 0;
                
                return (
                  <div
                    key={cls.id}
                    className="bg-[#111a19] border border-[#1a2e2b] hover:border-gray-800 rounded-2xl p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="space-y-3.5 flex-1">
                      {/* Name & time */}
                      <div className="flex items-start gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cls.color }} />
                        <div>
                          <h3 className="font-bold text-base text-white">{cls.name}</h3>
                          <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1 text-white">
                              <Clock className="h-3.5 w-3.5 text-[#14b8a6]" />
                              {cls.duration} mins
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-gray-550" />
                              Instructor: <strong className="text-gray-300">{cls.instructor}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-gray-550" />
                              {cls.location}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-450 leading-relaxed max-w-2xl pl-5">
                        {cls.description}
                      </p>

                      {/* Capacity tag */}
                      <div className="pl-5 flex items-center gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-gray-450">
                          <Users className="h-4 w-4" />
                          <span>
                            {cls.booked} / {cls.capacity} booked
                          </span>
                        </div>
                        {isFull ? (
                          <span className="text-yellow-500 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full animate-pulse" />
                            Waitlist active ({cls.waitlisted} on waitlist)
                          </span>
                        ) : (
                          <span className="text-teal-400 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-teal-400 rounded-full" />
                            {spotsLeft} spots available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Booking actions */}
                    <div className="shrink-0 flex flex-col items-stretch md:items-end justify-center gap-3 pl-5 md:pl-0 border-t border-[#1a2e2b] md:border-t-0 pt-4 md:pt-0">
                      
                      <div className="text-right">
                        <span className="text-sm font-black text-white block">${Number(cls.price).toFixed(2)}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">Drop-in rate</span>
                      </div>

                      {cls.myBooking ? (
                        <div className="space-y-2 w-full md:w-auto">
                          {cls.myBooking.status === "booked" ? (
                            <div className="px-4 py-2 bg-teal-accent/10 border border-[#14b8a6]/20 text-[#14b8a6] rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                              <Check className="h-4.5 w-4.5" />
                              <span>You are booked!</span>
                            </div>
                          ) : (
                            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                              <AlertCircle className="h-4.5 w-4.5" />
                              <span>On Waitlist (#{cls.waitlistPosition})</span>
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleCancelBooking(cls.myBooking!.id)}
                            disabled={loadingInstanceId !== null}
                            className="w-full px-4 py-2 bg-red-500/10 border border-red-550/20 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs text-center transition-colors"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBookClass(cls.id)}
                          disabled={loadingInstanceId !== null}
                          className="px-6 py-2.5 bg-[#14b8a6] hover:bg-teal-600 text-[#09100f] font-bold rounded-xl text-xs transition-colors text-center w-full md:w-auto"
                        >
                          {loadingInstanceId === cls.id ? "Processing..." : isFull ? "Join Waitlist" : "Book Class"}
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
