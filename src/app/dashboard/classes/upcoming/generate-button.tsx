"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { generateWeeklyClasses } from "../actions";

export function GenerateButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    const result = await generateWeeklyClasses(formData);
    if ("error" in result && result.error) {
      setMessage(result.error);
    } else {
      setMessage(`Generated ${result.created} classes`);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
      <Button size="sm" onClick={handleGenerate} disabled={loading}>
        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Generating..." : "Generate This Week"}
      </Button>
    </div>
  );
}
