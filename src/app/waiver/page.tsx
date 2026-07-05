"use client";

import { createClient } from "@/lib/supabase/client";
import { WaiverSignForm } from "@/components/waiver-sign-form";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ClientData {
  id: string;
  name: string;
  email: string;
}

interface WaiverData {
  signed_at: string;
}

export default function WaiverPage() {
  const [client, setClient] = useState<ClientData | null>(null);
  const [waiver, setWaiver] = useState<WaiverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to sign the waiver.");
        setLoading(false);
        return;
      }

      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("email", user.email)
        .maybeSingle();

      if (!clientData) {
        setError("No client profile found. Please contact your studio.");
        setLoading(false);
        return;
      }

      setClient(clientData);

      const { data: waiverData } = await supabase
        .from("waivers")
        .select("signed_at")
        .eq("client_id", clientData.id)
        .maybeSingle();

      setWaiver(waiverData);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md pt-12 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <WaiverSignForm
        clientId={client.id}
        clientName={client.name}
        clientEmail={client.email}
        alreadySigned={waiver?.signed_at ?? null}
      />
    </div>
  );
}
