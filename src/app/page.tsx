import Link from "next/link";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  UserCheck, 
  Check, 
  X, 
  Flame,
  ArrowRight,
  Shield,
  Smartphone,
  Zap
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-[#09100f] text-gray-200 min-h-screen font-sans flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      {/* Header */}
      <header className="border-b border-[#1a2e2b] bg-[#111a19]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-[#14b8a6]" />
            <span className="font-bold text-xl tracking-wider text-white">Studio<span className="text-[#14b8a6]">Pilot</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-[#14b8a6] transition-colors">Features</a>
            <a href="#comparison" className="hover:text-[#14b8a6] transition-colors">Mindbody vs Us</a>
            <a href="#pricing" className="hover:text-[#14b8a6] transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 border border-[#1a2e2b] rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800/40 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-[#14b8a6] hover:bg-teal-600 text-[#09100f] font-semibold rounded-lg text-sm transition-colors flex items-center gap-1.5"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden border-b border-[#1a2e2b]">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#14b8a6]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111a19] border border-[#1a2e2b] text-[#14b8a6] text-xs font-semibold mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#14b8a6] animate-pulse" />
            Replacing Mindbody, Acuity, and Pike13
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Run your studio. <br />
            <span className="text-[#14b8a6]">Not your software.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Mindbody costs up to $300+/month with predatory annual contracts and clunky 2000s interfaces. 
            StudioPilot gives you everything you need at a flat <span className="text-white font-semibold">$29/mo</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 bg-[#14b8a6] hover:bg-teal-600 text-[#09100f] font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-teal-500/10"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/booking-portal" 
              target="_blank"
              className="w-full sm:w-auto px-8 py-4 border border-[#1a2e2b] bg-[#111a19] hover:bg-gray-800/40 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-base"
            >
              View Booking Portal
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#14b8a6]" />
              <span>No Annual Contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#14b8a6]" />
              <span>Mobile-First Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#14b8a6]" />
              <span>Instant Local Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6 border-b border-[#1a2e2b]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Everything you need to grow</h2>
          <p className="text-gray-400 max-w-lg mx-auto">No bloat. Just the core tools to schedule, book, manage clients, and track revenue seamlessly.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Scheduling */}
          <div className="bg-[#111a19] border border-[#1a2e2b] p-8 rounded-2xl hover:border-teal-500/40 transition-colors group">
            <div className="h-12 w-12 bg-teal-550/10 rounded-xl flex items-center justify-center text-[#14b8a6] mb-6 group-hover:scale-110 transition-transform">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Class Scheduling</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Create class schedules with capacity parameters, automatic waitlist promotion, and simplified check-ins.
            </p>
          </div>

          {/* Client Profiles */}
          <div className="bg-[#111a19] border border-[#1a2e2b] p-8 rounded-2xl hover:border-teal-500/40 transition-colors group">
            <div className="h-12 w-12 bg-teal-550/10 rounded-xl flex items-center justify-center text-[#14b8a6] mb-6 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Client Database</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Maintain detailed history of attendance, payments, waiver approvals, tags (VIP/active), and staff notes.
            </p>
          </div>

          {/* Billing & Payments */}
          <div className="bg-[#111a19] border border-[#1a2e2b] p-8 rounded-2xl hover:border-teal-500/40 transition-colors group">
            <div className="h-12 w-12 bg-teal-550/10 rounded-xl flex items-center justify-center text-[#14b8a6] mb-6 group-hover:scale-110 transition-transform">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Payments & Billing</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Stripe subscription checkout or manual billing log for card, cash, or mobile money (M-Pesa) payments.
            </p>
          </div>

          {/* Staff Roster */}
          <div className="bg-[#111a19] border border-[#1a2e2b] p-8 rounded-2xl hover:border-teal-500/40 transition-colors group">
            <div className="h-12 w-12 bg-teal-550/10 rounded-xl flex items-center justify-center text-[#14b8a6] mb-6 group-hover:scale-110 transition-transform">
              <UserCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Staff Management</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Manage instructors, set schedules, assign class types, track work logs, and coordinate shift rosters.
            </p>
          </div>
        </div>
      </section>

      {/* Mindbody Comparison Table */}
      <section id="comparison" className="py-20 bg-[#111a19]/30 border-b border-[#1a2e2b]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why StudioPilot beats Mindbody</h2>
            <p className="text-gray-400">Compare the features and see why hundreds of gym owners are switching.</p>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-[#1a2e2b] bg-[#111a19]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1a2e2b] bg-[#09100f]/50">
                  <th className="p-6 text-sm font-bold text-white">Feature</th>
                  <th className="p-6 text-sm font-bold text-red-400">Mindbody</th>
                  <th className="p-6 text-sm font-bold text-[#14b8a6] bg-[#14b8a6]/5">StudioPilot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2e2b]">
                <tr>
                  <td className="p-6 text-sm font-medium text-white">Monthly Cost</td>
                  <td className="p-6 text-sm text-gray-400">$129 – $349+/mo</td>
                  <td className="p-6 text-sm text-white bg-[#14b8a6]/5 font-semibold">$29/mo flat</td>
                </tr>
                <tr>
                  <td className="p-6 text-sm font-medium text-white">Contracts</td>
                  <td className="p-6 text-sm text-gray-400">12-month contract, strict exit fees</td>
                  <td className="p-6 text-sm text-white bg-[#14b8a6]/5 font-semibold">Month-to-month, cancel anytime</td>
                </tr>
                <tr>
                  <td className="p-6 text-sm font-medium text-white">Class Scheduling</td>
                  <td className="p-6 text-sm text-gray-450"><Check className="h-5 w-5 text-green-500 inline mr-2" /> Yes (Clunky)</td>
                  <td className="p-6 text-sm text-white bg-[#14b8a6]/5"><Check className="h-5 w-5 text-[#14b8a6] inline mr-2" /> Yes (Modern & fast)</td>
                </tr>
                <tr>
                  <td className="p-6 text-sm font-medium text-white">Client Portal & Waitlist</td>
                  <td className="p-6 text-sm text-gray-450"><Check className="h-5 w-5 text-green-500 inline mr-2" /> Yes</td>
                  <td className="p-6 text-sm text-white bg-[#14b8a6]/5"><Check className="h-5 w-5 text-[#14b8a6] inline mr-2" /> Yes (Auto waitlist promotion)</td>
                </tr>
                <tr>
                  <td className="p-6 text-sm font-medium text-white">Payment Options</td>
                  <td className="p-6 text-sm text-gray-400">Only card, expensive terminal lockin</td>
                  <td className="p-6 text-sm text-white bg-[#14b8a6]/5"><Check className="h-5 w-5 text-[#14b8a6] inline mr-2" /> Card, Cash, and M-Pesa</td>
                </tr>
                <tr>
                  <td className="p-6 text-sm font-medium text-white">Setup time</td>
                  <td className="p-6 text-sm text-gray-400">Requires 3-day demo and sales call</td>
                  <td className="p-6 text-sm text-white bg-[#14b8a6]/5"><Check className="h-5 w-5 text-[#14b8a6] inline mr-2" /> Instant setup (under 2 minutes)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 max-w-6xl mx-auto px-6 text-center">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Simple, honest pricing</h2>
          <p className="text-gray-400">No hidden fees, no annual lock-ins. Grow at your own pace.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="bg-[#111a19] border border-[#1a2e2b] p-8 rounded-2xl text-left relative flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Starter</h3>
              <p className="text-xs text-gray-400 mb-6">Perfect for independent teachers or single location studios.</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-white">$29</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-gray-300 mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> 1 Location</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Unlimited Clients</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Class Scheduling & Bookings</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Basic Reports</li>
              </ul>
            </div>
            <Link 
              href="/dashboard" 
              className="w-full py-3 bg-[#14b8a6]/10 hover:bg-[#14b8a6]/20 text-[#14b8a6] font-bold rounded-lg text-sm text-center transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-[#111a19] border-2 border-[#14b8a6] p-8 rounded-2xl text-left relative flex flex-col justify-between shadow-xl shadow-teal-500/5">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#14b8a6] text-[#09100f] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Pro</h3>
              <p className="text-xs text-gray-400 mb-6">Great for multi-location studios or staff managers.</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-white">$59</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-gray-300 mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> 3 Locations</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Unlimited Clients</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Full Staff Management</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Stripe Subscription Checkout</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Cash/Card/M-Pesa Tracking</li>
              </ul>
            </div>
            <Link 
              href="/dashboard" 
              className="w-full py-3 bg-[#14b8a6] hover:bg-teal-650 text-[#09100f] font-bold rounded-lg text-sm text-center transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Studio */}
          <div className="bg-[#111a19] border border-[#1a2e2b] p-8 rounded-2xl text-left relative flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Studio</h3>
              <p className="text-xs text-gray-400 mb-6">For larger franchises needing unlimited capabilities.</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-white">$99</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-gray-300 mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Unlimited Locations</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Unlimited Staff</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Priority 24/7 Support</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#14b8a6]" /> Custom Branding Add-ons</li>
              </ul>
            </div>
            <Link 
              href="/dashboard" 
              className="w-full py-3 bg-[#14b8a6]/10 hover:bg-[#14b8a6]/20 text-[#14b8a6] font-bold rounded-lg text-sm text-center transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a2e2b] bg-[#111a19]/50 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-[#14b8a6]" />
            <span className="font-bold text-white">Studio<span className="text-[#14b8a6]">Pilot</span></span>
            <span className="text-xs text-gray-500">© 2026 StudioPilot. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/booking-portal" className="hover:text-white transition-colors">Client Booking Demo</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
