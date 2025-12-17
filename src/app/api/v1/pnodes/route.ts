import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";
import { successResponse, handleError, buildCacheKey } from "@/lib/api";
import { PNodeListQuerySchema } from "@/lib/validations";
import type { PNodeListItem, PaginatedResponse } from "@/lib/types";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = PNodeListQuerySchema.parse({
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      status: searchParams.get("status") || undefined,
      version: searchParams.get("version") || undefined,
      country: searchParams.get("country") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortDir: searchParams.get("sortDir") || undefined,
    });

    const cacheKey = buildCacheKey([
      "v1",
      "pnodes",
      "list",
      query.page,
      query.pageSize,
      query.status || "all",
      query.version || "all",
      query.country || "all",
      query.search || "all",
      query.sortBy,
      query.sortDir,
    ]);

    const result = await withCache(
      cacheKey,
      30, // 30 seconds TTL
      async () => {

        const where: Prisma.PNodeWhereInput = {};

        if (query.status) {
          where.status = query.status;
        }

        if (query.version) {
          where.version = query.version;
        }

        if (query.country) {
          where.country = query.country;
        }

        if (query.search) {
          where.OR = [
            { pubkey: { startsWith: query.search } },
            { ipAddress: { contains: query.search } },
          ];
        }

        const orderBy: Prisma.PNodeOrderByWithRelationInput = {
          [query.sortBy]: query.sortDir,
        };

        const total = await prisma.pNode.count({ where });

        const pnodes = await prisma.pNode.findMany({
          where,
          orderBy,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          select: {
            pubkey: true,
            ipAddress: true,
            status: true,
            version: true,
            country: true,
            city: true,
            latitude: true,
            longitude: true,
            storageCommitted: true,
            storageUsed: true,
            storageUsagePercent: true,
            uptime: true,
            lastSeenAt: true,
            healthScore: true,
          },
        });

        const items: PNodeListItem[] = pnodes.map((pnode) => ({
          pubkey: pnode.pubkey,
          ipAddress: pnode.ipAddress,
          status: pnode.status,
          version: pnode.version,
          country: pnode.country,
          city: pnode.city,
          latitude: pnode.latitude,
          longitude: pnode.longitude,
          storageCommitted: pnode.storageCommitted.toString(),
          storageUsed: pnode.storageUsed.toString(),
          storageUsagePercent: pnode.storageUsagePercent,
          uptime: pnode.uptime,
          lastSeenAt: pnode.lastSeenAt.toISOString(),
          healthScore: pnode.healthScore,
        }));

        const response: PaginatedResponse<PNodeListItem> = {
          items,
          pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages: Math.ceil(total / query.pageSize),
          },
        };

        return response;
      }
    );

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
