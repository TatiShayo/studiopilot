"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Users, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import type { ClassType } from "@/lib/types";
import { AIDescriptionButton } from "./ai-description-button";

export default function ClassTypesPage() {
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("20");
  const [price, setPrice] = useState("0");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchTypes = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("class_types")
      .select("*")
      .order("name");
    setClassTypes(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase.from("class_types").insert({
      name,
      duration_minutes: parseInt(duration),
      capacity: parseInt(capacity),
      price_cents: Math.round(parseFloat(price) * 100),
      description: description || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setDuration("60");
      setCapacity("20");
      setPrice("0");
      setDescription("");
      setShowForm(false);
      fetchTypes();
    }

    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    const supabase = createClient();
    await supabase.from("class_types").update({ active: !active }).eq("id", id);
    fetchTypes();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class Types</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define your studio's class offerings
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard/classes/schedule">
            <Button variant="outline" size="sm">
              View Schedule
            </Button>
          </a>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" /> New Class Type
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="max-w-lg mb-6">
          <CardHeader>
            <CardTitle>Create Class Type</CardTitle>
            <CardDescription>
              Define a new class offering for your studio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vinyasa Yoga"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="15"
                    step="15"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A dynamic flow for all levels..."
                  rows={2}
                />
                <AIDescriptionButton
                  classTypeName={name}
                  onDescription={setDescription}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Class Type"}
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
        {classTypes.map((ct) => (
          <Card key={ct.id} className={!ct.active ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{ct.name}</CardTitle>
                {ct.description && (
                  <CardDescription>{ct.description}</CardDescription>
                )}
              </div>
              <Badge variant={ct.active ? "default" : "outline"}>
                {ct.active ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {ct.duration_minutes} min
                </div>
                <div className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {ct.capacity}
                </div>
                {ct.price_cents > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="size-3.5" />$
                    {(ct.price_cents / 100).toFixed(2)}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(ct.id, ct.active)}
              >
                {ct.active ? "Deactivate" : "Activate"}
              </Button>
            </CardContent>
          </Card>
        ))}
        {!loading && classTypes.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No class types yet. Create your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
