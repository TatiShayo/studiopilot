"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { generateAIDescription } from "./generate-description";

interface AIDescriptionButtonProps {
  classTypeName: string;
  onDescription: (text: string) => void;
}

export function AIDescriptionButton({ classTypeName, onDescription }: AIDescriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!classTypeName.trim()) return;
    setLoading(true);
    try {
      const result = await generateAIDescription(classTypeName);
      onDescription(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={loading || !classTypeName.trim()}
    >
      <Sparkles className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Generating..." : "AI Description"}
    </Button>
  );
}
