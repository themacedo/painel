import { describe, expect, it } from "vitest";
import { decidirAvisos } from "../main/avisos";

const AGORA = Date.parse("2026-10-20T22:30:00Z");
const base = (o: Record<string, any> = {}) => ({
  saude: {
    sync: { em: "2026-10-20T22:05:00Z", status: "success", novos: 2, ultimoSucesso: "2026-10-20T22:05:00Z" },
    conexoes: [{ banco: "Itaú", status: "UPDATED", ultima: "2026-10-20T16:04:00Z", proxima: null, consentimento: "2027-10-15T13:51:17Z" }],
    pendentes: 29, sombra: { hoje: "2026-10-20", sync: "success", campos: 6000, diferencas: 0 }, ...o,
  },
  financas: { detalhe: { cicloCartao: { status: "atencao", atual: 700, teto: 1839, fechamento: "2026-11-17" } } },
});
const chaves = (xs: { chave: string }[]) => xs.map((x) => x.chave);

describe("quando o app avisa", () => {
  it("sync novo: avisa uma vez com novos e pendentes; com tudo em dia, nada mais", () => {
    const a = decidirAvisos(base(), AGORA, new Set());
    expect(a).toEqual([{ chave: "sync:2026-10-20T22:05:00Z", titulo: "Sync do dia", texto: "2 lançamentos novos · 29 para revisar" }]);
    expect(decidirAvisos(base(), AGORA, new Set(chaves(a)))).toEqual([]); // reabrir o app não repete
  });

  it("sync com erro avisa que falhou", () => {
    const [a] = decidirAvisos(base({ sync: { em: "x", status: "error", novos: 0 } }), AGORA, new Set());
    expect(a!.titulo).toBe("O sync falhou");
  });

  it("banco parado há mais de 26 h ou fora de UPDATED: um aviso por banco por dia", () => {
    const parado = base({ conexoes: [{ banco: "Nubank", status: "UPDATED", ultima: "2026-10-19T06:21:00Z" }] });
    const a = decidirAvisos(parado, AGORA, new Set(["sync:2026-10-20T22:05:00Z"]));
    expect(a).toEqual([{ chave: "banco:Nubank:2026-10-20", titulo: "Nubank sem atualizar", texto: "Última atualização há 40 h. Atualize em meu.pluggy.ai." }]);
    const erro = decidirAvisos(base({ conexoes: [{ banco: "Itaú", status: "LOGIN_ERROR", ultima: "2026-10-20T16:00:00Z" }] }), AGORA, new Set(["sync:2026-10-20T22:05:00Z"]));
    expect(erro[0]!.texto).toContain("LOGIN_ERROR");
  });

  it("autorização a 30 dias ou menos de vencer, ou vencida; com mais de 30 dias, nada", () => {
    const ja = new Set(["sync:2026-10-20T22:05:00Z"]);
    const perto = decidirAvisos(base({ conexoes: [{ banco: "Itaú", status: "UPDATED", ultima: "2026-10-20T16:00:00Z", consentimento: "2026-11-05T00:00:00Z" }] }), AGORA, ja);
    expect(perto[0]!.titulo).toBe("Autorização do Itaú vence em 16 dias");
    const vencida = decidirAvisos(base({ conexoes: [{ banco: "Itaú", status: "UPDATED", ultima: "2026-10-20T16:00:00Z", consentimento: "2026-10-01T00:00:00Z" }] }), AGORA, ja);
    expect(vencida[0]!.titulo).toBe("Autorização do Itaú venceu");
    expect(decidirAvisos(base(), AGORA, ja)).toEqual([]);
  });

  it("nuvem com diferenças e cartão estourado avisam; cartão em atenção não", () => {
    const p = base({ sombra: { hoje: "2026-10-20", diferencas: 3 } });
    p.financas.detalhe.cicloCartao = { status: "estourou", atual: 2000, teto: 1839, fechamento: "2026-11-17" };
    expect(chaves(decidirAvisos(p, AGORA, new Set(["sync:2026-10-20T22:05:00Z"])))).toEqual(["sombra:2026-10-20", "cartao:2026-11-17"]);
  });
});
