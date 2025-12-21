export function getDefaultTooltipStyle() {
  return {
    contentStyle: {
      backgroundColor: "#0A0A0A",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8,
      color: "#E5E7EB",
    },
    labelStyle: { color: "#9CA3AF", marginBottom: "4px" },
  } as const;
}

export function getDefaultAxisStyle() {
  return {
    stroke: "#6B7280",
    style: { fontSize: "12px" },
  } as const;
}
