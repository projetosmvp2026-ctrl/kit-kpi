/** Lê planilha Excel/ODS e devolve o conteúdo da 1ª aba como CSV com ";" */
export async function spreadsheetToCsv(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const name = wb.SheetNames[0];
  const sheet = name ? wb.Sheets[name] : undefined;
  if (!sheet) return "";
  return XLSX.utils.sheet_to_csv(sheet, { FS: ";", blankrows: false });
}

/** Extrai o texto de um PDF (no navegador). */
export async function pdfToText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    out.push(tc.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  return out.join("\n");
}
