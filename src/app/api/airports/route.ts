import { NextRequest, NextResponse } from "next/server";
import { searchAirports } from "@/lib/airports";

export const runtime = "nodejs";

/** GET /api/airports?q=kozh&mode=road&vehicle=train → [{ iata, city, country, name, region, mode?, kind? }] */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const modeParam = req.nextUrl.searchParams.get("mode");
  const mode = modeParam === "road" || modeParam === "air" ? modeParam : undefined;
  const vehicleParam = req.nextUrl.searchParams.get("vehicle");
  const vehicle = vehicleParam === "bus" || vehicleParam === "train" ? vehicleParam : undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 8, 20);
  return NextResponse.json({
    ok: true,
    results: searchAirports(q, limit, { mode, vehicle }),
  });
}
