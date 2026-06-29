export type TemplateId =
  | "classic"
  | "modern-purple"
  | "executive"
  | "minimal-dark"
  | "creative-tech";

export type PageMode = "1-page" | "2-page";

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface CVPDFData {
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    portfolio: string;
    github: string;
    linkedin: string;
  };
  summary: string;
  skills: SkillCategory[];
  experience: {
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    liveLink: string;
    description: string;
    techStack: string;
  }[];
  education: {
    degree: string;
    institution: string;
    dates: string;
  }[];
  certificates: {
    issuer: string;
    date: string;
    names: string[];
  }[];
}

const safeName = (name: string) =>
  (name || "cv").trim().replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");

export async function generateCVPDF(
  data: CVPDFData,
  templateId: TemplateId = "classic",
  pageMode: PageMode = "2-page"
): Promise<void> {
  switch (templateId) {
    case "modern-purple": return generateModernPurple(data, pageMode);
    case "executive":     return generateExecutive(data, pageMode);
    case "minimal-dark":  return generateMinimalDark(data, pageMode);
    case "creative-tech": return generateCreativeTech(data, pageMode);
    default:              return generateClassic(data, pageMode);
  }
}

// ── Shared config ─────────────────────────────────────────────────────────────

function cfg(is1: boolean) {
  return {
    mg:         is1 ? 10  : 15,   // margin mm  (0.4 / 0.6 in)
    fsName:     is1 ? 16  : 20,
    fsHead:     is1 ? 9   : 11,
    fsBody:     is1 ? 8   : 10,
    fsSml:      is1 ? 7.5 : 9,
    lhBody:     is1 ? 4   : 5,    // body line-height
    lhSml:      is1 ? 3.5 : 4.5,  // contact line-height
    spSec:      is1 ? 3   : 5,    // gap after section rule
    spEntry:    is1 ? 2   : 4,    // gap after each entry block
    spBullet:   is1 ? 1   : 1.5,  // gap after each bullet
    skillCatW:  is1 ? 28  : 38,   // category column width
    pgBotRes:   8,                 // reserved mm at bottom for page number
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — Classic
// ─────────────────────────────────────────────────────────────────────────────

async function generateClassic(data: CVPDFData, pageMode: PageMode): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const is1 = pageMode === "1-page";
  const c = cfg(is1);
  const cW = pageW - c.mg * 2;
  const maxY = pageH - c.mg - c.pgBotRes;

  const black: [number, number, number] = [15, 15, 15];
  const dark:  [number, number, number] = [45, 45, 45];
  const med:   [number, number, number] = [100, 100, 100];
  const line:  [number, number, number] = [185, 185, 185];

  let y = c.mg;
  const gap = (needed: number) => {
    if (y + needed > maxY && !is1) { doc.addPage(); y = c.mg; }
  };

  const bullet = (text: string) => {
    if (!text.trim()) return;
    const bW = doc.getTextWidth("• ");
    const textX = c.mg + 3 + bW;
    const textW = cW - 3 - bW;
    const ls = doc.splitTextToSize(text.trim(), textW) as string[];
    const out = is1 && ls.length > 1 ? [`${(ls[0] ?? "").trimEnd()}…`] : ls;
    gap(out.length * c.lhBody + c.spBullet);
    doc.text("•", c.mg + 3, y);
    out.forEach((line, i) => doc.text(line, textX, y + i * c.lhBody));
    y += out.length * c.lhBody + c.spBullet;
  };

  // Header
  doc.setFontSize(c.fsName); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
  doc.text(data.personalInfo.name || "Your Name", c.mg, y); y += is1 ? 6 : 8;

  if (data.personalInfo.title.trim()) {
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
    doc.text(data.personalInfo.title, c.mg, y); y += is1 ? 4 : 5.5;
  }

  const contact = [
    data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location,
    data.personalInfo.portfolio, data.personalInfo.github, data.personalInfo.linkedin,
  ].filter(Boolean);
  if (contact.length) {
    doc.setFontSize(c.fsSml); doc.setFont("helvetica", "normal"); doc.setTextColor(...med);
    const wrapped = doc.splitTextToSize(contact.join("  |  "), cW) as string[];
    doc.text(wrapped, c.mg, y); y += wrapped.length * c.lhSml + 3;
  }

  doc.setDrawColor(...line); doc.setLineWidth(0.6); doc.line(c.mg, y, pageW - c.mg, y); y += is1 ? 4 : 7;

  const sec = (title: string) => {
    gap(14);
    doc.setFontSize(c.fsHead); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
    doc.text(title.toUpperCase(), c.mg, y); y += 2;
    doc.setDrawColor(...line); doc.setLineWidth(0.3); doc.line(c.mg, y, pageW - c.mg, y); y += c.spSec;
  };

  if (data.summary.trim()) {
    sec("Summary");
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
    const ls = doc.splitTextToSize(data.summary.trim(), cW) as string[];
    gap(ls.length * c.lhBody + 4); doc.text(ls, c.mg, y); y += ls.length * c.lhBody + (is1 ? 4 : 6);
  }

  const active = data.skills.filter(s => s.items.length > 0);
  if (active.length) {
    sec("Skills");
    for (const sk of active) {
      const itemText = sk.items.join(", ");
      const ls = doc.splitTextToSize(itemText, cW - c.skillCatW) as string[];
      const out = is1 ? [ls[0] ?? ""] : ls;
      const h = Math.max(out.length * c.lhBody, c.lhBody);
      gap(h + 1.5);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark); doc.text(sk.category, c.mg, y);
      doc.setFont("helvetica", "normal"); doc.text(out, c.mg + c.skillCatW, y); y += h + 1.5;
    }
    y += is1 ? 2 : 3;
  }

  if (data.experience.length) {
    sec("Experience");
    for (const exp of data.experience) {
      gap(18);
      let titleMaxW = cW;
      if (exp.duration) { doc.setFontSize(c.fsSml); doc.setFont("helvetica", "normal"); titleMaxW = cW - doc.getTextWidth(exp.duration) - 3; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
      doc.text((doc.splitTextToSize(exp.title || "Job Title", titleMaxW) as string[])[0] ?? "", c.mg, y);
      if (exp.duration) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(exp.duration, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (exp.company) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark); doc.text(exp.company, c.mg, y); y += is1 ? 3.5 : 5; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
      for (const b of exp.bullets) bullet(b);
      y += c.spEntry;
    }
  }

  if (data.projects.length) {
    sec("Projects");
    for (const p of data.projects) {
      gap(18);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(p.name || "Project", c.mg, y);
      if (p.liveLink) { doc.setFont("helvetica", "italic"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(p.liveLink, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (p.description) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...dark);
        const ls = doc.splitTextToSize(p.description, cW) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        gap(out.length * c.lhBody + 2); doc.text(out, c.mg, y); y += out.length * c.lhBody + 2;
      }
      if (p.techStack) {
        gap(c.lhBody + 2); doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark);
        const lbl = "Tech Stack: "; doc.text(lbl, c.mg, y);
        const lw = doc.getTextWidth(lbl); doc.setFont("helvetica", "normal");
        const ls = doc.splitTextToSize(p.techStack, cW - lw) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        doc.text(out[0] ?? "", c.mg + lw, y);
        for (let k = 1; k < out.length; k++) { y += c.lhBody; gap(c.lhBody); doc.text(out[k] ?? "", c.mg + lw, y); }
        y += c.lhBody;
      }
      y += c.spEntry;
    }
  }

  if (data.education.length) {
    sec("Education");
    for (const e of data.education) {
      gap(12);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(e.degree || "Degree", c.mg, y);
      if (e.dates) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(e.dates, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (e.institution) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...med); doc.text(e.institution, c.mg, y); y += is1 ? 5 : 7; }
    }
    y += 2;
  }

  const certs = data.certificates.filter(c2 => c2.issuer.trim() || c2.names.length > 0);
  if (certs.length) {
    sec("Certificates");
    for (const cert of certs) {
      gap(12);
      if (cert.issuer.trim()) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(cert.issuer, c.mg, y);
        if (cert.date) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(cert.date, pageW - c.mg, y, { align: "right" }); }
        y += is1 ? 3.5 : 5;
      }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
      for (const n of cert.names) bullet(n);
      y += c.spEntry;
    }
  }

  // Page numbers
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} of ${total}`, pageW / 2, pageH - 4, { align: "center" });
  }

  doc.save(`${safeName(data.personalInfo.name)}-cv.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — Modern Purple
