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
import { 
  bookClassAction, 
  cancelBookingAction, 
  checkInBookingAction, 
  saveClassTypeAction, 
  saveClassScheduleAction 
} from "../actions";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  Tag, 
  Sparkles,
  MapPin,
  Trash2,
  AlertCircle
} from "lucide-react";

interface ClassesManagerProps {
  clients: Client[];
  locations: Location[];
  classTypes: ClassType[];
  staff: Staff[];
  schedules: ClassSchedule[];
  instances: ClassInstance[];
  bookings: Booking[];
}

// Generate array of dates for the calendar view (June 29 to July 12, 2026)
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

export default function ClassesManager({
  clients,
  locations,
  classTypes,
  staff,
  schedules,
  instances,
  bookings
}: ClassesManagerProps) {
  // State variables
  const [selectedDate, setSelectedDate] = useState("2026-06-29");
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  
  // Roster Sub-panels
  const [showTypeCreator, setShowTypeCreator] = useState(false);
  const [showScheduleCreator, setShowScheduleCreator] = useState(false);

  // Form states
  const [classTypeForm, setClassTypeForm] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    capacity: 12,
    price: 25,
    color: "#14b8a6"
  });

  const [scheduleForm, setScheduleForm] = useState({
    class_type_id: classTypes[0]?.id || "",
    instructor_id: staff[0]?.id || "",
    location_id: locations[0]?.id || "",
    start_time: "09:00",
    end_time: "10:00",
    day_of_week: 1,
    is_recurring: true
  });

  const [manualBookClientId, setManualBookClientId] = useState("");

  // Process data for the selected date
  const dayInstances = instances.filter(inst => inst.date === selectedDate);
  
  const dayClasses = dayInstances.map(inst => {
    const sched = schedules.find(s => s.id === inst.class_schedule_id);
    const classType = sched ? classTypes.find(ct => ct.id === sched.class_type_id) : null;
    const instructor = sched ? staff.find(s => s.id === sched.instructor_id) : null;
    const classBookings = bookings.filter(b => b.class_instance_id === inst.id);
    
    const activeBookings = classBookings.filter(b => b.status === "booked");
    const waitlistedBookings = classBookings.filter(b => b.status === "waitlist");

    return {
      instance: inst,
      id: inst.id,
      name: classType?.name || "Unknown Class",
      description: classType?.description || "",
      time: sched ? `${sched.start_time} - ${sched.end_time}` : "N/A",
      instructor: instructor?.name || "TBA",
      capacity: classType?.capacity || 12,
      price: classType?.price || 0,
      color: classType?.color || "#14b8a6",
      booked: activeBookings.length,
      waitlisted: waitlistedBookings.length,
      bookingsList: classBookings
    };
  }).sort((a, b) => a.time.localeCompare(b.time));

  // Set default selected class instance
  const activeInstanceId = selectedInstanceId || dayClasses[0]?.id || null;
  const activeClass = dayClasses.find(c => c.id === activeInstanceId) || null;

  // Booked list and Waitlist for active class
  const activeBookedList = activeClass 
    ? activeClass.bookingsList.filter(b => b.status === "booked")
    : [];
  const activeWaitlist = activeClass
    ? activeClass.bookingsList.filter(b => b.status === "waitlist")
    : [];

  // Actions
  const handleSaveClassType = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveClassTypeAction({
      name: classTypeForm.name,
      description: classTypeForm.description,
      duration_minutes: Number(classTypeForm.duration_minutes),
      capacity: Number(classTypeForm.capacity),
      price: Number(classTypeForm.price),
      color: classTypeForm.color
    });

    if (res.success && res.classType) {
      setClassTypeForm({ name: "", description: "", duration_minutes: 60, capacity: 12, price: 25, color: "#14b8a6" });
      setShowTypeCreator(false);
      alert("Class type created successfully!");
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveClassScheduleAction({
      class_type_id: scheduleForm.class_type_id,
      instructor_id: scheduleForm.instructor_id,
      location_id: scheduleForm.location_id,
      start_time: scheduleForm.start_time,
      end_time: scheduleForm.end_time,
      day_of_week: Number(scheduleForm.day_of_week),
      is_recurring: scheduleForm.is_recurring
    });

    if (res.success && res.schedule) {
      setShowScheduleCreator(false);
      alert("Schedule slot added! Class instances for this week will auto-generate.");
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstanceId || !manualBookClientId) return;

    const res = await bookClassAction({
      client_id: manualBookClientId,
      class_instance_id: activeInstanceId
    });

    if (res.success) {
      setManualBookClientId("");
      if (res.status === "waitlist") {
        alert("Class is at full capacity! Client was added to the WAITLIST.");
      } else {
        alert("Client booked successfully!");
      }
    } else {
      alert("Error booking client: " + res.error);
    }
  };

  const handleCheckInToggle = async (bookingId: string, currentCheckIn: string | undefined) => {
    const res = await checkInBookingAction(bookingId, !currentCheckIn);
    if (!res.success) {
      alert("Error checking in: " + res.error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const res = await cancelBookingAction(bookingId);
    if (res.success) {
      if (res.promotedClient) {
        const client = clients.find(c => c.id === res.promotedClient);
        alert(`Booking cancelled! Client "${client?.first_name} ${client?.last_name}" was automatically promoted from the waitlist to booked.`);
      } else {
        alert("Booking cancelled successfully.");
      }
    } else {
      alert("Error cancelling booking: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Strip */}
      <div className="bg-surface border border-border-custom rounded-xl p-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {CALENDAR_DATES.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            return (
              <button
                key={day.dateStr}
                onClick={() => {
                  setSelectedDate(day.dateStr);
                  setSelectedInstanceId(null); // Clear selected instance to load first on new day
                }}
                className={`px-4 py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? "bg-teal-accent text-background font-black shadow-md shadow-teal-500/10 scale-105"
                    : "bg-background border border-border-custom text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider">{day.label}</span>
                <span className="text-sm font-bold">{day.display}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-18rem)] min-h-[450px]">
        
        {/* LEFT COLUMN: Classes for selected day (5/12 width) */}
        <div className="lg:col-span-5 bg-surface border border-border-custom rounded-xl flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-border-custom flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sessions</h2>
            <span className="text-xs text-teal-accent font-semibold">{selectedDate}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {dayClasses.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                No classes scheduled for this day.
              </div>
            ) : (
              dayClasses.map((cls) => {
                const isSelected = cls.id === activeInstanceId;
                const percentFull = Math.min(100, Math.round((cls.booked / cls.capacity) * 100));

                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedInstanceId(cls.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-teal-accent/5 border-teal-accent"
                        : "bg-background border-border-custom hover:border-gray-800 hover:bg-gray-850/10"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cls.color }} />
                        <div>
                          <p className={`font-bold text-sm leading-tight ${isSelected ? "text-teal-accent" : "text-white"}`}>
                            {cls.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {cls.time}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">${Number(cls.price).toFixed(2)}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-450">
                      <div>
                        Instructor: <span className="text-teal-accent font-medium">{cls.instructor}</span>
                      </div>
                      <div>
                        {cls.booked} / {cls.capacity} Booked
                        {cls.waitlisted > 0 && (
                          <span className="text-yellow-500 ml-1.5">({cls.waitlisted} waitlist)</span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-teal-accent h-full"
                        style={{ width: `${percentFull}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Roster & Roster Actions OR Managers (7/12 width) */}
        <div className="lg:col-span-7 bg-surface border border-border-custom rounded-xl flex flex-col h-full overflow-hidden">
          
          {/* Creator form for class types */}
          {showTypeCreator ? (
            <form onSubmit={handleSaveClassType} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="flex justify-between items-center border-b border-border-custom pb-4">
                <h2 className="text-base font-bold text-white">Create New Class Type</h2>
                <button type="button" onClick={() => setShowTypeCreator(false)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vinyasa Flow, Hot Yoga, Pilates Reformer"
                  value={classTypeForm.name}
                  onChange={(e) => setClassTypeForm({ ...classTypeForm, name: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Describe the session format, target level, etc..."
                  value={classTypeForm.description}
                  onChange={(e) => setClassTypeForm({ ...classTypeForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Duration (mins)</label>
                  <input
                    type="number"
                    required
                    value={classTypeForm.duration_minutes}
                    onChange={(e) => setClassTypeForm({ ...classTypeForm, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Max Capacity</label>
                  <input
                    type="number"
                    required
                    value={classTypeForm.capacity}
                    onChange={(e) => setClassTypeForm({ ...classTypeForm, capacity: Number(e.target.value) })}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={classTypeForm.price}
                    onChange={(e) => setClassTypeForm({ ...classTypeForm, price: Number(e.target.value) })}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Color Tag</label>
                <select
                  value={classTypeForm.color}
                  onChange={(e) => setClassTypeForm({ ...classTypeForm, color: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                >
                  <option value="#14b8a6">Teal (Yoga)</option>
                  <option value="#3b82f6">Blue (Pilates)</option>
                  <option value="#f43f5e">Rose (Cardio/HIIT)</option>
                  <option value="#eab308">Yellow (Barre)</option>
                  <option value="#a855f7">Purple (VIP/Private)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end border-t border-border-custom pt-4">
                <button
                  type="button"
                  onClick={() => setShowTypeCreator(false)}
                  className="px-4 py-2 border border-border-custom hover:bg-gray-800 text-sm font-semibold rounded-lg text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-accent hover:bg-teal-650 text-background text-sm font-bold rounded-lg transition-colors"
                >
                  Create Class Type
                </button>
              </div>
            </form>
          ) : showScheduleCreator ? (
            
            /* Creator form for recurring schedule */
            <form onSubmit={handleSaveSchedule} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="flex justify-between items-center border-b border-border-custom pb-4">
                <h2 className="text-base font-bold text-white">Add Schedule Slot</h2>
                <button type="button" onClick={() => setShowScheduleCreator(false)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Class Format</label>
                <select
                  value={scheduleForm.class_type_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, class_type_id: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                >
                  {classTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Instructor</label>
                  <select
                    value={scheduleForm.instructor_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, instructor_id: e.target.value })}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Location</label>
                  <select
                    value={scheduleForm.location_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location_id: e.target.value })}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Day of Week</label>
                  <select
                    value={scheduleForm.day_of_week}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00"
                    required
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00"
                    required
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-border-custom pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleCreator(false)}
                  className="px-4 py-2 border border-border-custom hover:bg-gray-800 text-sm font-semibold rounded-lg text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-accent hover:bg-teal-650 text-background text-sm font-bold rounded-lg transition-colors"
                >
                  Save Schedule Slot
                </button>
              </div>
            </form>
          ) : activeClass ? (
            
            /* ROSTER VIEWER FOR ACTIVE SESSION */
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Header Info */}
              <div className="p-6 border-b border-border-custom flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface/50 shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-teal-accent/15 text-teal-accent rounded border border-teal-accent/10">
                    Active Session
                  </span>
                  <h2 className="text-lg font-bold text-white mt-2 leading-tight">
                    {activeClass.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-4">
                    <span>Time: <strong className="text-white">{activeClass.time}</strong></span>
                    <span>Instructor: <strong className="text-teal-accent">{activeClass.instructor}</strong></span>
                  </p>
                </div>
                
                {/* Manager buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTypeCreator(true)}
                    className="border border-border-custom hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    + Class Type
                  </button>
                  <button
                    onClick={() => setShowScheduleCreator(true)}
                    className="border border-border-custom hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    + Schedule Slot
                  </button>
                </div>
              </div>

              {/* Roster & Roster actions */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Book client manually panel */}
                <form onSubmit={handleManualBook} className="p-4 bg-background/40 border border-[#1a2e2b] rounded-xl flex items-end gap-3 shrink-0">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Manual Book Client</label>
                    <select
                      required
                      value={manualBookClientId}
                      onChange={(e) => setManualBookClientId(e.target.value)}
                      className="w-full bg-background border border-border-custom rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50"
                    >
                      <option value="">Select a client to book...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.last_name}, {c.first_name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-teal-accent hover:bg-teal-650 text-background font-bold px-4 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 h-[34px]"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Book Client</span>
                  </button>
                </form>

                {/* Booked roster list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-teal-accent" />
                    Booked Clients ({activeBookedList.length} / {activeClass.capacity})
                  </h3>
                  
                  {activeBookedList.length === 0 ? (
                    <p className="text-gray-500 text-xs py-4 pl-2">No clients are currently booked in this class.</p>
                  ) : (
                    <div className="border border-border-custom rounded-xl divide-y divide-border-custom bg-background/25">
                      {activeBookedList.map((bk) => {
                        const client = clients.find(c => c.id === bk.client_id);
                        if (!client) return null;
                        return (
                          <div key={bk.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-800/10 transition-colors">
                            <div className="space-y-0.5">
                              <p className="font-bold text-white">{client.first_name} {client.last_name}</p>
                              <p className="text-[10px] text-gray-500">{client.email} • {client.phone || "No phone"}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Check in status checkmark */}
                              <button
                                onClick={() => handleCheckInToggle(bk.id, bk.checked_in_at)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                                  bk.checked_in_at
                                    ? "bg-teal-accent/20 text-teal-accent border border-teal-accent/30"
                                    : "border border-border-custom text-gray-400 hover:text-white"
                                }`}
                              >
                                {bk.checked_in_at ? "Checked In" : "Check In"}
                              </button>
                              
                              {/* Cancel Booking */}
                              <button
                                onClick={() => handleCancelBooking(bk.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                title="Cancel Booking"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Waitlist section */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5" />
                    Waitlist ({activeWaitlist.length})
                  </h3>
                  
                  {activeWaitlist.length === 0 ? (
                    <p className="text-gray-500 text-xs pl-2">Waitlist is currently empty.</p>
                  ) : (
                    <div className="border border-border-custom rounded-xl divide-y divide-border-custom bg-background/20">
                      {activeWaitlist.map((bk, idx) => {
                        const client = clients.find(c => c.id === bk.client_id);
                        if (!client) return null;
                        return (
                          <div key={bk.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-800/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-yellow-500 w-5">#{idx + 1}</span>
                              <div className="space-y-0.5">
                                <p className="font-bold text-white">{client.first_name} {client.last_name}</p>
                                <p className="text-[10px] text-gray-500">{client.email}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleCancelBooking(bk.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-1"
                              title="Remove from Waitlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
              <CalendarIcon className="h-12 w-12 text-gray-650 mb-2" />
              <p className="text-sm">No class instance selected.</p>
              <p className="text-xs mt-1">Select a class session from the daily list to view the attendance roster.</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowTypeCreator(true)}
                  className="px-4 py-2 bg-teal-accent/10 border border-teal-accent/25 hover:bg-teal-accent/20 text-teal-accent font-bold text-xs rounded-lg transition-colors"
                >
                  Create Class Type
                </button>
                <button
                  onClick={() => setShowScheduleCreator(true)}
                  className="px-4 py-2 bg-teal-accent/10 border border-teal-accent/25 hover:bg-teal-accent/20 text-teal-accent font-bold text-xs rounded-lg transition-colors"
                >
                  Add Weekly Slot
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
