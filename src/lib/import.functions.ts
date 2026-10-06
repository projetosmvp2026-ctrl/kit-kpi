import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const pdfTextToCsv = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ text: z.string().max(200000), header: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Chave de IA ausente.");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Converta o texto de um relatório de almoxarifado em CSV separado por ponto e vírgula, com vírgula decimal. Use EXATAMENTE este cabeçalho na primeira linha:\n${data.header}\nA coluna "mes" deve estar no formato AAAA-MM. Uma linha por mês. Deixe vazio o que não existir. Responda somente o CSV, sem comentários nem crases.`,
          },
          { role: "user", content: data.text },
        ],
      }),
    });
    if (res.status === 429) throw new Error("Limite de uso da IA atingido, tente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok) throw new Error("Falha ao ler o PDF.");
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const csv = (json.choices?.[0]?.message?.content ?? "").replace(/```[a-z]*/gi, "").trim();
    return { csv };
  });