// ─────────────────────────────────────────────────────────────────────────────

async function generateModernPurple(data: CVPDFData, pageMode: PageMode): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const is1 = pageMode === "1-page";
  const c = cfg(is1);
  const cW = pageW - c.mg * 2;
  const maxY = pageH - c.mg - c.pgBotRes;

  const purple:      [number, number, number] = [83, 74, 183];
  const purpleLight: [number, number, number] = [230, 228, 248];
  const black:       [number, number, number] = [20, 20, 20];
  const dark:        [number, number, number] = [50, 50, 50];
  const med:         [number, number, number] = [110, 110, 110];

  let y = c.mg;
  const gap = (needed: number) => {
    if (y + needed > maxY && !is1) { doc.addPage(); y = c.mg; }
  };

  const bullet = (text: string) => {
    if (!text.trim()) return;
    const bW = doc.getTextWidth("• ");
    const textX = c.mg + 3 + bW;
    const textW = cW - 3 - bW;
    const ls = doc.splitTextToSize(text.trim(), textW) as string[];
    const out = is1 && ls.length > 1 ? [`${(ls[0] ?? "").trimEnd()}…`] : ls;
    gap(out.length * c.lhBody + c.spBullet);
    doc.text("•", c.mg + 3, y);
    out.forEach((line, i) => doc.text(line, textX, y + i * c.lhBody));
    y += out.length * c.lhBody + c.spBullet;
  };

  // Header
  doc.setFontSize(c.fsName); doc.setFont("helvetica", "bold"); doc.setTextColor(...purple);
  doc.text(data.personalInfo.name || "Your Name", c.mg, y); y += is1 ? 6 : 8;

  if (data.personalInfo.title.trim()) {
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
    doc.text(data.personalInfo.title, c.mg, y); y += is1 ? 4 : 5.5;
  }

  const contact = [
    data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location,
    data.personalInfo.portfolio, data.personalInfo.github, data.personalInfo.linkedin,
  ].filter(Boolean);
  if (contact.length) {
    doc.setFontSize(c.fsSml); doc.setFont("helvetica", "normal"); doc.setTextColor(...med);
    const wrapped = doc.splitTextToSize(contact.join("  |  "), cW) as string[];
    doc.text(wrapped, c.mg, y); y += wrapped.length * c.lhSml + (is1 ? 3 : 5);
  }

  const barH = is1 ? 5.5 : 7;
  const sec = (title: string) => {
    gap(14);
    doc.setFillColor(...purpleLight); doc.rect(c.mg, y - barH + 1, cW, barH, "F");
    doc.setFillColor(...purple); doc.rect(c.mg, y - barH + 1, is1 ? 2 : 3, barH, "F");
    doc.setFontSize(c.fsHead); doc.setFont("helvetica", "bold"); doc.setTextColor(...purple);
    doc.text(title.toUpperCase(), c.mg + (is1 ? 4 : 6), y);
    y += barH - 1 + c.spSec - 2;
  };

  if (data.summary.trim()) {
    sec("Summary");
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
    const ls = doc.splitTextToSize(data.summary.trim(), cW) as string[];
    gap(ls.length * c.lhBody + 4); doc.text(ls, c.mg, y); y += ls.length * c.lhBody + (is1 ? 4 : 6);
  }

  const active = data.skills.filter(s => s.items.length > 0);
  if (active.length) {
    sec("Skills");
    for (const sk of active) {
      const ls = doc.splitTextToSize(sk.items.join(", "), cW - c.skillCatW) as string[];
      const out = is1 ? [ls[0] ?? ""] : ls;
      const h = Math.max(out.length * c.lhBody, c.lhBody);
      gap(h + 1.5);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...purple); doc.text(sk.category, c.mg, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...dark); doc.text(out, c.mg + c.skillCatW, y); y += h + 1.5;
    }
    y += is1 ? 2 : 3;
  }

  if (data.experience.length) {
    sec("Experience");
    for (const exp of data.experience) {
      gap(18);
      let titleMaxW = cW;
      if (exp.duration) { doc.setFontSize(c.fsSml); doc.setFont("helvetica", "normal"); titleMaxW = cW - doc.getTextWidth(exp.duration) - 3; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
      doc.text((doc.splitTextToSize(exp.title || "Job Title", titleMaxW) as string[])[0] ?? "", c.mg, y);
      if (exp.duration) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(exp.duration, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (exp.company) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...purple); doc.text(exp.company, c.mg, y); y += is1 ? 3.5 : 5; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
      for (const b of exp.bullets) bullet(b);
      y += c.spEntry;
    }
  }

  if (data.projects.length) {
    sec("Projects");
    for (const p of data.projects) {
      gap(18);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(p.name || "Project", c.mg, y);
      if (p.liveLink) { doc.setFont("helvetica", "italic"); doc.setFontSize(c.fsSml); doc.setTextColor(...purple); doc.text(p.liveLink, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (p.description) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...dark);
        const ls = doc.splitTextToSize(p.description, cW) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        gap(out.length * c.lhBody + 2); doc.text(out, c.mg, y); y += out.length * c.lhBody + 2;
      }
      if (p.techStack) {
        gap(c.lhBody + 2); doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...purple);
        const lbl = "Tech Stack: "; doc.text(lbl, c.mg, y);
        const lw = doc.getTextWidth(lbl); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
        const ls = doc.splitTextToSize(p.techStack, cW - lw) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        doc.text(out[0] ?? "", c.mg + lw, y);
        for (let k = 1; k < out.length; k++) { y += c.lhBody; gap(c.lhBody); doc.text(out[k] ?? "", c.mg + lw, y); }
        y += c.lhBody;
      }
      y += c.spEntry;
    }
  }

  if (data.education.length) {
    sec("Education");
    for (const e of data.education) {
      gap(12);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(e.degree || "Degree", c.mg, y);
      if (e.dates) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(e.dates, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (e.institution) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...med); doc.text(e.institution, c.mg, y); y += is1 ? 5 : 7; }
    }
    y += 2;
  }

  const certs = data.certificates.filter(c2 => c2.issuer.trim() || c2.names.length > 0);
  if (certs.length) {
    sec("Certificates");
    for (const cert of certs) {
      gap(12);
      if (cert.issuer.trim()) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(cert.issuer, c.mg, y);
        if (cert.date) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(cert.date, pageW - c.mg, y, { align: "right" }); }
        y += is1 ? 3.5 : 5;
      }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
      for (const n of cert.names) bullet(n);
      y += c.spEntry;
    }
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p); doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} of ${total}`, pageW / 2, pageH - 4, { align: "center" });
  }

  doc.save(`${safeName(data.personalInfo.name)}-cv.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — Executive (two-column)
