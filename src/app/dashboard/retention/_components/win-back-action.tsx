"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle } from "lucide-react";

export function WinBackAction({ contactId }: { contactId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch("/api/retention/win-back", {
        method: "POST",
        body: JSON.stringify({ contactId }),
      });
      if (res.ok) {
        setSent(true);
      }
    } catch (error) {
      console.error("Failed to send win-back email", error);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full text-xs gap-2 text-green-600 border-green-200 bg-green-50">
        <CheckCircle className="size-3" /> Sent
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="w-full text-xs gap-2"
      onClick={handleSend}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Mail className="size-3" />
      )}
      Win Back
    </Button>
  );
}
