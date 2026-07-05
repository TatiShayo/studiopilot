"use client";

import { useState } from "react";
import { 
  Client, 
  Payment, 
  Membership, 
  Booking, 
  ClassInstance, 
  ClassSchedule, 
  ClassType 
} from "@/lib/db";
import { 
  saveClientAction, 
  recordPaymentAction, 
  assignMembershipAction, 
  checkInBookingAction 
} from "../actions";
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Heart, 
  ShieldAlert, 
  Calendar, 
  CreditCard, 
  Check, 
  X,
  Edit2,
  FileText
} from "lucide-react";

interface ClientManagerProps {
  clients: Client[];
  payments: Payment[];
  memberships: Membership[];
  bookings: Booking[];
  instances: ClassInstance[];
  schedules: ClassSchedule[];
  classTypes: ClassType[];
}

export default function ClientManager({
  clients,
  payments,
  memberships,
  bookings,
  instances,
  schedules,
  classTypes
}: ClientManagerProps) {
  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "vip">("all");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  
  // Tab control in detailed view
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "payments" | "membership">("overview");

  // Form states
  const [clientForm, setClientForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    emergency_name: "",
    emergency_phone: "",
    membership_tier: "None",
    notes: "",
    is_active: true
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "card",
    description: "Manual Payment Entry"
  });

  const [membershipForm, setMembershipForm] = useState({
    plan_name: "Starter",
    price: "29",
    billing_cycle: "monthly",
    start_date: new Date().toISOString().split("T")[0]
  });

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  // Filter clients list
  const filteredClients = clients.filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const email = c.email.toLowerCase();
    const phone = c.phone?.toLowerCase() || "";
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          email.includes(searchQuery.toLowerCase()) ||
                          phone.includes(searchQuery.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "active") return matchesSearch && c.is_active;
    if (filterStatus === "inactive") return matchesSearch && !c.is_active;
    if (filterStatus === "vip") return matchesSearch && c.membership_tier === "VIP";
    return matchesSearch;
  });

  // Client calculations
  const clientPayments = payments.filter(p => p.client_id === selectedClientId);
  const clientBookings = bookings.filter(b => b.client_id === selectedClientId);
  const clientMembership = memberships.find(m => m.client_id === selectedClientId);

  const totalSpent = clientPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Find last visit
  const checkins = clientBookings.filter(b => b.checked_in_at);
  const lastCheckin = checkins.length > 0 
    ? checkins.sort((a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime())[0]
    : null;
  
  const lastVisitDate = lastCheckin 
    ? new Date(lastCheckin.checked_in_at!).toLocaleDateString()
    : "No visits yet";

  // Actions
  const handleOpenAddForm = () => {
    setClientForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      emergency_name: "",
      emergency_phone: "",
      membership_tier: "None",
      notes: "",
      is_active: true
    });
    setIsAddingClient(true);
    setIsEditingClient(false);
  };

  const handleOpenEditForm = () => {
    if (!selectedClient) return;
    
    // Parse emergency contacts and notes from existing fields
    let emergency_name = "";
    let emergency_phone = "";
    
    if (selectedClient.notes?.includes("EMERGENCY:")) {
      const matchName = selectedClient.notes.match(/EMERGENCY:\s*([^,\n]+)/);
      const matchPhone = selectedClient.notes.match(/EMERGENCY_PHONE:\s*([^,\n]+)/);
      if (matchName) emergency_name = matchName[1].trim();
      if (matchPhone) emergency_phone = matchPhone[1].trim();
    }

    setClientForm({
      first_name: selectedClient.first_name,
      last_name: selectedClient.last_name,
      email: selectedClient.email,
      phone: selectedClient.phone || "",
      emergency_name: emergency_name,
      emergency_phone: emergency_phone,
      membership_tier: selectedClient.membership_tier,
      notes: selectedClient.notes || "",
      is_active: selectedClient.is_active
    });
    setIsEditingClient(true);
    setIsAddingClient(false);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Package emergency contacts back into notes text field if provided
    let notesCombined = clientForm.notes;
    if (clientForm.emergency_name) {
      notesCombined = `EMERGENCY: ${clientForm.emergency_name}, EMERGENCY_PHONE: ${clientForm.emergency_phone || "N/A"}\n${notesCombined}`;
    }

    const payload = {
      id: isEditingClient && selectedClientId ? selectedClientId : undefined,
      first_name: clientForm.first_name,
      last_name: clientForm.last_name,
      email: clientForm.email,
      phone: clientForm.phone,
      membership_tier: clientForm.membership_tier,
      notes: notesCombined,
      is_active: clientForm.is_active,
      join_date: isEditingClient && selectedClient ? selectedClient.join_date : new Date().toISOString()
    };

    const res = await saveClientAction(payload);
    if (res.success && res.client) {
      setIsAddingClient(false);
      setIsEditingClient(false);
      setSelectedClientId(res.client.id);
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const res = await recordPaymentAction({
      client_id: selectedClientId,
      amount: Number(paymentForm.amount),
      currency: "USD",
      method: paymentForm.method,
      description: paymentForm.description
    });

    if (res.success) {
      setPaymentForm({ amount: "", method: "card", description: "Manual Payment Entry" });
      alert("Payment recorded successfully!");
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleAssignMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const res = await assignMembershipAction({
      client_id: selectedClientId,
      plan_name: membershipForm.plan_name,
      price: Number(membershipForm.price),
      billing_cycle: membershipForm.billing_cycle,
      start_date: membershipForm.start_date
    });

    if (res.success) {
      alert("Membership assigned successfully!");
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleCheckInToggle = async (bookingId: string, currentStatus: string | undefined) => {
    const isCurrentlyCheckedIn = !!currentStatus;
    const res = await checkInBookingAction(bookingId, !isCurrentlyCheckedIn);
    if (!res.success) {
      alert("Error toggling check-in: " + res.error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)] min-h-[500px]">
      
      {/* LEFT COLUMN: Search & Scrollable Client List (5/12 width) */}
      <div className="lg:col-span-5 bg-surface border border-border-custom rounded-xl flex flex-col h-full overflow-hidden">
        
        {/* Search & Actions */}
        <div className="p-4 border-b border-border-custom space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Clients ({filteredClients.length})</h2>
            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-1 bg-teal-accent hover:bg-teal-650 text-background text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Client</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border-custom rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          {/* Filter badges */}
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "active", "inactive", "vip"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filterStatus === status
                    ? "bg-teal-accent text-background"
                    : "bg-background text-gray-400 hover:text-white border border-border-custom"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-custom/50">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No clients found matching the query.
            </div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = client.id === selectedClientId;
              const hasMembership = client.membership_tier !== "None";
              
              // Style variables for tier tag
              const tierColor = 
                client.membership_tier === "VIP" ? "bg-purple-550/10 text-purple-400 border border-purple-550/20" :
                client.membership_tier === "Studio" ? "bg-teal-accent/10 text-teal-accent border border-teal-accent/20" :
                client.membership_tier === "Pro" ? "bg-blue-550/10 text-blue-400 border border-blue-550/20" :
                client.membership_tier === "Starter" ? "bg-emerald-550/10 text-emerald-450 border border-emerald-550/20" : 
                "bg-gray-800 text-gray-400 border border-gray-700/50";

              return (
                <div
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setIsAddingClient(false);
                    setIsEditingClient(false);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-800/20 transition-colors flex items-center justify-between ${
                    isSelected ? "bg-teal-accent/5 border-l-2 border-teal-accent" : ""
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className={`font-semibold text-sm truncate ${isSelected ? "text-teal-accent" : "text-white"}`}>
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-xs text-gray-450 truncate">{client.email}</p>
                    <p className="text-[10px] text-gray-500 truncate">{client.phone || "No phone number"}</p>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${tierColor}`}>
                      {client.membership_tier}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${client.is_active ? "text-teal-400" : "text-red-400"}`}>
                      {client.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Details / Forms (7/12 width) */}
      <div className="lg:col-span-7 bg-surface border border-border-custom rounded-xl flex flex-col h-full overflow-hidden">
        
        {/* ADD CLIENT FORM OR EDIT CLIENT FORM */}
        {isAddingClient || isEditingClient ? (
          <form onSubmit={handleSaveClient} className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="flex justify-between items-center border-b border-border-custom pb-4">
              <h2 className="text-base font-bold text-white">
                {isAddingClient ? "Add New Client Profile" : `Edit Profile: ${selectedClient?.first_name} ${selectedClient?.last_name}`}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAddingClient(false);
                  setIsEditingClient(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={clientForm.first_name}
                  onChange={(e) => setClientForm({ ...clientForm, first_name: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={clientForm.last_name}
                  onChange={(e) => setClientForm({ ...clientForm, last_name: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>
            </div>

            <div className="border-t border-border-custom/50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Emergency Contact Name</label>
                <input
                  type="text"
                  value={clientForm.emergency_name}
                  onChange={(e) => setClientForm({ ...clientForm, emergency_name: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  placeholder="e.g., Jane Smith (Mother)"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={clientForm.emergency_phone}
                  onChange={(e) => setClientForm({ ...clientForm, emergency_phone: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  placeholder="e.g., (555) 000-0000"
                />
              </div>
            </div>

            <div className="border-t border-border-custom/50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Membership Tier</label>
                <select
                  value={clientForm.membership_tier}
                  onChange={(e) => setClientForm({ ...clientForm, membership_tier: e.target.value })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                >
                  <option value="None">None</option>
                  <option value="Starter">Starter</option>
                  <option value="Pro">Pro</option>
                  <option value="Studio">Studio</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Account Status</label>
                <select
                  value={clientForm.is_active ? "true" : "false"}
                  onChange={(e) => setClientForm({ ...clientForm, is_active: e.target.value === "true" })}
                  className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Medical & Studio Notes</label>
              <textarea
                value={clientForm.notes}
                onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                rows={3}
                placeholder="Injuries, goals, or scheduling preferences..."
                className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>

            <div className="flex gap-3 justify-end border-t border-border-custom pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingClient(false);
                  setIsEditingClient(false);
                }}
                className="px-4 py-2 border border-border-custom hover:bg-gray-800 text-sm font-semibold rounded-lg text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-accent hover:bg-teal-650 text-background text-sm font-bold rounded-lg transition-colors"
              >
                {isAddingClient ? "Create Client" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : selectedClient ? (
          
          /* DETAILED PROFILE PANEL */
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header info */}
            <div className="p-6 border-b border-border-custom flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface/50">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-teal-accent/10 border border-teal-accent/20 flex items-center justify-center text-teal-accent font-black text-lg">
                  {selectedClient.first_name[0]}{selectedClient.last_name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Member since {new Date(selectedClient.join_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleOpenEditForm}
                  className="flex items-center gap-1.5 border border-border-custom hover:bg-gray-800 text-gray-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-4 border-b border-border-custom bg-background/50 divide-x divide-border-custom">
              <div className="p-4 text-center">
                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Plan Tier</p>
                <p className="text-sm font-bold text-teal-accent mt-0.5">{selectedClient.membership_tier}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Last Visit</p>
                <p className="text-sm font-bold text-white mt-0.5 truncate">{lastVisitDate}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Total Spent</p>
                <p className="text-sm font-bold text-white mt-0.5">${totalSpent.toFixed(2)}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Visits</p>
                <p className="text-sm font-bold text-white mt-0.5">{checkins.length} classes</p>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-border-custom bg-surface px-4">
              {(["overview", "classes", "payments", "membership"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                    activeTab === tab
                      ? "border-teal-accent text-teal-accent font-bold"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab === "overview" ? "Info & Notes" : 
                   tab === "classes" ? "Class History" : 
                   tab === "payments" ? "Payment Log" : "Assign Plan"}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* TAB 1: OVERVIEW & NOTES */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="bg-background/40 border border-border-custom p-4 rounded-xl space-y-3.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-teal-accent shrink-0" />
                        <span className="truncate">{selectedClient.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-teal-accent shrink-0" />
                        <span>{selectedClient.phone || "No phone number"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Medical / Emergency Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Emergency Contact */}
                    <div className="bg-background/40 border border-border-custom p-4 rounded-xl space-y-3">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-yellow-500" />
                        Emergency Contact
                      </h3>
                      {selectedClient.notes?.includes("EMERGENCY:") ? (
                        <div className="text-sm text-gray-300 space-y-1">
                          <p><span className="text-gray-400">Contact:</span> {selectedClient.notes.match(/EMERGENCY:\s*([^,\n]+)/)?.[1] || "N/A"}</p>
                          <p><span className="text-gray-400">Phone:</span> {selectedClient.notes.match(/EMERGENCY_PHONE:\s*([^,\n]+)/)?.[1] || "N/A"}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No emergency details logged. Click Edit Profile to add.</p>
                      )}
                    </div>

                    {/* Medical details */}
                    <div className="bg-background/40 border border-border-custom p-4 rounded-xl space-y-3">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Heart className="h-4 w-4 text-red-500" />
                        Medical Considerations
                      </h3>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                        {selectedClient.notes?.replace(/EMERGENCY:.*(\n|$)/, "") || "No medical conditions or physical considerations flagged."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CLASS HISTORY */}
              {activeTab === "classes" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Class Attendance</h3>
                  {clientBookings.length === 0 ? (
                    <p className="text-gray-500 text-sm">No class bookings registered.</p>
                  ) : (
                    <div className="divide-y divide-border-custom/50 border border-border-custom rounded-xl overflow-hidden bg-background/20">
                      {clientBookings.map((bk) => {
                        const inst = instances.find(i => i.id === bk.class_instance_id);
                        const sched = inst ? schedules.find(s => s.id === inst.class_schedule_id) : null;
                        const classType = sched ? classTypes.find(ct => ct.id === sched.class_type_id) : null;

                        return (
                          <div key={bk.id} className="p-4 flex items-center justify-between text-sm hover:bg-gray-800/10 transition-colors">
                            <div className="space-y-1">
                              <p className="font-bold text-white">{classType?.name || "Class"}</p>
                              <p className="text-xs text-gray-400">
                                {inst?.date} • {sched?.start_time} - {sched?.end_time}
                              </p>
                              <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                bk.status === "booked" ? "bg-teal-500/10 text-teal-400" :
                                bk.status === "waitlist" ? "bg-yellow-500/10 text-yellow-400" :
                                "bg-red-500/10 text-red-400"
                              }`}>
                                {bk.status}
                              </span>
                            </div>

                            <button
                              onClick={() => handleCheckInToggle(bk.id, bk.checked_in_at)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                bk.checked_in_at
                                  ? "bg-teal-accent text-background font-bold"
                                  : "border border-border-custom hover:bg-gray-800 text-gray-300 hover:text-white"
                              }`}
                            >
                              {bk.checked_in_at ? "Checked In" : "Mark Present"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PAYMENT LOG */}
              {activeTab === "payments" && (
                <div className="space-y-6">
                  {/* Record Payment Form Panel */}
                  <form onSubmit={handleRecordPayment} className="p-4 bg-background/40 border border-[#1a2e2b] rounded-xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-teal-accent" />
                      Record Manual Payment
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Amount ($)</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 29.00"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Method</label>
                        <select
                          value={paymentForm.method}
                          onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50"
                        >
                          <option value="card">Card</option>
                          <option value="cash">Cash</option>
                          <option value="M-Pesa">M-Pesa</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full bg-teal-accent hover:bg-teal-650 text-background font-bold py-1.5 rounded-lg text-xs transition-colors h-[34px]"
                        >
                          Record
                        </button>
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Description (e.g., Starter Membership Renewal, 10-Class Pack)"
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                        className="w-full bg-background border border-border-custom rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50"
                      />
                    </div>
                  </form>

                  {/* Payment History List */}
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Billing History</h3>
                    {clientPayments.length === 0 ? (
                      <p className="text-gray-500 text-sm">No payment records logged.</p>
                    ) : (
                      <div className="divide-y divide-border-custom/50 border border-border-custom rounded-xl overflow-hidden bg-background/25">
                        {clientPayments.map((pay) => (
                          <div key={pay.id} className="p-4 flex justify-between items-center text-sm hover:bg-gray-800/10 transition-colors">
                            <div>
                              <p className="font-bold text-white">{pay.description || "Payment"}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(pay.paid_at).toLocaleDateString()} • Method: <span className="text-teal-accent font-medium capitalize">{pay.method}</span>
                              </p>
                            </div>
                            <span className="font-black text-white text-base">
                              +${Number(pay.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ASSIGN MEMBERSHIP */}
              {activeTab === "membership" && (
                <div className="space-y-6">
                  {/* Current Active Plan Status */}
                  <div className="p-4 border border-[#1a2e2b] bg-background/40 rounded-xl">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Active Plan Status</h3>
                    {clientMembership ? (
                      <div className="space-y-1.5 text-sm">
                        <p><span className="text-gray-400">Current Plan:</span> <span className="text-teal-accent font-bold">{clientMembership.plan_name}</span></p>
                        <p><span className="text-gray-400">Price:</span> <span className="text-white font-semibold">${Number(clientMembership.price).toFixed(2)} / month</span></p>
                        <p><span className="text-gray-400">Start Date:</span> <span className="text-white">{clientMembership.start_date}</span></p>
                        {clientMembership.stripe_subscription_id && (
                          <p><span className="text-gray-400">Stripe Sub ID:</span> <code className="text-xs text-purple-400">{clientMembership.stripe_subscription_id}</code></p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">This client currently does not have an active membership plan assigned. They are billed drop-in rates.</p>
                    )}
                  </div>

                  {/* Assign Plan Form */}
                  <form onSubmit={handleAssignMembership} className="p-5 border border-[#1a2e2b] bg-background/40 rounded-xl space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Assign or Modify Plan</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Plan Level</label>
                        <select
                          value={membershipForm.plan_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            let price = "29";
                            if (val === "Pro") price = "59";
                            if (val === "Studio") price = "99";
                            setMembershipForm({ ...membershipForm, plan_name: val, price });
                          }}
                          className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                        >
                          <option value="Starter">Starter ($29/mo)</option>
                          <option value="Pro">Pro ($59/mo)</option>
                          <option value="Studio">Studio ($99/mo)</option>
                          <option value="VIP">VIP (Custom)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Price ($ / month)</label>
                        <input
                          type="number"
                          required
                          value={membershipForm.price}
                          onChange={(e) => setMembershipForm({ ...membershipForm, price: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Start Date</label>
                        <input
                          type="date"
                          required
                          value={membershipForm.start_date}
                          onChange={(e) => setMembershipForm({ ...membershipForm, start_date: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full bg-teal-accent hover:bg-teal-650 text-background font-bold py-2 rounded-lg text-sm transition-colors"
                        >
                          Assign Membership Plan
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <User className="h-12 w-12 text-gray-600 mb-2" />
            <p className="text-sm">No client selected.</p>
            <p className="text-xs mt-1">Select a client from the left pane or add a new profile.</p>
          </div>
        )}
      </div>

    </div>
  );
}
