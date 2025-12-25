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
      storageCommitted: searchParams.get("storageCommitted") || undefined,
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
      query.storageCommitted || "all",
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

        if (query.storageCommitted) {
          const match = query.storageCommitted.match(/^([0-9.]+)\s*(TB|GB)$/i);
          if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            const bytes = unit === "TB" ? value * 1024 * 1024 * 1024 * 1024 : value * 1024 * 1024 * 1024;
            where.storageCommitted = BigInt(Math.floor(bytes));
          }
        }

        if (query.search) {
          where.OR = [
            { pubkey: { startsWith: query.search } },
            { ipAddress: { contains: query.search } },
            { city: { contains: query.search, mode: 'insensitive' } },
            { country: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        // Map sortBy fields - rank is computed from healthScore
        const sortField = query.sortBy === 'rank' ? 'healthScore' : query.sortBy;
        const orderBy: Prisma.PNodeOrderByWithRelationInput = {
          [sortField]: query.sortDir,
        };

        const total = await prisma.pNode.count({ where });

        const allVersions = await prisma.pNode.findMany({
          select: { version: true },
          distinct: ['version'],
          orderBy: { version: 'asc' },
        });

        const allCountries = await prisma.pNode.findMany({
          where: { country: { not: null } },
          select: { country: true },
          distinct: ['country'],
          orderBy: { country: 'asc' },
        });

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
            isPublic: true,
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
          isPublic: pnode.isPublic,
        }));

        const response: PaginatedResponse<PNodeListItem> = {
          items,
          pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages: Math.ceil(total / query.pageSize),
          },
          filters: {
            availableVersions: allVersions.map(v => v.version),
            availableCountries: allCountries.map(c => c.country).filter((c): c is string => c !== null),
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
