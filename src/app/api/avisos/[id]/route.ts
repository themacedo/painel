import type { NextRequest } from "next/server";
import { repassar } from "@/lib/api-nuvem";

export const dynamic = "force-dynamic";
export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!/^\d{8,14}$/.test(id)) return Response.json({ erro: "aviso inválido" }, { status: 400 });
  return repassar(req, `/avisos/${id}`);
};
