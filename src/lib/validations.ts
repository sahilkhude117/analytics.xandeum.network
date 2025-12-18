import { z } from "zod";
import { Status } from "../../prisma/generated/client";

export const PNodeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  status: z.nativeEnum(Status).optional(),
  version: z.string().optional(),
  country: z.string().optional(),
  search: z.string().optional(), // pubkey prefix or IP
  sortBy: z
    .enum(["lastSeenAt", "storageUsagePercent", "uptime", "healthScore"])
    .default("lastSeenAt"),
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
