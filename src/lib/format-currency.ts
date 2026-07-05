export const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatKes(valueCents: number): string {
  return kesFormatter.format(valueCents / 100);
}

export function formatKesInput(kesString: string): number {
  const numeric = kesString.replace(/[^0-9.]/g, "");
  return Math.round(parseFloat(numeric) * 100);
}
