export const STATUS_COLORS = {
	ONLINE: { dot: '#22C55E', text: '#22C55E', bg: '#22C55E20' },
	DEGRADED: { dot: '#FACC15', text: '#FACC15', bg: '#FACC1520' },
	OFFLINE: { dot: '#EF4444', text: '#EF4444', bg: '#EF444420' },
	INVALID: { dot: '#6B7280', text: '#6B7280', bg: '#6B728020' },
} as const;

export const CHART_COLORS = {
	PRIMARY: '#1E40AF',
	SECONDARY: '#FACC15',
	SUCCESS: '#22C55E',
	ERROR: '#EF4444',
	PURPLE: '#7c3aed',
} as const;
