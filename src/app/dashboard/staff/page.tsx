"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Mail, Phone, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { Staff } from "@/lib/types";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchStaff();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setBio("");
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
    const payload = { name, email, phone, bio, specialties };

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

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage instructors and studio staff
          </p>
        </div>
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
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {getInitials(s.name)}
                  </div>
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
    </div>
  );
}
