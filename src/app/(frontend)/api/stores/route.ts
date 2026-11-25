import { NextResponse } from "next/server";
import { getPointsOfSale } from "@/lib/cms";

/**
 * All active points of sale for the "where to buy" map.
 * Cached at the CDN for 10 minutes (edits in /admin show up within that time).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const points = await getPointsOfSale();
  return NextResponse.json(
    { points },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" } },
  );
}