// ─────────────────────────────────────────────────────────────────────────────

async function generateExecutive(data: CVPDFData, pageMode: PageMode): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const is1 = pageMode === "1-page";
  const c = cfg(is1);

  const sideW  = is1 ? 52  : 62;
  const rightX = sideW + (is1 ? 3 : 5);
  const rightW = pageW - rightX - (is1 ? 8 : 14);
  const topMg  = is1 ? 10 : 14;
  const pgBotRes = 8;
  const maxRY  = pageH - topMg - pgBotRes;

  const navy:   [number, number, number] = [28, 32, 50];
  const whiteC: [number, number, number] = [255, 255, 255];
  const lightG: [number, number, number] = [190, 192, 205];
  const black:  [number, number, number] = [20, 20, 20];
  const darkG:  [number, number, number] = [50, 50, 50];
  const medG:   [number, number, number] = [110, 110, 110];
  const divL:   [number, number, number] = [180, 180, 192];

  const drawSide = () => { doc.setFillColor(...navy); doc.rect(0, 0, sideW, pageH, "F"); };
  drawSide();

  // ── Left column ──────────────────────────────────────────────────────────
  let lY = topMg;

  const lSec = (title: string) => {
    lY += is1 ? 2 : 3;
    doc.setFontSize(is1 ? 7 : 8); doc.setFont("helvetica", "bold"); doc.setTextColor(...whiteC);
    doc.text(title.toUpperCase(), 4, lY); lY += 1.5;
    doc.setDrawColor(...lightG); doc.setLineWidth(0.25); doc.line(4, lY, sideW - 3, lY); lY += is1 ? 2.5 : 4;
  };

  // Name
  doc.setFontSize(is1 ? 12 : 14); doc.setFont("helvetica", "bold"); doc.setTextColor(...whiteC);
  const nameL = doc.splitTextToSize(data.personalInfo.name || "Your Name", sideW - 8) as string[];
  doc.text(nameL, 4, lY); lY += nameL.length * (is1 ? 5 : 6.5) + 2;

  if (data.personalInfo.title.trim()) {
    doc.setFontSize(is1 ? 7 : 8); doc.setFont("helvetica", "normal"); doc.setTextColor(...lightG);
    const tL = doc.splitTextToSize(data.personalInfo.title, sideW - 8) as string[];
    doc.text(tL, 4, lY); lY += tL.length * (is1 ? 3.5 : 4) + 3;
  }

  const contact = [
    data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location,
    data.personalInfo.portfolio, data.personalInfo.github, data.personalInfo.linkedin,
  ].filter(Boolean);
  if (contact.length) {
    lSec("Contact");
    doc.setFontSize(is1 ? 7 : 7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...lightG);
    for (const p of contact) {
      if (lY > pageH - topMg) break;
      const ls = doc.splitTextToSize(p, sideW - 8) as string[];
      doc.text(ls, 4, lY); lY += ls.length * (is1 ? 3.2 : 3.8) + 1.5;
    }
  }

  const activeSkills = data.skills.filter(s => s.items.length > 0);
  if (activeSkills.length) {
    lSec("Skills");
    for (const sk of activeSkills) {
      if (lY > pageH - topMg) break;
      doc.setFontSize(is1 ? 7.5 : 8); doc.setFont("helvetica", "bold"); doc.setTextColor(...whiteC);
      doc.text(sk.category, 4, lY); lY += is1 ? 3 : 3.5;
      doc.setFont("helvetica", "normal"); doc.setTextColor(...lightG);
      const ls = doc.splitTextToSize(sk.items.join(", "), sideW - 8) as string[];
      const out = is1 ? [ls[0] ?? ""] : ls;
      doc.text(out, 4, lY); lY += out.length * (is1 ? 3.2 : 3.8) + 2;
    }
  }

  if (data.education.length) {
    lSec("Education");
    for (const e of data.education) {
      if (lY > pageH - topMg) break;
      doc.setFontSize(is1 ? 7.5 : 8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...whiteC);
      const dl = doc.splitTextToSize(e.degree || "Degree", sideW - 8) as string[];
      doc.text(dl, 4, lY); lY += dl.length * (is1 ? 3.2 : 4) + 1;
      doc.setFontSize(is1 ? 7 : 7.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...lightG);
      if (e.institution) { doc.text(e.institution, 4, lY); lY += is1 ? 3.2 : 3.8; }
      if (e.dates) { doc.text(e.dates, 4, lY); lY += is1 ? 4 : 5; }
    }
  }

  const certs = data.certificates.filter(c2 => c2.issuer.trim() || c2.names.length > 0);
  if (certs.length) {
    lSec("Certificates");
    for (const cert of certs) {
      if (lY > pageH - topMg) break;
      if (cert.issuer.trim()) {
        doc.setFontSize(is1 ? 7.5 : 8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...whiteC);
        doc.text(cert.issuer, 4, lY); lY += is1 ? 3.5 : 4;
      }
      doc.setFontSize(is1 ? 7 : 7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...lightG);
      for (const n of cert.names) {
        if (!n.trim() || lY > pageH - topMg) break;
        const ls = doc.splitTextToSize(`• ${n.trim()}`, sideW - 10) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        doc.text(out, 6, lY); lY += out.length * (is1 ? 3.2 : 3.8) + 1;
      }
      lY += 2;
    }
  }

  // ── Right column ─────────────────────────────────────────────────────────
  let rY = topMg;
  const rGap = (needed: number) => {
    if (rY + needed > maxRY && !is1) { doc.addPage(); drawSide(); rY = topMg; }
  };

  const rSec = (title: string) => {
    rGap(14);
    doc.setFontSize(c.fsHead); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
    doc.text(title.toUpperCase(), rightX, rY); rY += 2;
    doc.setDrawColor(...divL); doc.setLineWidth(0.3); doc.line(rightX, rY, pageW - (is1 ? 8 : 14), rY); rY += c.spSec;
  };

  const rBullet = (text: string) => {
    if (!text.trim()) return;
    const bW = doc.getTextWidth("• ");
    const textX = rightX + 3 + bW;
    const textW = rightW - 3 - bW;
    const ls = doc.splitTextToSize(text.trim(), textW) as string[];
    const out = is1 && ls.length > 1 ? [`${(ls[0] ?? "").trimEnd()}…`] : ls;
    rGap(out.length * c.lhBody + c.spBullet);
    doc.text("•", rightX + 3, rY);
    out.forEach((line, i) => doc.text(line, textX, rY + i * c.lhBody));
    rY += out.length * c.lhBody + c.spBullet;
  };

  if (data.summary.trim()) {
    rSec("Summary");
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...darkG);
    const ls = doc.splitTextToSize(data.summary.trim(), rightW) as string[];
    rGap(ls.length * c.lhBody + 4); doc.text(ls, rightX, rY); rY += ls.length * c.lhBody + (is1 ? 4 : 6);
  }

  if (data.experience.length) {
    rSec("Experience");
    for (const exp of data.experience) {
      rGap(18);
      let titleMaxW = rightW;
      if (exp.duration) { doc.setFontSize(c.fsSml); doc.setFont("helvetica", "normal"); titleMaxW = rightW - doc.getTextWidth(exp.duration) - 3; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
      doc.text((doc.splitTextToSize(exp.title || "Job Title", titleMaxW) as string[])[0] ?? "", rightX, rY);
      if (exp.duration) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...medG); doc.text(exp.duration, pageW - (is1 ? 8 : 14), rY, { align: "right" }); }
      rY += is1 ? 3.5 : 5;
      if (exp.company) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...darkG); doc.text(exp.company, rightX, rY); rY += is1 ? 3.5 : 5; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...darkG);
      for (const b of exp.bullets) rBullet(b);
      rY += c.spEntry;
    }
  }

  if (data.projects.length) {
    rSec("Projects");
    for (const p of data.projects) {
      rGap(18);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(p.name || "Project", rightX, rY);
      if (p.liveLink) { doc.setFont("helvetica", "italic"); doc.setFontSize(c.fsSml); doc.setTextColor(...medG); doc.text(p.liveLink, pageW - (is1 ? 8 : 14), rY, { align: "right" }); }
      rY += is1 ? 3.5 : 5;
      if (p.description) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...darkG);
        const ls = doc.splitTextToSize(p.description, rightW) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        rGap(out.length * c.lhBody + 2); doc.text(out, rightX, rY); rY += out.length * c.lhBody + 2;
      }
      if (p.techStack) {
        rGap(c.lhBody + 2); doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...darkG);
        const lbl = "Tech Stack: "; doc.text(lbl, rightX, rY);
        const lw = doc.getTextWidth(lbl); doc.setFont("helvetica", "normal");
        const ls = doc.splitTextToSize(p.techStack, rightW - lw) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        doc.text(out[0] ?? "", rightX + lw, rY);
        for (let k = 1; k < out.length; k++) { rY += c.lhBody; rGap(c.lhBody); doc.text(out[k] ?? "", rightX + lw, rY); }
        rY += c.lhBody;
      }
      rY += c.spEntry;
    }
  }

  // Page numbers (right-column area so they sit on white, not sidebar)
  const total = doc.getNumberOfPages();
  const pgNumX = rightX + rightW / 2;
  for (let p = 1; p <= total; p++) {
    doc.setPage(p); doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} of ${total}`, pgNumX, pageH - 4, { align: "center" });
  }

  doc.save(`${safeName(data.personalInfo.name)}-cv.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — Minimal Dark
