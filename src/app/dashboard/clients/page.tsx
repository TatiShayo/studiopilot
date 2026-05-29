import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import type { Client } from "@/lib/types";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { q } = await searchParams;
  let query = supabase.from("clients").select("*").order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: clients, error } = await query;
  const clientList: Client[] = clients ?? [];

  const statusVariant = (s: string) =>
    s === "active" ? "default" : s === "vip" ? "secondary" : "outline";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <Link href="/dashboard/clients/new">
          <Button size="sm">
            <Plus className="size-4" /> Add Client
          </Button>
        </Link>
      </div>

      <form className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search clients..."
            defaultValue={q ?? ""}
            className="pl-8"
          />
        </div>
      </form>

      {error && (
        <p className="text-sm text-destructive mb-4">Schema not yet applied — run supabase-schema.sql in your Supabase SQL Editor.</p>
      )}

      {clientList.length === 0 && !error ? (
        <div className="rounded-xl border bg-white dark:bg-zinc-950 p-12 text-center">
          <p className="text-muted-foreground">No clients yet. Add your first client to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white dark:bg-zinc-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientList.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.membership_tier.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.last_visit
                      ? new Date(c.last_visit).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
