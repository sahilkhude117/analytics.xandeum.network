

export interface HealthMetrics {
  isOnline: boolean;
  storageUsagePercent: number;
  cpuPercent: number;
  uptime: number;
  lastSeenMinutes: number;
}

export function calculateHealthScore(metrics: HealthMetrics): number {
  let score = 0;

  // 1. Online status (40 points max)
  if (metrics.isOnline) {
    score += 40;
  } else {
    return 0; // Offline = 0 score
  }

  // 2. Last seen (20 points max)
  // Recent activity is critical for network participation
  if (metrics.lastSeenMinutes < 1) {
    score += 20; // Seen in last minute
  } else if (metrics.lastSeenMinutes < 5) {
    score += 15; // Seen in last 5 minutes
  } else if (metrics.lastSeenMinutes < 10) {
    score += 10; // Seen in last 10 minutes
  } else if (metrics.lastSeenMinutes < 30) {
    score += 5; // Seen in last 30 minutes
  }
  // 0 points if last seen > 30 min

  // 3. Storage health (15 points max)
  // Penalize very high usage (>90%) or zero usage
  const storagePercent = metrics.storageUsagePercent;
  if (storagePercent === 0) {
    score += 5; // New node, not storing yet
  } else if (storagePercent > 0 && storagePercent <= 70) {
    score += 15; // Healthy usage
  } else if (storagePercent > 70 && storagePercent <= 85) {
    score += 10; // Getting full
  } else if (storagePercent > 85 && storagePercent <= 95) {
    score += 5; // Nearly full
  }
  // 0 points if >95% (critical)

  // 4. CPU health (10 points max)
  // Lower CPU is better (not overloaded)
  const cpuPercent = metrics.cpuPercent;
  if (cpuPercent >= 0 && cpuPercent <= 20) {
    score += 10; // Low CPU usage
  } else if (cpuPercent > 20 && cpuPercent <= 50) {
    score += 7; // Moderate CPU
  } else if (cpuPercent > 50 && cpuPercent <= 80) {
    score += 4; // High CPU
  } else if (cpuPercent > 80) {
    score += 1; // Critical CPU
  }

  // 5. Uptime (15 points max)
  // Longer uptime = more stable node
  const uptimeHours = metrics.uptime / 3600;
  if (uptimeHours >= 168) {
    score += 15; // 1 week+
  } else if (uptimeHours >= 72) {
    score += 12; // 3 days+
  } else if (uptimeHours >= 24) {
    score += 9; // 1 day+
  } else if (uptimeHours >= 6) {
    score += 6; // 6 hours+
  } else if (uptimeHours >= 1) {
    score += 3; // 1 hour+
  }
  // 0 points if <1 hour

  // Total possible: 100 points
  return Math.min(100, Math.max(0, score));
}

export function getHealthStatus(score: number): "ONLINE" | "DEGRADED" | "OFFLINE" {
  if (score === 0) return "OFFLINE";
  if (score >= 70) return "ONLINE";
  return "DEGRADED";
}

export function getHealthLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  if (score > 0) return "Critical";
  return "Offline";
}
