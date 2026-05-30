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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Banknote, CreditCard, Smartphone, Building2, Crown, Calendar } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { Client, Payment, Membership } from "@/lib/types";
import RevenueDashboard from "./revenue-dashboard";
import OutstandingBalance from "@/components/outstanding-balance";

type PaymentWithClient = Payment & { clients: Pick<Client, "id" | "name" | "email"> | null };

const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
});

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("cash");
  const [description, setDescription] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const [memberships, setMemberships] = useState<(Membership & { clients: Pick<Client, "id" | "name" | "email"> | null })[]>([]);
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [memClientSearch, setMemClientSearch] = useState("");
  const [memSearchResults, setMemSearchResults] = useState<Client[]>([]);
  const [memSelectedClient, setMemSelectedClient] = useState<Client | null>(null);
  const [memPlanName, setMemPlanName] = useState("");
  const [memPrice, setMemPrice] = useState("");
  const [memCycle, setMemCycle] = useState("monthly");
  const [memStartDate, setMemStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [memSaving, setMemSaving] = useState(false);
  const [memError, setMemError] = useState("");
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const fetchPayments = async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("payments")
      .select("*, clients(id, name, email)")
      .order("paid_at", { ascending: false })
      .limit(100);
    setPayments((data as PaymentWithClient[]) ?? []);
    setLoading(false);
  };

  const fetchMemberships = async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("memberships")
      .select("*, clients(id, name, email)")
      .order("created_at", { ascending: false });
    setMemberships((data as any[]) ?? []);
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchPayments();
      await fetchMemberships();
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (clientSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("clients")
        .select("*")
        .or(`name.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`)
        .order("name")
        .limit(8);
      setSearchResults((data as Client[]) ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  useEffect(() => {
    if (memClientSearch.length < 2) {
      setMemSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("clients")
        .select("*")
        .or(`name.ilike.%${memClientSearch}%,email.ilike.%${memClientSearch}%`)
        .order("name")
        .limit(8);
      setMemSearchResults((data as Client[]) ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [memClientSearch]);

  const handleSelectClient = (c: Client) => {
    setSelectedClient(c);
    setClientSearch(c.name);
    setSearchResults([]);
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !amount) return;
    setSaving(true);
    setError("");

    const supabase = getSupabase();
    const { error: insertError } = await supabase.from("payments").insert({
      client_id: selectedClient.id,
      amount_cents: Math.round(parseFloat(amount) * 100),
      method,
      description: description || `${method.toUpperCase()} payment`,
      paid_at: new Date(paidAt).toISOString(),
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSelectedClient(null);
      setClientSearch("");
      setAmount("");
      setMethod("cash");
      setDescription("");
      setPaidAt(new Date().toISOString().split("T")[0]);
      setShowForm(false);
      fetchPayments();
    }
    setSaving(false);
  };

  const handleSelectMemClient = (c: Client) => {
    setMemSelectedClient(c);
    setMemClientSearch(c.name);
    setMemSearchResults([]);
  };

  const handleAddMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memSelectedClient || !memPlanName || !memPrice) return;
    setMemSaving(true);
    setMemError("");

    let endDate: string | null = null;
    const start = new Date(memStartDate);
    if (memCycle === "monthly") {
      endDate = new Date(start.setMonth(start.getMonth() + 1)).toISOString().split("T")[0];
    } else if (memCycle === "quarterly") {
      endDate = new Date(start.setMonth(start.getMonth() + 3)).toISOString().split("T")[0];
    } else {
      endDate = new Date(start.setFullYear(start.getFullYear() + 1)).toISOString().split("T")[0];
    }

    const supabase = getSupabase();
    const { error: insertError } = await supabase.from("memberships").insert({
      client_id: memSelectedClient.id,
      plan_name: memPlanName,
      price: Math.round(parseFloat(memPrice) * 100),
      billing_cycle: memCycle,
      start_date: memStartDate,
      end_date: endDate,
      status: "active",
    });

    if (insertError) {
      setMemError(insertError.message);
    } else {
      await supabase
        .from("clients")
        .update({ membership_tier: "monthly", status: "active" })
        .eq("id", memSelectedClient.id);

      setMemSelectedClient(null);
      setMemClientSearch("");
      setMemPlanName("");
      setMemPrice("");
      setMemCycle("monthly");
      setMemStartDate(new Date().toISOString().split("T")[0]);
      setShowMembershipForm(false);
      fetchMemberships();
    }
    setMemSaving(false);
  };

  const methodBadge = (m: string) => {
    switch (m) {
      case "cash":
        return (
          <Badge variant="outline" className="gap-1">
            <Banknote className="size-3" /> Cash
          </Badge>
        );
      case "card":
        return (
          <Badge variant="outline" className="gap-1">
            <CreditCard className="size-3" /> Card
          </Badge>
        );
      case "mpesa":
        return (
          <Badge variant="outline" className="gap-1">
            <Smartphone className="size-3" /> M-Pesa
          </Badge>
        );
      case "bank":
        return (
          <Badge variant="outline" className="gap-1">
            <Building2 className="size-3" /> Bank
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <CreditCard className="size-3" /> Stripe
          </Badge>
        );
    }
  };

  const now = new Date();
  const thisMonthRevenue = payments
    .filter(
      (p) =>
        new Date(p.paid_at ?? p.created_at).getMonth() === now.getMonth() &&
        new Date(p.paid_at ?? p.created_at).getFullYear() === now.getFullYear()
    )
    .reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record and track studio payments
          </p>
        </div>
      </div>

      <Card className="mb-6 border-teal-500/20 bg-teal-500/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue This Month</p>
              <p className="text-3xl font-bold text-teal-500">
                {kesFormatter.format(thisMonthRevenue / 100)}
              </p>
            </div>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="size-4" /> Record Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="overflow-x-auto w-full sm:w-fit flex-nowrap">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="memberships">Memberships</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="transactions" className="space-y-6">
          {showForm && (
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle>Record Payment</CardTitle>
                <CardDescription>
                  Log a cash, card, M-Pesa, or bank payment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecord} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Client</Label>
                    {selectedClient ? (
                      <div className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="text-sm">
                          {selectedClient.name} ({selectedClient.email})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setSelectedClient(null);
                            setClientSearch("");
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Search clients..."
                          className="pl-8"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                        />
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg">
                            {searchResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full px-3 py-2 text-sm text-left hover:bg-muted"
                                onClick={() => handleSelectClient(c)}
                              >
                                {c.name}{" "}
                                <span className="text-muted-foreground">
                                  ({c.email})
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="amount">Amount (KES)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Method</Label>
                      <Select
                        value={method}
                        onValueChange={(v) => setMethod(v ?? "cash")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank">Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Input
                      id="desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Drop-in yoga class..."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="paidAt">Payment Date</Label>
                    <Input
                      id="paidAt"
                      type="date"
                      value={paidAt}
                      onChange={(e) => setPaidAt(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={saving || !selectedClient || !amount}
                    >
                      {saving ? "Recording..." : "Record Payment"}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Loading transactions...
                </p>
              ) : payments.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  No payments recorded yet. Record your first payment above.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(p.paid_at ?? p.created_at).toLocaleDateString(
                            "en-KE",
                            { year: "numeric", month: "short", day: "numeric" }
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.clients?.name ?? "Unknown"}
                        </TableCell>
                        <TableCell>{methodBadge(p.method)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.description}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {kesFormatter.format(p.amount_cents / 100)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueDashboard />
        </TabsContent>

        <TabsContent value="memberships" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Memberships</h2>
            <Button size="sm" onClick={() => setShowMembershipForm(!showMembershipForm)}>
              <Crown className="size-4" /> Add Membership
            </Button>
          </div>

          {showMembershipForm && (
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle>Add Membership</CardTitle>
                <CardDescription>
                  Manually add a membership plan for a client.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMembership} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Client</Label>
                    {memSelectedClient ? (
                      <div className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="text-sm">
                          {memSelectedClient.name} ({memSelectedClient.email})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setMemSelectedClient(null);
                            setMemClientSearch("");
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Search clients..."
                          className="pl-8"
                          value={memClientSearch}
                          onChange={(e) => setMemClientSearch(e.target.value)}
                        />
                        {memSearchResults.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg">
                            {memSearchResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full px-3 py-2 text-sm text-left hover:bg-muted"
                                onClick={() => handleSelectMemClient(c)}
                              >
                                {c.name}{" "}
                                <span className="text-muted-foreground">
                                  ({c.email})
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input
                      id="planName"
                      value={memPlanName}
                      onChange={(e) => setMemPlanName(e.target.value)}
                      placeholder="Unlimited Monthly"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="memPrice">Price (KES)</Label>
                      <Input
                        id="memPrice"
                        type="number"
                        placeholder="0.00"
                        value={memPrice}
                        onChange={(e) => setMemPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Billing Cycle</Label>
                      <Select
                        value={memCycle}
                        onValueChange={(v) => setMemCycle(v ?? "monthly")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="memStartDate">Start Date</Label>
                    <Input
                      id="memStartDate"
                      type="date"
                      value={memStartDate}
                      onChange={(e) => setMemStartDate(e.target.value)}
                    />
                  </div>

                  {memError && <p className="text-sm text-destructive">{memError}</p>}

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={memSaving || !memSelectedClient || !memPlanName || !memPrice}
                    >
                      {memSaving ? "Adding..." : "Add Membership"}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setShowMembershipForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {memberships.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  No memberships yet. Add one above or subscribe a client via Stripe.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          {m.clients?.name ?? "Unknown"}
                        </TableCell>
                        <TableCell>{m.plan_name}</TableCell>
                        <TableCell className="capitalize">{m.billing_cycle}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(m.start_date).toLocaleDateString("en-KE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.end_date
                            ? new Date(m.end_date).toLocaleDateString("en-KE", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {kesFormatter.format(m.price / 100)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              m.status === "active"
                                ? "default"
                                : m.status === "past_due"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {m.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding">
          <OutstandingBalance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
