"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Plus, X, Mail, Phone, User, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { Staff, StaffHours } from "@/lib/types";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [hoursRecords, setHoursRecords] = useState<StaffHours[]>([]);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [showHoursForm, setShowHoursForm] = useState(false);
  const [hoursStaffId, setHoursStaffId] = useState("");
  const [hoursDate, setHoursDate] = useState("");
  const [hoursValue, setHoursValue] = useState("");
  const [hoursRate, setHoursRate] = useState("");
  const [hoursNotes, setHoursNotes] = useState("");
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursError, setHoursError] = useState("");
  const [hoursFilterStaff, setHoursFilterStaff] = useState("all");

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const fetchStaff = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from("staff").select("*").order("name");
    setStaff((data as Staff[]) ?? []);
    setLoading(false);
  };

  const fetchHours = async () => {
    setHoursLoading(true);
    const supabase = getSupabase();
    let query = supabase
      .from("staff_hours")
      .select("*")
      .order("date", { ascending: false });

    if (hoursFilterStaff !== "all") {
      query = query.eq("staff_id", hoursFilterStaff);
    }

    const { data } = await query;
    setHoursRecords((data as StaffHours[]) ?? []);
    setHoursLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchHours();
  }, [hoursFilterStaff]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setBio("");
    setPhotoUrl("");
    setSpecialties([]);
    setSpecialtyInput("");
    setEditingId(null);
    setError("");
  };

  const handleEdit = (s: Staff) => {
    setEditingId(s.id);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone ?? "");
    setBio(s.bio ?? "");
    setPhotoUrl(s.photo_url ?? "");
    setSpecialties(s.specialties ?? []);
    setShowForm(true);
  };

  const handleAddSpecialty = () => {
    const val = specialtyInput.trim();
    if (val && !specialties.includes(val)) {
      setSpecialties([...specialties, val]);
    }
    setSpecialtyInput("");
  };

  const removeSpecialty = (s: string) => {
    setSpecialties(specialties.filter((t) => t !== s));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSaving(true);
    setError("");

    const supabase = getSupabase();
    const payload = { name, email, phone, bio, photo_url: photoUrl || null, specialties };

    if (editingId) {
      const { error: updateErr } = await supabase
        .from("staff")
        .update(payload)
        .eq("id", editingId);
      if (updateErr) {
        setError(updateErr.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertErr } = await supabase.from("staff").insert(payload);
      if (insertErr) {
        setError(insertErr.message);
        setSaving(false);
        return;
      }
    }

    resetForm();
    setShowForm(false);
    setSaving(false);
    fetchStaff();
  };

  const toggleActive = async (id: string, active: boolean) => {
    const supabase = getSupabase();
    await supabase.from("staff").update({ active: !active }).eq("id", id);
    fetchStaff();
  };

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoursStaffId || !hoursDate || !hoursValue) return;

    setHoursSaving(true);
    setHoursError("");
    const supabase = getSupabase();

    const { error: insertErr } = await supabase.from("staff_hours").insert({
      staff_id: hoursStaffId,
      date: hoursDate,
      hours: parseFloat(hoursValue),
      rate_kes: parseInt(hoursRate || "0", 10),
      notes: hoursNotes,
    });

    if (insertErr) {
      setHoursError(insertErr.message);
      setHoursSaving(false);
      return;
    }

    setHoursStaffId("");
    setHoursDate("");
    setHoursValue("");
    setHoursRate("");
    setHoursNotes("");
    setShowHoursForm(false);
    setHoursSaving(false);
    fetchHours();
  };

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyTotal = hoursRecords
    .filter((r) => r.date.startsWith(currentMonth))
    .reduce((sum, r) => sum + r.hours, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage instructors, studio staff, and hours log
          </p>
        </div>
      </div>

      <Tabs defaultValue="profiles">
        <TabsList className="mb-6">
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="hours">Hours Log</TabsTrigger>
        </TabsList>

        {/* === PROFILES TAB === */}
        <TabsContent value="profiles">
          <div className="flex items-center justify-end mb-4">
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
            >
              <Plus className="size-4" /> Add Staff
            </Button>
          </div>

          {showForm && (
            <Card className="max-w-lg mb-6">
              <CardHeader>
                <CardTitle>{editingId ? "Edit Staff" : "Add Staff"}</CardTitle>
                <CardDescription>
                  {editingId
                    ? "Update staff member details."
                    : "Add a new instructor or staff member."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="staffName">Name</Label>
                    <Input
                      id="staffName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Muthoni"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="staffEmail">Email</Label>
                      <Input
                        id="staffEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@studio.com"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="staffPhone">Phone</Label>
                      <Input
                        id="staffPhone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+254..."
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="staffPhotoUrl">Photo URL (optional)</Label>
                    <Input
                      id="staffPhotoUrl"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Specialties</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        placeholder="Add specialty (e.g. Yoga)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSpecialty();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSpecialty}
                      >
                        Add
                      </Button>
                    </div>
                    {specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {specialties.map((s) => (
                          <Badge key={s} variant="secondary" className="gap-1">
                            {s}
                            <button
                              type="button"
                              onClick={() => removeSpecialty(s)}
                              className="ml-1 hover:text-foreground"
                            >
                              <X className="size-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="staffBio">Bio</Label>
                    <Textarea
                      id="staffBio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Background and experience..."
                      rows={3}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving
                        ? editingId
                          ? "Saving..."
                          : "Adding..."
                        : editingId
                        ? "Save Changes"
                        : "Add Staff"}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading staff...</p>
          ) : staff.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No staff added yet. Add your first instructor above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((s) => (
                <Card key={s.id} className={!s.active ? "opacity-60" : ""}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-3">
                      {s.photo_url ? (
                        <img
                          src={s.photo_url}
                          alt={s.name}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                          {getInitials(s.name)}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{s.name}</CardTitle>
                        <CardDescription>{s.email}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={s.active ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleActive(s.id, s.active)}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {s.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-3" />
                        {s.phone}
                      </div>
                    )}
                    {s.specialties && s.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.specialties.map((sp) => (
                          <Badge key={sp} variant="secondary" className="text-xs">
                            {sp}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {s.bio && (
                      <p className="text-muted-foreground text-xs line-clamp-2">{s.bio}</p>
                    )}
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(s)}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === HOURS LOG TAB === */}
        <TabsContent value="hours">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <select
                value={hoursFilterStaff}
                onChange={(e) => setHoursFilterStaff(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">All Staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setHoursStaffId("");
                setHoursDate("");
                setHoursValue("");
                setHoursRate("");
                setHoursNotes("");
                setHoursError("");
                setShowHoursForm(!showHoursForm);
              }}
            >
              <Plus className="size-4" /> Log Hours
            </Button>
          </div>

          {showHoursForm && (
            <Card className="max-w-lg mb-6">
              <CardHeader>
                <CardTitle>Log Hours</CardTitle>
                <CardDescription>Record staff hours worked.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveHours} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hoursStaff">Staff Member</Label>
                    <select
                      id="hoursStaff"
                      value={hoursStaffId}
                      onChange={(e) => setHoursStaffId(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      required
                    >
                      <option value="">Select staff...</option>
                      {staff
                        .filter((s) => s.active)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="hoursDate">Date</Label>
                      <Input
                        id="hoursDate"
                        type="date"
                        value={hoursDate}
                        onChange={(e) => setHoursDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="hoursValue">Hours</Label>
                      <Input
                        id="hoursValue"
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={hoursValue}
                        onChange={(e) => setHoursValue(e.target.value)}
                        placeholder="3.5"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="hoursRate">Rate (KES)</Label>
                      <Input
                        id="hoursRate"
                        type="number"
                        min="0"
                        value={hoursRate}
                        onChange={(e) => setHoursRate(e.target.value)}
                        placeholder="500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hoursNotes">Notes</Label>
                    <Textarea
                      id="hoursNotes"
                      value={hoursNotes}
                      onChange={(e) => setHoursNotes(e.target.value)}
                      placeholder="Covered yoga class..."
                      rows={2}
                    />
                  </div>
                  {hoursError && (
                    <p className="text-sm text-destructive">{hoursError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={hoursSaving}>
                      {hoursSaving ? "Saving..." : "Save Hours"}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setShowHoursForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-6">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </div>
              <span className="text-2xl font-bold">{monthlyTotal.toFixed(1)}h</span>
            </CardHeader>
          </Card>

          {hoursLoading ? (
            <p className="text-sm text-muted-foreground">Loading hours...</p>
          ) : hoursRecords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hours logged yet. Record staff hours above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate (KES)</TableHead>
                    <TableHead>Total (KES)</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hoursRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {getStaffName(r.staff_id)}
                      </TableCell>
                      <TableCell>
                        {new Date(r.date).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{r.hours}h</TableCell>
                      <TableCell>{r.rate_kes.toLocaleString()}</TableCell>
                      <TableCell>
                        {(r.hours * r.rate_kes).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
