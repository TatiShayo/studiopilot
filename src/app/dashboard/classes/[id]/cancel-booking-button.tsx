"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "../book-actions";
import { X } from "lucide-react";

export function CancelBookingButton({
  bookingId,
  classId,
}: {
  bookingId: string;
  classId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm("Cancel this booking?")) return;
    setLoading(true);
    const formData = new FormData();
    formData.set("bookingId", bookingId);
    formData.set("classId", classId);
    await cancelBooking(formData);
    setLoading(false);
    router.refresh();
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleCancel}
      disabled={loading}
      className="size-9"
    >
      <X className="size-4 text-muted-foreground" />
    </Button>
  );
}
