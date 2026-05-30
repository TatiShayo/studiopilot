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
import { Badge } from "@/components/ui/badge";
import { Ticket, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ClassCreditsProps {
  clientId: string;
  credits: number;
}

const PACK_OPTIONS = [
  { label: "5 Classes", count: 5, price: "40" },
  { label: "10 Classes", count: 10, price: "75" },
  { label: "20 Classes", count: 20, price: "140" },
];

export default function ClientClassCredits({ clientId, credits }: ClassCreditsProps) {
  const [currentCredits, setCurrentCredits] = useState(credits);
  const [showPack, setShowPack] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [customCount, setCustomCount] = useState("");
  const [saving, setSaving] = useState(false);

  const addCredits = async (count: number, price: string) => {
    setSaving(true);
    const supabase = createClient();

    const priceCents = Math.round(parseFloat(price) * 100);

    await supabase.from("payments").insert({
      client_id: clientId,
      amount_cents: priceCents,
      method: "cash",
      description: `${count}-Class Pack Purchase`,
      paid_at: new Date().toISOString(),
    });

    await supabase
      .from("clients")
      .update({ class_credits: currentCredits + count })
      .eq("id", clientId);

    setCurrentCredits((c) => c + count);
    toast.success(`${count}-class pack sold!`);
    setShowPack(false);
    setSaving(false);
  };

  const handleCustomPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCount || !customPrice) return;
    await addCredits(parseInt(customCount), customPrice);
    setCustomCount("");
    setCustomPrice("");
  };

  const subtractOne = async () => {
    if (currentCredits <= 0) return;
    const supabase = createClient();
    const newCredits = currentCredits - 1;
    await supabase
      .from("clients")
      .update({ class_credits: newCredits })
      .eq("id", clientId);
    setCurrentCredits(newCredits);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Ticket className="size-4" />
            Class Credits
          </span>
          <Badge variant={currentCredits > 0 ? "default" : "outline"}>
            {currentCredits} remaining
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentCredits > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Use 1 credit</span>
            <Button size="icon" variant="outline" className="size-7" onClick={subtractOne}>
              <Minus className="size-3" />
            </Button>
          </div>
        )}

        {!showPack ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowPack(true)}
          >
            <Plus className="size-4" /> Sell Class Pack
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Prepaid class packs</p>
            <div className="space-y-2">
              {PACK_OPTIONS.map((p) => (
                <Button
                  key={p.count}
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  disabled={saving}
                  onClick={() => addCredits(p.count, p.price)}
                >
                  <span>{p.label}</span>
                  <span className="font-bold">${p.price}</span>
                </Button>
              ))}
            </div>

            <form onSubmit={handleCustomPack} className="space-y-2 border-t pt-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Classes</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={customCount}
                    onChange={(e) => setCustomCount(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="75"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full" disabled={saving}>
                {saving ? "Selling..." : "Sell Custom Pack"}
              </Button>
            </form>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowPack(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
