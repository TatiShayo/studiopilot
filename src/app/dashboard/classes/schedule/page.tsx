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
import { ArrowLeft, Plus, Clock, Users, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { RecurringSchedule, ClassType, Staff } from "@/lib/types";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type RecurringWithJoins = RecurringSchedule & {
  class_types: ClassType | null;
  staff: Staff | null;
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<RecurringWithJoins[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [classTypeId, setClassTypeId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [staffId, setStaffId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchAll = async () => {
    const supabase = createClient();
    const [typesRes, staffRes, schedRes] = await Promise.all([
      supabase.from("class_types").select("*").eq("active", true).order("name"),
      supabase.from("staff").select("*").eq("active", true).order("name"),
      supabase
        .from("recurring_schedules")
        .select("*, class_types(*), staff(*)")
        .order("day_of_week")
        .order("start_time"),
    ]);
    setClassTypes(typesRes.data ?? []);
    setStaffList(staffRes.data ?? []);
    setSchedules((schedRes.data as RecurringWithJoins[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classTypeId) {
      setError("Please select a class type");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase.from("recurring_schedules").insert({
      class_type_id: classTypeId,
      day_of_week: parseInt(dayOfWeek),
      start_time: startTime,
      staff_id: staffId || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setClassTypeId("");
      setDayOfWeek("1");
      setStartTime("09:00");
      setStaffId("");
      setShowForm(false);
      fetchAll();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("recurring_schedules").delete().eq("id", id);
    fetchAll();
  };

  const grouped: Record<number, RecurringWithJoins[]> = {};
  for (const s of schedules) {
    if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
    grouped[s.day_of_week].push(s);
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/classes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Weekly Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set your recurring weekly class times
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" /> Add Time Slot
        </Button>
      </div>

      {showForm && (
        <Card className="max-w-lg mb-6">
          <CardHeader>
            <CardTitle>Add Recurring Class</CardTitle>
            <CardDescription>
              Classes will be auto-generated each week on this day/time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Class Type</Label>
                <Select value={classTypeId} onValueChange={(v) => setClassTypeId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select class type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.name} ({ct.duration_minutes}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Day</Label>
                  <Select value={dayOfWeek} onValueChange={(v) => setDayOfWeek(v ?? "1")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Instructor (optional)</Label>
                <Select value={staffId} onValueChange={(v) => setStaffId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select instructor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Adding..." : "Add to Schedule"}
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

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border bg-white dark:bg-zinc-950 p-12 text-center">
          <p className="text-muted-foreground">
            No recurring classes scheduled yet. Add your first time slot.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {DAYS.map((day) => {
            const slots = grouped[day.value];
            if (!slots || slots.length === 0) return null;
            return (
              <Card key={day.value}>
                <CardHeader>
                  <CardTitle className="text-base">{day.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {slots.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Clock className="size-3.5 text-muted-foreground" />
                          {s.start_time}
                        </div>
                        <Badge variant="secondary">
                          {s.class_types?.name ?? "Unknown"}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" />
                          {s.class_types?.capacity ?? "-"}
                        </div>
                        {s.staff && (
                          <span className="text-xs text-muted-foreground">
                            · {s.staff.name}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