// ─────────────────────────────────────────────────────────────────────────────

async function generateMinimalDark(data: CVPDFData, pageMode: PageMode): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const is1 = pageMode === "1-page";
  const c = cfg(is1);
  const cW = pageW - c.mg * 2;
  const pgBotRes = 8;

  const darkBg: [number, number, number] = [17, 24, 39];
  const whiteC: [number, number, number] = [255, 255, 255];
  const subW:   [number, number, number] = [180, 185, 200];
  const black:  [number, number, number] = [15, 15, 15];
  const dark:   [number, number, number] = [45, 45, 45];
  const med:    [number, number, number] = [100, 100, 100];

  // Dark header
  const hH = is1 ? 26 : 36;
  doc.setFillColor(...darkBg); doc.rect(0, 0, pageW, hH, "F");

  const nameY  = is1 ? 12 : 16;
  const titleY = is1 ? 18 : 23;
  const contY  = is1 ? 23 : 30;

  doc.setFontSize(c.fsName); doc.setFont("helvetica", "bold"); doc.setTextColor(...whiteC);
  doc.text(data.personalInfo.name || "Your Name", c.mg, nameY);

  if (data.personalInfo.title.trim()) {
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...subW);
    doc.text(data.personalInfo.title, c.mg, titleY);
  }

  const contact = [
    data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location,
    data.personalInfo.portfolio, data.personalInfo.github, data.personalInfo.linkedin,
  ].filter(Boolean);
  if (contact.length) {
    doc.setFontSize(is1 ? 6.5 : 8); doc.setFont("helvetica", "normal"); doc.setTextColor(...subW);
    const wrapped = doc.splitTextToSize(contact.join("  |  "), cW) as string[];
    doc.text(wrapped[0] ?? "", c.mg, contY);
  }

  let y = hH + (is1 ? 8 : 12);
  const maxY = pageH - c.mg - pgBotRes;
  const gap = (needed: number) => {
    if (y + needed > maxY && !is1) { doc.addPage(); y = c.mg; }
  };

  const bullet = (text: string) => {
    if (!text.trim()) return;
    const bW = doc.getTextWidth("• ");
    const textX = c.mg + 3 + bW;
    const textW = cW - 3 - bW;
    const ls = doc.splitTextToSize(text.trim(), textW) as string[];
    const out = is1 && ls.length > 1 ? [`${(ls[0] ?? "").trimEnd()}…`] : ls;
    gap(out.length * c.lhBody + c.spBullet);
    doc.text("•", c.mg + 3, y);
    out.forEach((line, i) => doc.text(line, textX, y + i * c.lhBody));
    y += out.length * c.lhBody + c.spBullet;
  };

  const sec = (title: string) => {
    gap(12);
    doc.setFontSize(c.fsHead); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
    doc.text(title.toUpperCase(), c.mg, y); y += is1 ? 4 : 5;
  };

  if (data.summary.trim()) {
    sec("Summary");
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
    const ls = doc.splitTextToSize(data.summary.trim(), cW) as string[];
    gap(ls.length * c.lhBody + 4); doc.text(ls, c.mg, y); y += ls.length * c.lhBody + (is1 ? 5 : 7);
  }

  const active = data.skills.filter(s => s.items.length > 0);
  if (active.length) {
    sec("Skills");
    for (const sk of active) {
      const ls = doc.splitTextToSize(sk.items.join(", "), cW - c.skillCatW) as string[];
      const out = is1 ? [ls[0] ?? ""] : ls;
      const h = Math.max(out.length * c.lhBody, c.lhBody);
      gap(h + 1.5);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(sk.category, c.mg, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...dark); doc.text(out, c.mg + c.skillCatW, y); y += h + 1.5;
    }
    y += is1 ? 3 : 5;
  }

  if (data.experience.length) {
    sec("Experience");
    for (const exp of data.experience) {
      gap(18);
      let titleMaxW = cW;
      if (exp.duration) { doc.setFontSize(c.fsSml); doc.setFont("helvetica", "normal"); titleMaxW = cW - doc.getTextWidth(exp.duration) - 3; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
      doc.text((doc.splitTextToSize(exp.title || "Job Title", titleMaxW) as string[])[0] ?? "", c.mg, y);
      if (exp.duration) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(exp.duration, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (exp.company) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark); doc.text(exp.company, c.mg, y); y += is1 ? 3.5 : 5; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
      for (const b of exp.bullets) bullet(b);
      y += c.spEntry;
    }
  }

  if (data.projects.length) {
    sec("Projects");
    for (const p of data.projects) {
      gap(18);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(p.name || "Project", c.mg, y);
      if (p.liveLink) { doc.setFont("helvetica", "italic"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(p.liveLink, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (p.description) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...dark);
        const ls = doc.splitTextToSize(p.description, cW) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        gap(out.length * c.lhBody + 2); doc.text(out, c.mg, y); y += out.length * c.lhBody + 2;
      }
      if (p.techStack) {
        gap(c.lhBody + 2); doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
        const lbl = "Tech Stack: "; doc.text(lbl, c.mg, y);
        const lw = doc.getTextWidth(lbl); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
        const ls = doc.splitTextToSize(p.techStack, cW - lw) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        doc.text(out[0] ?? "", c.mg + lw, y);
        for (let k = 1; k < out.length; k++) { y += c.lhBody; gap(c.lhBody); doc.text(out[k] ?? "", c.mg + lw, y); }
        y += c.lhBody;
      }
      y += c.spEntry;
    }
  }

  if (data.education.length) {
    sec("Education");
    for (const e of data.education) {
      gap(12);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(e.degree || "Degree", c.mg, y);
      if (e.dates) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(e.dates, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (e.institution) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...med); doc.text(e.institution, c.mg, y); y += is1 ? 5 : 7; }
    }
    y += 2;
  }

  const certs = data.certificates.filter(c2 => c2.issuer.trim() || c2.names.length > 0);
  if (certs.length) {
    sec("Certificates");
    for (const cert of certs) {
      gap(12);
      if (cert.issuer.trim()) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(cert.issuer, c.mg, y);
        if (cert.date) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(cert.date, pageW - c.mg, y, { align: "right" }); }
        y += is1 ? 3.5 : 5;
      }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
      for (const n of cert.names) bullet(n);
      y += c.spEntry;
    }
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p); doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} of ${total}`, pageW / 2, pageH - 4, { align: "center" });
  }

  doc.save(`${safeName(data.personalInfo.name)}-cv.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — Creative Tech
