"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import type { MembershipPlan } from "@/lib/types";

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [tier, setTier] = useState("monthly");
  const [price, setPrice] = useState("29");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchPlans = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("membership_plans")
      .select("*")
      .order("name");
    setPlans(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase.from("membership_plans").insert({
      name,
      tier,
      price_cents: Math.round(parseFloat(price) * 100),
      interval: tier === "monthly" ? "month" : tier === "per_class" ? "per_class" : "one_time",
      description: description || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setPrice("29");
      setDescription("");
      setShowForm(false);
      fetchPlans();
    }

    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    const supabase = createClient();
    await supabase
      .from("membership_plans")
      .update({ active: !active })
      .eq("id", id);
    fetchPlans();
  };

  const formatInterval = (interval: string) =>
    interval === "month" ? "/month" : interval === "per_class" ? "/class" : " one-time";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Membership Plans</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" /> New Plan
        </Button>
      </div>

      {showForm && (
        <Card className="max-w-lg mb-6">
          <CardHeader>
            <CardTitle>Create Plan</CardTitle>
            <CardDescription>Define a new membership tier for clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="planName">Plan Name</Label>
                <Input
                  id="planName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Unlimited Monthly"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tier</Label>
                <Select value={tier} onValueChange={(v) => setTier(v ?? "monthly")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="per_class">Per Class</SelectItem>
                    <SelectItem value="drop_in">Drop-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Unlimited classes per month"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Plan"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.active ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.tier.replace("_", " ")}</CardDescription>
              </div>
              <Badge variant={plan.active ? "default" : "outline"}>
                {plan.active ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold">
                  ${(plan.price_cents / 100).toFixed(0)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatInterval(plan.interval)}
                </span>
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {plan.description}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(plan.id, plan.active)}
              >
                {plan.active ? "Deactivate" : "Activate"}
              </Button>
            </CardContent>
          </Card>
        ))}
        {!loading && plans.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No membership plans yet.
          </p>
        )}
      </div>
    </div>
  );
}
