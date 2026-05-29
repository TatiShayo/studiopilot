import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  CreditCard,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-zinc-950">
        <span className="font-bold text-lg">StudioPilot</span>
        <div className="flex items-center gap-3">
          <Link href="/book">
            <Button variant="ghost" size="sm">
              Book a class
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="flex flex-col items-center px-6 py-24 text-center">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Run your studio.
            <br />
            Not your software.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Everything Mindbody does — class scheduling, client profiles,
            payments, staff management — at $29/mo flat with modern UX.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/auth/login">
              <Button size="lg">
                Get started <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                Book a demo
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            No credit card required. Cancel anytime.
          </p>
        </section>

        <section className="grid gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {[
            {
              icon: Calendar,
              title: "Class Scheduling",
              desc: "Weekly recurring schedule, waitlists, and automatic client notifications.",
            },
            {
              icon: Users,
              title: "Client Profiles",
              desc: "Membership status, visit history, medical notes, and payment timeline.",
            },
            {
              icon: CreditCard,
              title: "Payments",
              desc: "Stripe subscriptions, M-Pesa, cash/card logging, revenue dashboard.",
            },
            {
              icon: Sparkles,
              title: "AI-Powered",
              desc: "Auto-generated class descriptions and retention alerts for inactive clients.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border bg-white dark:bg-zinc-950 p-6"
            >
              <Icon className="size-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>

        <section className="px-6 py-16 bg-muted/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold">
              Mindbody costs $129–$300+/mo. We&apos;re $29/mo flat.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 text-left">
              {[
                { label: "StudioPilot", price: "$29/mo", tag: "Unlimited clients" },
                { label: "Mindbody", price: "$129+/mo", tag: "Annual contract" },
                { label: "Acuity", price: "$61/mo", tag: "Limited features" },
              ].map(({ label, price, tag }) => (
                <div
                  key={label}
                  className="rounded-lg border bg-white dark:bg-zinc-950 p-4"
                >
                  <div className="text-sm text-muted-foreground">{label}</div>
                  <div className="text-xl font-bold mt-1">{price}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        StudioPilot — Month to month. No contracts. Built for independent studios.
      </footer>
    </div>
  );
}
