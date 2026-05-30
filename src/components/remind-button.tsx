"use client";

import { Button } from "@/components/ui/button";
import { Mail, Check, Loader2 } from "lucide-react";
import { useState } from "react";

export function RemindButton({ clientId }: { clientId: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleRemind = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/clients/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => setSent(false), 2500);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Button variant="ghost" size="sm" className="text-green-600" disabled>
        <Check className="size-3.5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemind}
      disabled={sending}
      title="Send reminder"
    >
      {sending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Mail className="size-3.5" />
      )}
    </Button>
  );
}