// ─────────────────────────────────────────────────────────────────────────────

async function generateCreativeTech(data: CVPDFData, pageMode: PageMode): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const is1 = pageMode === "1-page";
  const c = cfg(is1);
  const cW = pageW - c.mg * 2;
  const maxY = pageH - c.mg - c.pgBotRes;

  const teal:   [number, number, number] = [13, 148, 136];
  const tealBg: [number, number, number] = [232, 248, 246];
  const black:  [number, number, number] = [15, 15, 15];
  const dark:   [number, number, number] = [45, 45, 45];
  const med:    [number, number, number] = [100, 100, 100];
  const lineC:  [number, number, number] = [200, 240, 236];

  let y = c.mg;
  const gap = (needed: number) => {
    if (y + needed > maxY && !is1) { doc.addPage(); y = c.mg; }
  };

  const bullet = (text: string) => {
    if (!text.trim()) return;
    const bW = doc.getTextWidth("• ");
    const textX = c.mg + 3 + bW;
    const textW = cW - 3 - bW;
    const ls = doc.splitTextToSize(text.trim(), textW) as string[];
    const out = is1 && ls.length > 1 ? [`${(ls[0] ?? "").trimEnd()}…`] : ls;
    gap(out.length * c.lhBody + c.spBullet);
    doc.text("•", c.mg + 3, y);
    out.forEach((line, i) => doc.text(line, textX, y + i * c.lhBody));
    y += out.length * c.lhBody + c.spBullet;
  };

  // Header
  doc.setFontSize(c.fsName); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
  doc.text(data.personalInfo.name || "Your Name", c.mg, y); y += is1 ? 6 : 8;

  if (data.personalInfo.title.trim()) {
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...teal);
    doc.text(data.personalInfo.title, c.mg, y); y += is1 ? 4 : 5.5;
  }

  const contact = [
    data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location,
    data.personalInfo.portfolio, data.personalInfo.github, data.personalInfo.linkedin,
  ].filter(Boolean);
  if (contact.length) {
    doc.setFontSize(c.fsSml); doc.setFont("helvetica", "normal"); doc.setTextColor(...med);
    const wrapped = doc.splitTextToSize(contact.join("  |  "), cW) as string[];
    doc.text(wrapped, c.mg, y); y += wrapped.length * c.lhSml + 3;
  }

  doc.setFillColor(...teal); doc.rect(c.mg, y, cW, is1 ? 0.6 : 1, "F"); y += is1 ? 5 : 7;

  const sec = (title: string) => {
    gap(14);
    doc.setFontSize(c.fsHead); doc.setFont("helvetica", "bold"); doc.setTextColor(...teal);
    doc.text(title.toUpperCase(), c.mg, y); y += 2;
    doc.setDrawColor(...lineC); doc.setLineWidth(0.4); doc.line(c.mg, y, pageW - c.mg, y); y += c.spSec;
  };

  if (data.summary.trim()) {
    sec("Summary");
    doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
    const ls = doc.splitTextToSize(data.summary.trim(), cW) as string[];
    gap(ls.length * c.lhBody + 4); doc.text(ls, c.mg, y); y += ls.length * c.lhBody + (is1 ? 4 : 6);
  }

  // Skills as tag pills (or compact in 1-page)
  const active = data.skills.filter(s => s.items.length > 0);
  if (active.length) {
    sec("Skills");
    for (const sk of active) {
      gap(is1 ? 8 : 14);
      doc.setFontSize(is1 ? 7.5 : 9); doc.setFont("helvetica", "bold"); doc.setTextColor(...teal);
      doc.text(sk.category, c.mg, y); y += is1 ? 3.5 : 5;

      if (is1) {
        // In 1-page: compact single-line comma-separated (no tags)
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
        const ls = doc.splitTextToSize(sk.items.join(", "), cW) as string[];
        doc.text(ls[0] ?? "", c.mg, y); y += c.lhBody + 2;
      } else {
        // 2-page: pill tags
        let tagX = c.mg;
        const tagH = 5.5;
        for (const item of sk.items) {
          doc.setFontSize(8.5); doc.setFont("helvetica", "normal");
          const tw = doc.getTextWidth(item) + 6;
          if (tagX + tw > pageW - c.mg) { tagX = c.mg; y += tagH + 2; gap(tagH + 2); }
          doc.setFillColor(...tealBg);
          doc.roundedRect(tagX, y - 3.8, tw, tagH, 1, 1, "F");
          doc.setDrawColor(...teal); doc.setLineWidth(0.2);
          doc.roundedRect(tagX, y - 3.8, tw, tagH, 1, 1, "S");
          doc.setTextColor(...teal); doc.text(item, tagX + 3, y);
          tagX += tw + 2.5;
        }
        y += tagH + 4;
      }
    }
  }

  if (data.experience.length) {
    sec("Experience");
    for (const exp of data.experience) {
      gap(18);
      let titleMaxW = cW;
      if (exp.duration) { doc.setFontSize(c.fsSml); doc.setFont("helvetica", "normal"); titleMaxW = cW - doc.getTextWidth(exp.duration) - 3; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
      doc.text((doc.splitTextToSize(exp.title || "Job Title", titleMaxW) as string[])[0] ?? "", c.mg, y);
      if (exp.duration) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(exp.duration, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (exp.company) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...teal); doc.text(exp.company, c.mg, y); y += is1 ? 3.5 : 5; }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
      for (const b of exp.bullets) bullet(b);
      y += c.spEntry;
    }
  }

  if (data.projects.length) {
    sec("Projects");
    for (const p of data.projects) {
      gap(18);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(p.name || "Project", c.mg, y);
      if (p.liveLink) { doc.setFont("helvetica", "italic"); doc.setFontSize(c.fsSml); doc.setTextColor(...teal); doc.text(p.liveLink, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (p.description) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...dark);
        const ls = doc.splitTextToSize(p.description, cW) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        gap(out.length * c.lhBody + 2); doc.text(out, c.mg, y); y += out.length * c.lhBody + 2;
      }
      if (p.techStack) {
        gap(c.lhBody + 2); doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...teal);
        const lbl = "Tech Stack: "; doc.text(lbl, c.mg, y);
        const lw = doc.getTextWidth(lbl); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
        const ls = doc.splitTextToSize(p.techStack, cW - lw) as string[];
        const out = is1 ? [ls[0] ?? ""] : ls;
        doc.text(out[0] ?? "", c.mg + lw, y);
        for (let k = 1; k < out.length; k++) { y += c.lhBody; gap(c.lhBody); doc.text(out[k] ?? "", c.mg + lw, y); }
        y += c.lhBody;
      }
      y += c.spEntry;
    }
  }

  if (data.education.length) {
    sec("Education");
    for (const e of data.education) {
      gap(12);
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(e.degree || "Degree", c.mg, y);
      if (e.dates) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(e.dates, pageW - c.mg, y, { align: "right" }); }
      y += is1 ? 3.5 : 5;
      if (e.institution) { doc.setFontSize(c.fsBody); doc.setFont("helvetica", "italic"); doc.setTextColor(...med); doc.text(e.institution, c.mg, y); y += is1 ? 5 : 7; }
    }
    y += 2;
  }

  const certs = data.certificates.filter(c2 => c2.issuer.trim() || c2.names.length > 0);
  if (certs.length) {
    sec("Certificates");
    for (const cert of certs) {
      gap(12);
      if (cert.issuer.trim()) {
        doc.setFontSize(c.fsBody); doc.setFont("helvetica", "bold"); doc.setTextColor(...black); doc.text(cert.issuer, c.mg, y);
        if (cert.date) { doc.setFont("helvetica", "normal"); doc.setFontSize(c.fsSml); doc.setTextColor(...med); doc.text(cert.date, pageW - c.mg, y, { align: "right" }); }
        y += is1 ? 3.5 : 5;
      }
      doc.setFontSize(c.fsBody); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
      for (const n of cert.names) bullet(n);
      y += c.spEntry;
    }
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p); doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} of ${total}`, pageW / 2, pageH - 4, { align: "center" });
  }

  doc.save(`${safeName(data.personalInfo.name)}-cv.pdf`);
}
