import Link from "next/link";
import { 
  db, 
  syncClassInstances, 
  Client, 
  Payment, 
  Booking, 
  ClassInstance, 
  ClassSchedule, 
  ClassType, 
  Staff 
} from "@/lib/db";
import { 
  Users, 
  TrendingUp, 
  CalendarDays, 
  DollarSign, 
  Plus, 
  UserPlus, 
  CreditCard,
  CheckCircle2,
  Calendar
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Sync classes for the current period (June 29 to July 12, 2026) to make sure instances exist
  await syncClassInstances("2026-06-29", "2026-07-12");

  // Load all raw data
  const clients = await db.clients.list();
  const payments = await db.payments.list();
  const bookings = await db.bookings.list();
  const instances = await db.classInstances.list();
  const schedules = await db.classSchedule.list();
  const classTypes = await db.classTypes.list();
  const staff = await db.staff.list();

  // 1. Calculate Revenue Metrics
  const totalRevenue = payments.reduce((acc, pay) => acc + Number(pay.amount), 0);
  
  // Weekly revenue (June 28 to July 4, 2026)
  const startOfWeek = new Date("2026-06-28T00:00:00Z");
  const endOfWeek = new Date("2026-07-04T23:59:59Z");
  const weeklyRevenue = payments
    .filter(pay => {
      const paidDate = new Date(pay.paid_at);
      return paidDate >= startOfWeek && paidDate <= endOfWeek;
    })
    .reduce((acc, pay) => acc + Number(pay.amount), 0);

  // 2. Client Metrics
  const activeClientsCount = clients.filter(c => c.is_active).length;
  const totalClientsCount = clients.length;
  const membershipTiers = clients.reduce((acc: Record<string, number>, c) => {
    acc[c.membership_tier] = (acc[c.membership_tier] || 0) + 1;
    return acc;
  }, {});

  // 3. Today's Classes (June 29, 2026)
  const todayDateStr = "2026-06-29";
  const todayInstances = instances.filter(inst => inst.date === todayDateStr && !inst.is_cancelled);
  
  const todayClasses = todayInstances.map(inst => {
    const sched = schedules.find(s => s.id === inst.class_schedule_id);
    const classType = sched ? classTypes.find(ct => ct.id === sched.class_type_id) : null;
    const instructor = sched ? staff.find(s => s.id === sched.instructor_id) : null;
    const classBookings = bookings.filter(b => b.class_instance_id === inst.id && b.status === "booked");

    return {
      instanceId: inst.id,
      name: classType?.name || "Unknown Class",
      time: sched ? `${sched.start_time} - ${sched.end_time}` : "N/A",
      instructor: instructor?.name || "TBA",
      booked: classBookings.length,
      capacity: classType?.capacity || 15,
      color: classType?.color || "#14b8a6",
      price: classType?.price || 0
    };
  }).sort((a, b) => a.time.localeCompare(b.time));

  // 4. Monthly Revenue Chart (mock breakdown by week for June 2026)
  const weeklyData = [
    { label: "Week 1", amount: 286 },
    { label: "Week 2", amount: 198 },
    { label: "Week 3", amount: 146 },
    { label: "Week 4 (Current)", amount: weeklyRevenue || 238 }
  ];
  const maxWeeklyAmount = Math.max(...weeklyData.map(w => w.amount), 1);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-surface border border-border-custom p-6 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-black text-white">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-teal-accent flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+14.2% from last month</span>
            </p>
          </div>
          <div className="h-12 w-12 bg-teal-550/10 text-teal-accent rounded-lg flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-surface border border-border-custom p-6 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Weekly Revenue</p>
            <p className="text-3xl font-black text-white">${weeklyRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-450">Week: June 28 - July 4</p>
          </div>
          <div className="h-12 w-12 bg-teal-550/10 text-teal-accent rounded-lg flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-surface border border-border-custom p-6 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Clients</p>
            <p className="text-3xl font-black text-white">{activeClientsCount} <span className="text-sm font-normal text-gray-400">/ {totalClientsCount}</span></p>
            <p className="text-xs text-gray-450">{totalClientsCount - activeClientsCount} inactive accounts</p>
          </div>
          <div className="h-12 w-12 bg-teal-550/10 text-teal-accent rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Classes Scheduled */}
        <div className="bg-surface border border-border-custom p-6 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Sessions</p>
            <p className="text-3xl font-black text-white">{todayClasses.length}</p>
            <p className="text-xs text-gray-450">Classes for Monday, Jun 29</p>
          </div>
          <div className="h-12 w-12 bg-teal-550/10 text-teal-accent rounded-lg flex items-center justify-center">
            <CalendarDays className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border-custom rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-accent" />
                Monday's Schedule (Today)
              </h2>
              <span className="text-xs bg-teal-accent/10 text-teal-accent px-2.5 py-1 rounded-full font-medium">
                June 29, 2026
              </span>
            </div>

            {todayClasses.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">No classes scheduled for today.</p>
                <Link href="/dashboard/classes" className="text-teal-accent hover:underline text-xs mt-2 inline-block">
                  Create a new class schedule
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {todayClasses.map((cls) => {
                  const percentFull = Math.min(100, Math.round((cls.booked / cls.capacity) * 100));
                  return (
                    <div 
                      key={cls.instanceId}
                      className="p-4 rounded-lg bg-background border border-border-custom hover:border-gray-700/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cls.color }} />
                        <div>
                          <p className="font-semibold text-sm text-white">{cls.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {cls.time} • Instructor: <span className="text-teal-accent">{cls.instructor}</span>
                          </p>
                        </div>
                      </div>

                      {/* Capacity Indicator */}
                      <div className="flex items-center gap-6">
                        <div className="text-left md:text-right shrink-0">
                          <p className="text-xs font-semibold text-white">{cls.booked} / {cls.capacity} Booked</p>
                          <div className="w-24 bg-gray-800 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="bg-teal-accent h-full"
                              style={{ width: `${percentFull}%` }}
                            />
                          </div>
                        </div>
                        <Link 
                          href={`/dashboard/classes?date=${todayDateStr}`}
                          className="px-3 py-1.5 border border-border-custom hover:bg-gray-800/40 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revenue Chart Section */}
          <div className="bg-surface border border-border-custom rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-6">June Revenue Summary</h2>
            
            {/* Visual Bar Chart */}
            <div className="h-48 flex items-end gap-6 pt-6 px-4">
              {weeklyData.map((item, idx) => {
                const barHeightPercent = Math.round((item.amount / maxWeeklyAmount) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="opacity-0 group-hover:opacity-100 bg-[#09100f] text-teal-accent text-xs px-2 py-0.5 rounded border border-border-custom transition-opacity font-bold">
                      ${item.amount}
                    </span>
                    <div 
                      className="w-full bg-[#1a2e2b] rounded-t group-hover:bg-teal-accent transition-colors cursor-pointer"
                      style={{ height: `${barHeightPercent}%`, minHeight: "10%" }}
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap mt-1">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar panels: Quick Actions & Membership Breakdown */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="bg-surface border border-border-custom rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-2.5">
              <Link 
                href="/dashboard/clients?action=new" 
                className="flex items-center gap-3 p-3 bg-background border border-border-custom hover:border-teal-500/30 hover:bg-teal-accent/5 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              >
                <UserPlus className="h-4.5 w-4.5 text-teal-accent" />
                <span>Add New Client</span>
              </Link>
              <Link 
                href="/dashboard/classes" 
                className="flex items-center gap-3 p-3 bg-background border border-border-custom hover:border-teal-500/30 hover:bg-teal-accent/5 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              >
                <Calendar className="h-4.5 w-4.5 text-teal-accent" />
                <span>Schedule a Class</span>
              </Link>
              <Link 
                href="/dashboard/billing?action=record" 
                className="flex items-center gap-3 p-3 bg-background border border-border-custom hover:border-teal-500/30 hover:bg-teal-accent/5 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              >
                <CreditCard className="h-4.5 w-4.5 text-teal-accent" />
                <span>Record Client Payment</span>
              </Link>
            </div>
          </div>

          {/* Membership tier breakdown */}
          <div className="bg-surface border border-border-custom rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Membership Tiers</h2>
            <div className="space-y-3.5">
              {Object.entries(membershipTiers).map(([tier, count]) => {
                const countNum = count as number;
                const percentage = Math.round((countNum / totalClientsCount) * 100);
                
                // Color codes for tiers
                const tierColor = 
                  tier === "VIP" ? "bg-purple-500" :
                  tier === "Studio" ? "bg-teal-accent" :
                  tier === "Pro" ? "bg-blue-500" :
                  tier === "Starter" ? "bg-emerald-555 text-emerald-400" : "bg-gray-600";
                
                const textColor = 
                  tier === "VIP" ? "text-purple-400" :
                  tier === "Studio" ? "text-teal-accent" :
                  tier === "Pro" ? "text-blue-405 text-blue-400" :
                  tier === "Starter" ? "text-emerald-400" : "text-gray-400";

                return (
                  <div key={tier} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={`${textColor}`}>{tier} Plan</span>
                      <span className="text-white">{countNum} clients ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${tierColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-surface border border-border-custom rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Recent Bookings</h2>
            <div className="space-y-4">
              {bookings.slice(0, 4).map((bk) => {
                const client = clients.find(c => c.id === bk.client_id);
                const inst = instances.find(i => i.id === bk.class_instance_id);
                const sched = inst ? schedules.find(s => s.id === inst.class_schedule_id) : null;
                const classType = sched ? classTypes.find(ct => ct.id === sched.class_type_id) : null;

                return (
                  <div key={bk.id} className="flex gap-3 text-xs leading-relaxed">
                    <div className="h-6 w-6 rounded-full bg-teal-accent/10 border border-teal-accent/20 flex items-center justify-center shrink-0 text-[10px] text-teal-accent font-bold">
                      BK
                    </div>
                    <div>
                      <p className="text-gray-200">
                        <span className="font-semibold text-white">
                          {client ? `${client.first_name} ${client.last_name}` : "A client"}
                        </span>{" "}
                        booked <span className="font-semibold text-teal-accent">{classType?.name || "Class"}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(bk.booked_at).toLocaleDateString()} at {sched?.start_time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
