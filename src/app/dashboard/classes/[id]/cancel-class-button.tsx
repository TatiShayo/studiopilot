"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelClass } from "../cancel-actions";
import { XCircle } from "lucide-react";

export function CancelClassButton({ classId }: { classId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (
      !confirm(
        "Cancel this entire class? All booked and waitlisted clients will be notified by email."
      )
    )
      return;
    setLoading(true);
    const formData = new FormData();
    formData.set("classId", classId);
    await cancelClass(formData);
    setLoading(false);
    router.refresh();
  };

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleCancel}
      disabled={loading}
    >
      <XCircle className="size-4" />
      {loading ? "Cancelling..." : "Cancel Class"}
    </Button>
  );
}
