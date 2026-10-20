import type { NextRequest } from "next/server";
import { repassar } from "@/lib/api-nuvem";

export const dynamic = "force-dynamic";
export const POST = async (req: NextRequest) =>
  repassar(req, "/revisoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: await req.text() });
