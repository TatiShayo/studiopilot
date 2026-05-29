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
      size="sm"
      variant="outline"
      onClick={handleCheckIn}
      disabled={loading}
    >
      <Check className="size-3.5" />
      {loading ? "..." : "Check In"}
    </Button>
  );
}
