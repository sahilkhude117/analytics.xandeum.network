import * as XLSX from "xlsx";
import { formatStorageValue } from "./formatters";

interface PodExportData {
  rank: number;
  pubkey: string;
  ip: string;
  port: number;
  status: string;
  visibility: string;
  version: string;
  storageUsed: number;
  storageCommitted: number;
  usagePercent: number;
  uptime: number;
  healthScore: number;
  lastSeen: Date;
  city?: string;
  country?: string;
}

interface TopPerformerExportData {
  pubkey: string;
  ipAddress: string;
  storageCommitted: string;
  storageUsed: string;
  storageUsagePercent: number;
  uptime: number;
  healthScore: number;
  version: string;
}

export function exportPodsToExcel(data: PodExportData[], filename: string = "pods-data") {
  // Format data for Excel
  const excelData = data.map((pod) => ({
    Rank: pod.rank,
    Pubkey: pod.pubkey,
    "IP Address": `${pod.ip}:${pod.port}`,
    Status: pod.status,
    Visibility: pod.visibility,
    Version: pod.version,
    "Storage Used": formatStorageValue(pod.storageUsed.toString()),
    "Storage Committed": formatStorageValue(pod.storageCommitted.toString()),
    "Usage %": `${pod.usagePercent.toFixed(2)}%`,
    "Uptime (seconds)": pod.uptime,
    "Uptime (days)": (pod.uptime / 86400).toFixed(2),
    "Health Score": pod.healthScore,
    "Last Seen": pod.lastSeen.toISOString(),
    City: pod.city || "N/A",
    Country: pod.country || "N/A",
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 6 },  // Rank
    { wch: 50 }, // Pubkey
    { wch: 20 }, // IP Address
    { wch: 10 }, // Status
    { wch: 10 }, // Visibility
    { wch: 45 }, // Version
    { wch: 15 }, // Storage Used
    { wch: 18 }, // Storage Committed
    { wch: 10 }, // Usage %
    { wch: 18 }, // Uptime (seconds)
    { wch: 15 }, // Uptime (days)
    { wch: 13 }, // Health Score
    { wch: 22 }, // Last Seen
    { wch: 15 }, // City
    { wch: 15 }, // Country
  ];
  worksheet["!cols"] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pods Data");

  // Generate timestamp for filename
  const timestamp = new Date().toISOString().split("T")[0];
  const finalFilename = `${filename}-${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, finalFilename);
}

export function exportTopPerformersToExcel(
  data: TopPerformerExportData[],
  sortBy: string,
  filename: string = "top-performers"
) {
  // Format data for Excel
  const excelData = data.map((pod, index) => ({
    Rank: index + 1,
    Pubkey: pod.pubkey,
    "IP Address": `${pod.ipAddress}:9001`,
    "Storage Committed": formatStorageValue(pod.storageCommitted),
    "Storage Used": formatStorageValue(pod.storageUsed),
    "Usage %": `${pod.storageUsagePercent.toFixed(2)}%`,
    "Uptime (seconds)": pod.uptime,
    "Uptime (days)": (pod.uptime / 86400).toFixed(2),
    "Health Score": pod.healthScore,
    Version: pod.version,
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 6 },  // Rank
    { wch: 50 }, // Pubkey
    { wch: 20 }, // IP Address
    { wch: 18 }, // Storage Committed
    { wch: 15 }, // Storage Used
    { wch: 10 }, // Usage %
    { wch: 18 }, // Uptime (seconds)
    { wch: 15 }, // Uptime (days)
    { wch: 13 }, // Health Score
    { wch: 45 }, // Version
  ];
  worksheet["!cols"] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Top 10 - ${sortBy}`);

  // Generate timestamp for filename
  const timestamp = new Date().toISOString().split("T")[0];
  const finalFilename = `${filename}-${sortBy}-${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, finalFilename);
}
