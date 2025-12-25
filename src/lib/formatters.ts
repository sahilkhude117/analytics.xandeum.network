export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};

export const formatStorage = (bytes: bigint | string | number): { display: string; full: string; unit: string } => {
  let bytesNum: number;
  
  if (typeof bytes === 'string') {
    if (bytes.includes('.')) {
      bytesNum = parseFloat(bytes);
    } else {
      bytesNum = Number(BigInt(bytes));
    }
  } else if (typeof bytes === 'bigint') {
    bytesNum = Number(bytes);
  } else {
    bytesNum = bytes;
  }
  
  const TB = 1024 ** 4;
  const GB = 1024 ** 3;
  
  // Convert to TB
  const tbValue = bytesNum / TB;
  
  // If less than 0.1 TB, show in GB
  if (tbValue < 0.1) {
    const gbValue = bytesNum / GB;
    return {
      display: gbValue.toFixed(2),
      full: gbValue.toFixed(10).replace(/\.?0+$/, ''),
      unit: 'GB'
    };
  }
  
  return {
    display: tbValue.toFixed(2),
    full: tbValue.toFixed(10).replace(/\.?0+$/, ''),
    unit: 'TB'
  };
};

export const formatStorageValue = (bytes: bigint | string | number): string => {
  const formatted = formatStorage(bytes);
  return `${formatted.display} ${formatted.unit}`;
};

export const getFullStorageValue = (bytes: bigint | string | number): string => {
  const formatted = formatStorage(bytes);
  return `${formatted.full} ${formatted.unit}`;
};

export const formatRelativeTime = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

export const getHealthColor = (score: number): string => {
  if (score >= 80) return "#22C55E";
  if (score >= 50) return "#FACC15";
  return "#EF4444";
};
