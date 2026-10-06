import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const pdfTextToCsv = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ text: z.string().max(200000), header: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Chave de IA ausente.");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: `Converta o texto de um relatório de almoxarifado em CSV separado por ponto e vírgula, com vírgula decimal. Use EXATAMENTE este cabeçalho na primeira linha:\n${data.header}\nA coluna "mes" deve estar no formato AAAA-MM. Uma linha por mês. Deixe vazio o que não existir. Responda somente o CSV, sem comentários nem crases.`,
        input: data.text,
      }),
    });
    if (res.status === 429) throw new Error("Limite de uso da IA atingido, tente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok || !res.body) throw new Error(`Falha ao ler o PDF (${res.status}).`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const p = l.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p) as { type?: string; delta?: string };
          if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
        } catch {
          /* ignora */
        }
      }
    }
    return { csv: out.replace(/```[a-z]*/gi, "").trim() };
  });
