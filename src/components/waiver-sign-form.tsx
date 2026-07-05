"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const WAIVER_TEXT =
  "I hereby acknowledge that participation in fitness classes, yoga sessions, or any physical activities at this studio involves inherent risks. I confirm that I am physically able to participate and will inform the instructor of any medical conditions, injuries, or limitations. I release the studio, its owners, instructors, and staff from any liability for injuries or damages sustained during classes. I understand that this waiver is binding and applies to all future visits.";

interface WaiverSignPageProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  alreadySigned?: string | null;
}

export function WaiverSignForm({
  clientId,
  clientName,
  clientEmail,
  alreadySigned,
}: WaiverSignPageProps) {
  const [signedName, setSignedName] = useState(clientName);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!alreadySigned);
  const [error, setError] = useState("");

  const handleSign = async () => {
    if (!accepted) {
      setError("You must accept the terms by checking the box above.");
      return;
    }
    if (!signedName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase.from("waivers").upsert(
      {
        client_id: clientId,
        signed_name: signedName.trim(),
        waiver_text: WAIVER_TEXT,
        accepted: true,
        signed_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );

    if (insertError) {
      setError(insertError.message);
    } else {
      setDone(true);
    }

    setSaving(false);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md pt-12 text-center">
        <CheckCircle2 className="size-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Waiver Signed</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {alreadySigned
            ? `Signed on ${new Date(alreadySigned).toLocaleDateString()}`
            : "Your waiver has been submitted successfully."}
        </p>
        <Link href="/book">
          <Button>
            <ArrowLeft className="size-4" /> Book a Class
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Liability Waiver</h1>
        <p className="text-sm text-muted-foreground">
          Please read and sign before your first class.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="size-5 text-primary" />
            Waiver of Liability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground mb-6">
            {WAIVER_TEXT}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signedName">Full Name</Label>
              <Input
                id="signedName"
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                placeholder="Your legal name"
                required
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 size-4 rounded border-muted-foreground"
              />
              <span className="text-sm text-muted-foreground">
                I have read and understand the waiver. I confirm that {signedName || clientName} is
                my legal name and I agree to the terms above.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSign} disabled={saving} className="flex-1">
                {saving ? "Submitting..." : "Sign Waiver"}
              </Button>
              <Link href="/book">
                <Button variant="ghost">Cancel</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
