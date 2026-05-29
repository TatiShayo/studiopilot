"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { bookClientIntoClass } from "../book-actions";
import { Search, UserPlus } from "lucide-react";
import type { Client } from "@/lib/types";

export function BookClientForm({ classId }: { classId: string }) {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (search.length < 2) {
      setClients([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("id, name, email, status")
        .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
        .eq("status", "active")
        .order("name")
        .limit(8);
      setClients((data as Client[]) ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBook = async (clientId: string) => {
    setLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("classId", classId);
    const result = await bookClientIntoClass(formData);
    if ("error" in result && result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      const status = result.status;
      setMessage({
        type: "success",
        text: status === "waitlisted" ? "Added to waitlist" : "Booked successfully",
      });
      router.refresh();
    }
    setLoading(false);
    setSearch("");
    setClients([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Book a Client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {searching && (
          <p className="text-xs text-muted-foreground">Searching...</p>
        )}
        {clients.length > 0 && (
          <div className="space-y-1">
            {clients.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                onClick={() => handleBook(c.id)}
                disabled={loading}
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
                <UserPlus className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
        {message && (
          <p
            className={`text-xs ${
              message.type === "error" ? "text-destructive" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
