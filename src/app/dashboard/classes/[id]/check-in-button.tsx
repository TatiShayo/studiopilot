"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

export function CheckInButton({
  bookingId,
  classId,
}: {
  bookingId: string;
  classId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckIn = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("bookings")
      .update({ status: "checked_in" })
      .eq("id", bookingId);

    router.refresh();
  };

  return (
    <Button
      size="default"
      variant="outline"
      onClick={handleCheckIn}
      disabled={loading}
      className="h-9 min-h-[36px] min-w-[44px]"
    >
      <Check className="size-4" />
      <span className="hidden sm:inline ml-1">{loading ? "..." : "Check In"}</span>
    </Button>
  );
}
