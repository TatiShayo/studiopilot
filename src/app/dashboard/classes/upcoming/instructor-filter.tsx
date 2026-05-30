"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InstructorFilterProps {
  staffList: { id: string; name: string }[];
  selected: string;
}

export function InstructorFilter({ staffList, selected }: InstructorFilterProps) {
  const router = useRouter();

  const handleChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete("instructor");
    } else {
      params.set("instructor", value);
    }
    router.push(`/dashboard/classes/upcoming?${params.toString()}`);
  };

  return (
    <Select value={selected} onValueChange={handleChange}>
      <SelectTrigger className="w-full min-w-[140px] sm:w-[180px]">
        <SelectValue placeholder="All Instructors" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Instructors</SelectItem>
        {staffList.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
