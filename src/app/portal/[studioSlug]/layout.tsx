import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Studio } from "@/lib/types";
import { type ReactNode } from "react";

export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ studioSlug: string }>;
}) {
  const { studioSlug } = await params;
  const supabase = await createClient();

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("slug", studioSlug)
    .single();

  if (!studio) notFound();

  const s: Studio = studio as Studio;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header
        className="border-b bg-white dark:bg-zinc-950"
        style={{ borderColor: s.branding_color ? `${s.branding_color}30` : undefined }}
      >
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {s.logo_url ? (
              <img src={s.logo_url} alt={s.name} className="size-6 rounded" />
            ) : (
              <div
                className="flex size-6 items-center justify-center rounded text-xs font-bold text-white"
                style={{ backgroundColor: s.branding_color }}
              >
                {s.name.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-sm">{s.name}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
