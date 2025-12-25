import { z } from "zod";
import { Status } from "../../prisma/generated/client";

// API Query Schemas
export const NetworkQuerySchema = z.object({
  refresh: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export const PNodeQuerySchema = z.object({
  refresh: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const SearchSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(["pubkey", "ip", "country"]).optional(),
});

export const PNodeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  status: z.nativeEnum(Status).optional(),
  version: z.string().optional(),
  country: z.string().optional(),
  storageCommitted: z.string().optional(), // Filter by storage committed (e.g., "1TB", "500GB")
  search: z.string().optional(), // pubkey prefix or IP
  sortBy: z
    .enum(["rank", "country", "lastSeenAt", "storageUsagePercent", "storageUsed", "uptime", "healthScore", "storageCommitted"])
    .default("healthScore"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type PNodeListQuery = z.infer<typeof PNodeListQuerySchema>;

export const IdOrPubkeySchema = z.string().min(1);

export const HistoryQuerySchema = z.object({
  timeRange: z.enum(["1h", "6h", "24h", "7d", "30d"]).default("24h"),
  metrics: z
    .string()
    .optional()
    .transform((val) => val?.split(",").filter(Boolean)),
  includeLive: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default(false),
});

export type HistoryQuery = z.infer<typeof HistoryQuerySchema>;
