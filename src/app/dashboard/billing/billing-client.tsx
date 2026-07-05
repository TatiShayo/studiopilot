"use client";

import { useState } from "react";
import { Client, Payment, Membership } from "@/lib/db";
import { recordPaymentAction } from "../actions";
import { 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  Plus, 
  Calendar,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface BillingClientProps {
  clients: Client[];
  payments: Payment[];
  memberships: Membership[];
}

export default function BillingClient({
  clients,
  payments,
  memberships
}: BillingClientProps) {
  // Form State
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [description, setDescription] = useState("Starter Membership Renewal");
  const [isRecording, setIsRecording] = useState(false);

  // Stripe Mock checkout state
  const [selectedStripePlan, setSelectedStripePlan] = useState("Pro");

  // 1. Calculate Revenue Breakdown by Method
  const methodTotals = payments.reduce((acc: Record<string, number>, p) => {
    acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
    return acc;
  }, {});

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  // 2. Identify Outstanding Balances
  // If a client has a membership tier (Starter, Pro, Studio, VIP) but NO payment in the last 30 days (since June 29, 2026)
  // Let's set 30 days ago limit date as May 30, 2026
  const limitDate = new Date("2026-05-30T00:00:00Z");
  
  const outstandingClients = clients
    .filter(c => c.membership_tier !== "None" && c.is_active)
    .map(c => {
      // Find client payments
      const clientPays = payments.filter(p => p.client_id === c.id);
      // Sort payments newest first
      const sortedPays = [...clientPays].sort(
        (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
      );
      
      const lastPayment = sortedPays[0];
      const hasPaidRecently = lastPayment && new Date(lastPayment.paid_at) >= limitDate;

      // Calculate expected cost
      let expectedCost = 29;
      if (c.membership_tier === "Pro") expectedCost = 59;
      if (c.membership_tier === "Studio" || c.membership_tier === "VIP") expectedCost = 99;

      return {
        client: c,
        lastPaymentDate: lastPayment ? new Date(lastPayment.paid_at).toLocaleDateString() : "Never",
        amountDue: expectedCost,
        isOverdue: !hasPaidRecently
      };
    })
    .filter(item => item.isOverdue);

  // Actions
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !amount) {
      alert("Please fill in all payment fields.");
      return;
    }

    setIsRecording(true);
    const res = await recordPaymentAction({
      client_id: clientId,
      amount: Number(amount),
      currency: "USD",
      method,
      description
    });
    setIsRecording(false);

    if (res.success) {
      setAmount("");
      setClientId("");
      alert("Manual payment successfully recorded and synced!");
    } else {
      alert("Failed to record payment: " + res.error);
    }
  };

  const triggerStripeCheckout = async () => {
    // Redirects to Stripe subscription Checkout API
    const lookupKey = 
      selectedStripePlan === "Starter" ? "price_starter" :
      selectedStripePlan === "Pro" ? "price_pro" : "price_studio";

    // Call API checkout endpoint
    window.open(`/api/stripe/checkout?lookup_key=${lookupKey}`, "_blank");
    alert("Stripe Checkout process opened! In a real production setup, this redirects to the Stripe hosted checkout screen. For dev testing, fallback session handlers are triggered.");
  };

  return (
    <div className="space-y-8">
      
      {/* Stripe SaaS Plan Selector */}
      <div className="bg-surface border border-border-custom rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-custom pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal-accent" />
              SaaS Subscription Plan (Stripe)
            </h2>
            <p className="text-xs text-gray-400 mt-1">Configure your own StudioPilot subscription plan and Stripe checkout gateway integrations.</p>
          </div>
          <span className="text-[10px] bg-purple-550/15 text-purple-400 border border-purple-550/20 px-2 py-0.5 rounded font-black tracking-wider uppercase">
            Billing Portal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {(["Starter", "Pro", "Studio"] as const).map((plan) => {
            const isSelected = plan === selectedStripePlan;
            const price = plan === "Starter" ? "$29" : plan === "Pro" ? "$59" : "$99";
            const details = 
              plan === "Starter" ? "1 Location, Unlimited Clients" :
              plan === "Pro" ? "3 Locations + Staff Management" : "Unlimited Locations & Staff";

            return (
              <div
                key={plan}
                onClick={() => setSelectedStripePlan(plan)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? "bg-teal-accent/5 border-teal-accent"
                    : "bg-background border-border-custom hover:border-gray-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-bold ${isSelected ? "text-teal-accent" : "text-white"}`}>{plan} Tier</span>
                  {isSelected && <CheckCircle className="h-4 w-4 text-teal-accent" />}
                </div>
                <p className="text-2xl font-black text-white mt-3">{price}<span className="text-xs text-gray-500 font-medium">/mo</span></p>
                <p className="text-[11px] text-gray-400 mt-1">{details}</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={triggerStripeCheckout}
          className="bg-teal-accent hover:bg-teal-650 text-background text-sm font-bold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-teal-500/10"
        >
          <span>Purchase {selectedStripePlan} Plan via Stripe</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Record manual payment & Overdue (7/12 width) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Manual Payment Recorder */}
          <div className="bg-surface border border-border-custom rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-4.5 w-4.5 text-teal-accent" />
              Record Client Payment (Cash, Card, M-Pesa)
            </h2>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Select Client</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.last_name}, {c.first_name} ({c.membership_tier} Plan)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Amount ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 29.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="card">Card (Stripe / In-Studio)</option>
                    <option value="cash">Cash</option>
                    <option value="M-Pesa">M-Pesa Mobile Money</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Payment Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Starter Membership Renewal"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-background border border-border-custom rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-border-custom pt-4">
                <button
                  type="submit"
                  disabled={isRecording}
                  className="bg-teal-accent hover:bg-teal-650 text-background font-bold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isRecording ? "Syncing..." : "Record Payment"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Outstanding Balances list */}
          <div className="bg-surface border border-border-custom rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-yellow-500" />
              Outstanding Balances & Overdue Accounts
            </h2>

            {outstandingClients.length === 0 ? (
              <p className="text-gray-500 text-xs py-4 pl-2">All client accounts are paid and up to date.</p>
            ) : (
              <div className="border border-border-custom rounded-xl divide-y divide-border-custom bg-background/20">
                {outstandingClients.map((item) => (
                  <div key={item.client.id} className="p-3.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{item.client.first_name} {item.client.last_name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Plan: <span className="text-teal-accent">{item.client.membership_tier}</span> • Last payment: {item.lastPaymentDate}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                        Overdue: ${item.amountDue}.00
                      </span>
                      <button
                        onClick={() => {
                          setClientId(item.client.id);
                          setAmount(item.amountDue.toString());
                          setDescription(`${item.client.membership_tier} Membership Renewal`);
                        }}
                        className="text-teal-accent hover:text-white transition-colors hover:underline font-bold"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Revenue Charts & logs (5/12 width) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Revenue metrics and charts */}
          <div className="bg-surface border border-border-custom rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Payment Method Breakdown</h2>
              <p className="text-xs text-gray-450 mt-1">Total revenue: ${totalRevenue.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              {["card", "cash", "M-Pesa"].map((meth) => {
                const total = methodTotals[meth] || 0;
                const percentage = totalRevenue > 0 ? Math.round((total / totalRevenue) * 100) : 0;
                
                // Color codes
                const barColor = 
                  meth === "card" ? "bg-teal-accent" :
                  meth === "cash" ? "bg-blue-500" : "bg-purple-550 bg-purple-550/80 text-purple-400 bg-purple-400";
                
                const label = 
                  meth === "card" ? "Card / Stripe" :
                  meth === "cash" ? "Cash payments" : "M-Pesa Mobile";

                return (
                  <div key={meth} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300 capitalize">{label}</span>
                      <span className="text-white">${total.toFixed(2)} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border-custom">
                      <div 
                        className={`h-full ${barColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment list logs */}
          <div className="bg-surface border border-border-custom rounded-xl p-6 flex flex-col max-h-[350px]">
            <h2 className="text-base font-bold text-white mb-4">Recent Payment Log</h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {payments.slice(0, 7).map((pay) => {
                const client = clients.find(c => c.id === pay.client_id);
                return (
                  <div key={pay.id} className="p-3 bg-background/50 border border-border-custom rounded-lg flex items-center justify-between text-xs hover:border-gray-800 transition-colors">
                    <div>
                      <p className="font-bold text-white truncate max-w-[140px]">
                        {client ? `${client.first_name} ${client.last_name}` : "Client"}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[160px]">
                        {pay.description} • <span className="capitalize">{pay.method}</span>
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className="font-bold text-teal-accent block">${Number(pay.amount).toFixed(0)}</span>
                      <span className="text-[9px] text-gray-550 block mt-0.5">{new Date(pay.paid_at).toLocaleDateString()}</span>
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
