import type { NextRequest } from "next/server";
import { repassar } from "@/lib/api-nuvem";

export const dynamic = "force-dynamic";
const corpo = async (req: NextRequest, method: string) =>
  ({ method, headers: { "Content-Type": "application/json" }, body: await req.text() });
export const POST = async (req: NextRequest) => repassar(req, "/push/inscricao", await corpo(req, "POST"));
export const DELETE = async (req: NextRequest) => repassar(req, "/push/inscricao", await corpo(req, "DELETE"));
