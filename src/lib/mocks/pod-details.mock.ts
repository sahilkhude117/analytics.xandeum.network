import { PodDetails } from "../types";

// Mock data for a PUBLIC node
export const mockPublicNode: PodDetails = {
  pubkey: "8kF3x9ZqN2pR7wL5mT4jY1vH6nB8dS9aC3eK2fM1gQ4u",
  ip: "192.168.1.100",
  gossipPort: 8001,
  version: "1.18.23",
  status: "ONLINE",
  visibility: "PUBLIC",
  storageCommitted: 1024,
  storageUsed: 768,
  uptime: 2592000, // 30 days in seconds
  healthScore: 96,
  lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
  firstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  city: "New York",
  country: "United States",
  cpuPercent: 42,
  ramUsed: 12.4,
  ramTotal: 32,
  rpcPort: 6000,
  activeStreams: 156,
  packetsSent: 9842301,
  packetsReceived: 8234512,
  totalBytes: 1024 * 1024 * 1024 * 450, // 450 GB
  totalPages: 234891,
  currentIndex: 234890,
  storageHistory: Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    committed: 1024,
    used: 500 + i * 9,
  })),
  cpuHistory: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
    percent: 30 + Math.random() * 30,
  })),
  ramHistory: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
    used: 10 + Math.random() * 5,
    total: 32,
  })),
};

// Mock data for a PRIVATE node
export const mockPrivateNode: PodDetails = {
  pubkey: "3vL9jK2fP6xR1wN8mT5yQ4aH7nD2bS6cE9hM3gJ4kU8p",
  ip: "10.0.5.23",
  gossipPort: 8001,
  version: "1.18.20",
  status: "ONLINE",
  visibility: "PRIVATE",
  storageCommitted: 512,
  rpcPort: 6000,
  storageUsed: 234,
  uptime: 1296000, // 15 days in seconds
  healthScore: 88,
  lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  firstSeen: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
  city: "Singapore",
  country: "Singapore",
  storageHistory: Array.from({ length: 15 }, (_, i) => ({
    timestamp: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000),
    committed: 512,
    used: 150 + i * 5.6,
  })),
};
