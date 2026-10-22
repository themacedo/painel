import type { NextRequest } from "next/server";
import { repassar } from "@/lib/api-nuvem";

export const dynamic = "force-dynamic";
export const GET = (req: NextRequest) => repassar(req, "/avisos");
