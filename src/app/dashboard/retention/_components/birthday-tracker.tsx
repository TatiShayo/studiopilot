"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isWithinInterval, startOfWeek, endOfWeek, addYears, setYear } from "date-fns";
import { Gift, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export function BirthdayTracker() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBirthdays() {
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("id, name, birth_date, email")
        .not("birth_date", "is", null);

      const now = new Date();
      const start = startOfWeek(now);
      const end = endOfWeek(now);

      const birthdayBoysAndGirls = (data || []).filter((client: any) => {
        const bday = new Date(client.birth_date);
        // Set birthday to current year to check if it's this week
        const thisYearBday = setYear(bday, now.getFullYear());
        return isWithinInterval(thisYearBday, { start, end });
      });

      setClients(birthdayBoysAndGirls);
      setLoading(false);
    }

    fetchBirthdays();
  }, []);

  const sendBirthdayEmail = async (client: any) => {
    setSending(client.id);
    try {
      // In a real app, this would call an API route
      const res = await fetch("/api/retention/birthday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clientId: client.id
        }),
      });

      if (res.ok) {
        toast.success(`Birthday greeting sent to ${client.name}!`);
      } else {
        toast.error("Failed to send birthday email.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setSending(null);
    }
  };

  if (loading) return null;
  if (clients.length === 0) return null;

  return (
    <Card className="border-blue-100 bg-blue-50/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>🎂</span> Birthdays This Week
        </CardTitle>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          {clients.length} {clients.length === 1 ? "Client" : "Clients"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-blue-100">
          {clients.map((client) => (
            <div key={client.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(client.birth_date), "MMMM d")}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 h-8 text-xs"
                onClick={() => sendBirthdayEmail(client)}
                disabled={sending === client.id}
              >
                {sending === client.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Mail className="size-3" />
                )}
                Send Birthday Email
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
