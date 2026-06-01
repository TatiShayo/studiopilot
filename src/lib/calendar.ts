export function generateGoogleCalendarUrl({
  title,
  startISO,
  endISO,
  description,
  location,
}: {
  title: string;
  startISO: string;
  endISO: string;
  description?: string;
  location?: string;
}) {
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", title);
  params.set("dates", `${startISO.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${endISO.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`);
  if (description) params.set("details", description);
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatICSDate(iso: string) {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function generateICS({
  title,
  startISO,
  endISO,
  description,
  location,
}: {
  title: string;
  startISO: string;
  endISO: string;
  description?: string;
  location?: string;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudioPilot//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatICSDate(startISO)}`,
    `DTEND:${formatICSDate(endISO)}`,
    `SUMMARY:${title}`,
  ];
  if (description) lines.push(`DESCRIPTION:${description.replace(/\n/g, "\\n")}`);
  if (location) lines.push(`LOCATION:${location}`);
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

export function buildCalendarLinks({
  className,
  startISO,
  endISO,
  instructor,
  location,
}: {
  className: string;
  startISO: string;
  endISO: string;
  instructor?: string;
  location?: string;
}) {
  const title = `${className}${instructor ? ` with ${instructor}` : ""}`;
  const description = `Class: ${className}${instructor ? `\nInstructor: ${instructor}` : ""}${location ? `\nLocation: ${location}` : ""}\n\nBooked via StudioPilot`;

  return {
    google: generateGoogleCalendarUrl({ title, startISO, endISO, description, location }),
    ics: generateICS({ title, startISO, endISO, description, location }),
  };
}
