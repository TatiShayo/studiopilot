"use client";

import { useState } from "react";
import { 
  Staff, 
  ClassSchedule, 
  ClassInstance, 
  ClassType, 
  Location 
} from "@/lib/db";
import { saveStaffAction } from "../actions";
import { 
  User, 
  Mail, 
  Award, 
  Clock, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Edit2, 
  Smile,
  Zap,
  Briefcase,
  MapPin
} from "lucide-react";

interface StaffClientProps {
  staffList: Staff[];
  schedules: ClassSchedule[];
  instances: ClassInstance[];
  classTypes: ClassType[];
  locations: Location[];
}

export default function StaffClient({
  staffList,
  schedules,
  instances,
  classTypes,
  locations
}: StaffClientProps) {
  // State
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(staffList[0]?.id || null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // Form state
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    specialties: "",
    is_active: true
  });

  const selectedStaff = staffList.find(s => s.id === selectedStaffId) || null;

  // Filter schedules and instances taught by the selected instructor
  const staffSchedules = schedules.filter(s => s.instructor_id === selectedStaffId);
  
  // Find all actual class instances taught by this staff member (non-cancelled)
  const staffInstances = instances.filter(inst => {
    if (inst.is_cancelled) return false;
    const sched = schedules.find(s => s.id === inst.class_schedule_id);
    return sched?.instructor_id === selectedStaffId;
  });

  // Calculate hours taught
  const totalMinutesTaught = staffInstances.reduce((total, inst) => {
    const sched = schedules.find(s => s.id === inst.class_schedule_id);
    const classType = sched ? classTypes.find(ct => ct.id === sched.class_type_id) : null;
    return total + (classType?.duration_minutes || 60);
  }, 0);
  
  const totalHoursTaught = (totalMinutesTaught / 60).toFixed(1);

  // Actions
  const handleOpenAddForm = () => {
    setStaffForm({
      name: "",
      email: "",
      specialties: "",
      is_active: true
    });
    setIsAddingStaff(true);
    setIsEditingStaff(false);
  };

  const handleOpenEditForm = () => {
    if (!selectedStaff) return;
    setStaffForm({
      name: selectedStaff.name,
      email: selectedStaff.email || "",
      specialties: selectedStaff.specialties || "",
      is_active: selectedStaff.is_active
    });
    setIsEditingStaff(true);
    setIsAddingStaff(false);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveStaffAction({
      id: isEditingStaff && selectedStaffId ? selectedStaffId : undefined,
      name: staffForm.name,
      email: staffForm.email,
      specialties: staffForm.specialties,
      is_active: staffForm.is_active
    });

    if (res.success && res.staff) {
      setIsAddingStaff(false);
      setIsEditingStaff(false);
      setSelectedStaffId(res.staff.id);
      alert("Staff member profile saved successfully!");
    } else {
      alert("Error saving profile: " + res.error);
    }
  };

  const getDayName = (dayNum: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayNum] || "Unknown";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)] min-h-[500px]">
      
      {/* LEFT COLUMN: Roster Directory (5/12 width) */}
      <div className="lg:col-span-5 bg-surface border border-border-custom rounded-xl flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border-custom flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Staff Roster ({staffList.length})</h2>
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1 bg-teal-accent hover:bg-teal-650 text-background text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Staff</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-custom/50">
          {staffList.map((st) => {
            const isSelected = st.id === selectedStaffId;
            return (
              <div
                key={st.id}
                onClick={() => {
                  setSelectedStaffId(st.id);
                  setIsAddingStaff(false);
                  setIsEditingStaff(false);
                }}
                className={`p-4 cursor-pointer hover:bg-gray-800/20 transition-colors flex items-center justify-between ${
                  isSelected ? "bg-teal-accent/5 border-l-2 border-teal-accent" : ""
                }`}
              >
                <div className="space-y-0.5">
                  <p className={`font-semibold text-sm ${isSelected ? "text-teal-accent" : "text-white"}`}>
                    {st.name}
                  </p>
                  <p className="text-xs text-gray-450">{st.email || "No email"}</p>
                  <p className="text-[10px] text-teal-accent/80 font-medium italic mt-1">{st.specialties || "General Instructor"}</p>
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wider ${st.is_active ? "text-teal-400" : "text-red-400"}`}>
                  {st.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Instructor Profile & Hours Log (7/12 width) */}
      <div className="lg:col-span-7 bg-surface border border-border-custom rounded-xl flex flex-col h-full overflow-hidden">
        
        {isAddingStaff || isEditingStaff ? (
          <form onSubmit={handleSaveStaff} className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="flex justify-between items-center border-b border-border-custom pb-4">
              <h2 className="text-base font-bold text-white">
                {isAddingStaff ? "Add New Staff Member" : `Edit Staff Profile: ${selectedStaff?.name}`}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAddingStaff(false);
                  setIsEditingStaff(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Elena Rostova"
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. elena@studiopilot.com"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Specialties</label>
              <input
                type="text"
                placeholder="e.g. Yoga, Pilates Reformer, HIIT Cardio"
                value={staffForm.specialties}
                onChange={(e) => setStaffForm({ ...staffForm, specialties: e.target.value })}
                className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={staffForm.is_active ? "true" : "false"}
                onChange={(e) => setStaffForm({ ...staffForm, is_active: e.target.value === "true" })}
                className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="true">Active (Eligible for classes)</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end border-t border-border-custom pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingStaff(false);
                  setIsEditingStaff(false);
                }}
                className="px-4 py-2 border border-border-custom hover:bg-gray-800 text-sm font-semibold rounded-lg text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-accent hover:bg-teal-650 text-background text-sm font-bold rounded-lg transition-colors"
              >
                Save Profile
              </button>
            </div>
          </form>
        ) : selectedStaff ? (
          
          /* VIEW INSTRUCTOR PROFILE */
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-border-custom flex justify-between items-center bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-teal-accent/10 border border-teal-accent/25 flex items-center justify-center text-teal-accent font-black text-lg">
                  {selectedStaff.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedStaff.name}</h2>
                  <p className="text-xs text-teal-accent font-semibold">{selectedStaff.specialties || "Instructor"}</p>
                </div>
              </div>
              <button
                onClick={handleOpenEditForm}
                className="flex items-center gap-1 border border-border-custom hover:bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 border-b border-border-custom bg-background/50 divide-x divide-border-custom">
              <div className="p-4 text-center">
                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Status</p>
                <span className={`inline-block text-xs font-bold mt-1 ${selectedStaff.is_active ? "text-teal-400" : "text-red-400"}`}>
                  {selectedStaff.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Classes Assigned</p>
                <p className="text-base font-bold text-white mt-1">{staffSchedules.length} slots/week</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Hours Logged</p>
                <p className="text-base font-bold text-white mt-1 flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4 text-teal-accent" />
                  {totalHoursTaught} hrs
                </p>
              </div>
            </div>

            {/* Layout divided into Assigned Classes and shift history */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Contact Info */}
              <div className="bg-background/40 border border-border-custom p-4 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Instructor Contact</h3>
                <p className="text-sm text-gray-300 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-teal-accent" />
                  {selectedStaff.email || "No email logged."}
                </p>
              </div>

              {/* Roster / Weekly Schedule */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-accent" />
                  Weekly Teaching Roster
                </h3>

                {staffSchedules.length === 0 ? (
                  <p className="text-xs text-gray-500 pl-2">No weekly recurring classes assigned to this instructor.</p>
                ) : (
                  <div className="border border-border-custom rounded-xl divide-y divide-border-custom bg-background/20">
                    {staffSchedules.map((sched) => {
                      const classType = classTypes.find(c => c.id === sched.class_type_id);
                      const loc = locations.find(l => l.id === sched.location_id);
                      return (
                        <div key={sched.id} className="p-3.5 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-white">{classType?.name || "Class"}</p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
                              <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3 text-teal-accent" /> {getDayName(sched.day_of_week)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {sched.start_time} - {sched.end_time}</span>
                            </p>
                          </div>
                          <span className="text-[10px] bg-teal-accent/10 border border-teal-accent/25 text-teal-accent px-2 py-0.5 rounded flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {loc?.name || "Main Room"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Session Log / Hours log details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Smile className="h-4 w-4 text-teal-accent" />
                  Taught Class Instances Log
                </h3>

                {staffInstances.length === 0 ? (
                  <p className="text-xs text-gray-500 pl-2">No completed class sessions logged.</p>
                ) : (
                  <div className="border border-border-custom rounded-xl divide-y divide-border-custom bg-background/25">
                    {staffInstances.slice(0, 6).map((inst) => {
                      const sched = schedules.find(s => s.id === inst.class_schedule_id);
                      const classType = sched ? classTypes.find(ct => ct.id === sched.class_type_id) : null;
                      return (
                        <div key={inst.id} className="p-3.5 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-white">{classType?.name || "Class"}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Date: {inst.date} ({getDayName(new Date(inst.date).getDay())})</p>
                          </div>
                          <span className="font-semibold text-gray-300">
                            {classType?.duration_minutes || 60} mins
                          </span>
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
            <User className="h-12 w-12 text-gray-650 mb-2" />
            <p className="text-sm">No staff instructor selected.</p>
            <p className="text-xs mt-1">Select an instructor from the left pane or click Add Staff to build a new profile.</p>
          </div>
        )}

      </div>

    </div>
  );
}
