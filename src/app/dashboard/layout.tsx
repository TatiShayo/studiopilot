import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  UserCircle,
  LogOut,
} from "lucide-react";
import { type ReactNode } from "react";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/classes", label: "Classes", icon: Calendar },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/staff", label: "Staff", icon: UserCircle },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <aside className="hidden w-56 shrink-0 border-r bg-white dark:bg-zinc-950 md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <LayoutDashboard className="size-5 text-primary" />
          <span className="font-semibold">StudioPilot</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 px-3 text-xs text-muted-foreground truncate">
            {user.email}
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:hidden">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 dark:bg-zinc-950">
          <span className="font-semibold">StudioPilot</span>
          <form action={signOut}>
            <Button variant="ghost" size="icon">
              <LogOut className="size-4" />
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4">{children}</main>
        <nav className="flex border-t bg-white dark:bg-zinc-950">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="hidden flex-1 p-6 md:block">{children}</main>
    </div>
  );
}
