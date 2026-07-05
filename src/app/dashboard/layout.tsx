"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserCheck, 
  CreditCard, 
  ExternalLink,
  Flame
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Classes", href: "/dashboard/classes", icon: Calendar },
  { name: "Staff", href: "/dashboard/staff", icon: UserCheck },
  { name: "Billing & Payments", href: "/dashboard/billing", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border-custom flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border-custom gap-2">
            <Flame className="h-6 w-6 text-teal-accent" />
            <span className="font-bold text-lg tracking-wider text-white">Studio<span className="text-teal-accent">Pilot</span></span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-teal-accent/10 text-teal-accent"
                      : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions inside sidebar */}
        <div className="p-4 border-t border-border-custom space-y-2">
          <Link
            href="/booking-portal"
            target="_blank"
            className="flex items-center justify-between w-full px-4 py-2.5 bg-teal-accent hover:bg-teal-600 text-background font-semibold rounded-lg text-xs transition-colors"
          >
            <span>Booking Portal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          
          <Link
            href="/"
            className="flex items-center justify-center w-full px-4 py-2 text-gray-400 hover:text-white text-xs text-center hover:bg-gray-850 rounded-lg transition-colors"
          >
            Back to Landing
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border-custom bg-surface flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-semibold text-white">
              {NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.name || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Logged in as Owner</p>
              <p className="text-sm font-medium text-teal-accent">Downtown Sanctuary</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-teal-accent/20 border border-teal-accent/50 flex items-center justify-center text-teal-accent font-bold text-sm">
              OS
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
