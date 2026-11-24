import { jsPDF } from "jspdf";

export type ReportData = {
  name: string;
  generatedAt: Date;
  score: number | null;
  privacy: number | null;
  totals: { urls: number; suspicious: number; messages: number; done: number };
  urls: { submitted_url: string; risk_level: string; scanned_at: string }[];
  msgs: { content_type: string; risk_level: string; risk_score: number | null; created_at: string }[];
  recs: { title: string; priority: string; completed: boolean }[];
};

/** Builds the PDF only from saved records; missing data is stated, never invented. */
export function buildReportPdf(d: ReportData): Blob {
  const doc = new jsPDF();
  let y = 20;
  const line = (text: string, size = 10, gap = 6) => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.setFontSize(size);
    for (const part of doc.splitTextToSize(text, 175)) { doc.text(part, 15, y); y += gap; }
  };
  line("CyberShield AI – Security Report", 18, 10);
  line(`Prepared for ${d.name} · ${d.generatedAt.toLocaleString()}`);
  y += 4; line("Security overview", 14, 8);
  line(`Security score: ${d.score ?? "Not assessed yet"}${d.score !== null ? " / 100" : ""}`);
  line(`Privacy score: ${d.privacy ?? "Not assessed yet"}${d.privacy !== null ? " / 100" : ""}`);
  line(`URLs scanned: ${d.totals.urls} (suspicious or high risk: ${d.totals.suspicious})`);
  line(`Messages analysed: ${d.totals.messages}`);
  line(`Recommendations completed: ${d.totals.done}`);
  y += 4; line("Recent URL scans", 14, 8);
  if (!d.urls.length) line("No URL scans yet.");
  d.urls.slice(0, 15).forEach((u) => line(`${new Date(u.scanned_at).toLocaleDateString()} · ${u.risk_level} · ${u.submitted_url.slice(0, 90)}`));
  y += 4; line("Phishing analysis history", 14, 8);
  if (!d.msgs.length) line("No messages analysed yet.");
  d.msgs.slice(0, 15).forEach((m) => line(`${new Date(m.created_at).toLocaleDateString()} · ${m.content_type} · ${m.risk_level}${m.risk_score !== null ? ` (${m.risk_score})` : ""}`));
  y += 4; line("Security recommendations", 14, 8);
  if (!d.recs.length) line("No recommendations yet. Complete the privacy check to get some.");
  d.recs.forEach((r) => line(`${r.completed ? "[done]" : "[open]"} ${r.title} (${r.priority})`));
  y += 6; line("Results are based on your saved activity and automated checks. Unknown does not mean safe, and no tool can guarantee complete safety.", 8, 4);
  return doc.output("blob");
}
