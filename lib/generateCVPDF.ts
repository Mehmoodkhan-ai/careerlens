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

export async function generateCVPDF(data: CVPDFData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  const black: [number, number, number] = [15, 15, 15];
  const darkGray: [number, number, number] = [45, 45, 45];
  const medGray: [number, number, number] = [100, 100, 100];
  const lineColor: [number, number, number] = [185, 185, 185];

  let y = margin;

  const ensurePage = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Name ──────────────────────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text(data.personalInfo.name || "Your Name", margin, y);
  y += 8;

  // ── Professional title ────────────────────────────────────────────────────
  if (data.personalInfo.title.trim()) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkGray);
    doc.text(data.personalInfo.title, margin, y);
    y += 5.5;
  }

  // ── Contact line ──────────────────────────────────────────────────────────
  const contactParts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.portfolio,
    data.personalInfo.github,
    data.personalInfo.linkedin,
  ].filter((s) => s.trim() !== "");

  if (contactParts.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...medGray);
    const contactLine = contactParts.join("  |  ");
    const wrapped = doc.splitTextToSize(contactLine, contentW) as string[];
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4.5 + 3;
  }

  // ── Header divider ────────────────────────────────────────────────────────
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // ── Section helper ────────────────────────────────────────────────────────
  const addSection = (title: string) => {
    ensurePage(16);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text(title.toUpperCase(), margin, y);
    y += 2.5;
    doc.setDrawColor(...lineColor);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  // ── Summary ───────────────────────────────────────────────────────────────
  if (data.summary.trim()) {
    addSection("Summary");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkGray);
    const lines = doc.splitTextToSize(data.summary.trim(), contentW) as string[];
    ensurePage(lines.length * 5 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 6;
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  const activeSkills = data.skills.filter((s) => s.items.length > 0);
  if (activeSkills.length > 0) {
    addSection("Skills");
    const catColW = 38;
    const itemColW = contentW - catColW;

    for (const sk of activeSkills) {
      const itemText = sk.items.join(", ");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkGray);
      const itemLines = doc.splitTextToSize(itemText, itemColW) as string[];
      const rowH = Math.max(itemLines.length * 5, 5);
      ensurePage(rowH + 2);

      doc.setFont("helvetica", "bold");
      doc.text(sk.category, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(itemLines, margin + catColW, y);
      y += rowH + 1.5;
    }
    y += 3;
  }

  // ── Experience ────────────────────────────────────────────────────────────
  if (data.experience.length > 0) {
    addSection("Experience");

    for (const exp of data.experience) {
      ensurePage(20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...black);
      doc.text(exp.title || "Job Title", margin, y);

      if (exp.duration) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...medGray);
        doc.text(exp.duration, pageW - margin, y, { align: "right" });
      }
      y += 5;

      if (exp.company) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkGray);
        doc.text(exp.company, margin, y);
        y += 5;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkGray);

      for (const bullet of exp.bullets) {
        if (!bullet.trim()) continue;
        const line = `•  ${bullet.trim()}`;
        const lines = doc.splitTextToSize(line, contentW - 6) as string[];
        ensurePage(lines.length * 5 + 2);
        doc.text(lines, margin + 3, y);
        y += lines.length * 5 + 1.5;
      }

      y += 4;
    }
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (data.projects.length > 0) {
    addSection("Projects");

    for (const proj of data.projects) {
      ensurePage(22);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...black);
      doc.text(proj.name || "Project", margin, y);

      if (proj.liveLink) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...medGray);
        doc.text(proj.liveLink, pageW - margin, y, { align: "right" });
      }
      y += 5;

      if (proj.description) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...darkGray);
        const descLines = doc.splitTextToSize(proj.description, contentW) as string[];
        ensurePage(descLines.length * 5 + 2);
        doc.text(descLines, margin, y);
        y += descLines.length * 5 + 2;
      }

      if (proj.techStack) {
        ensurePage(8);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkGray);
        const tsLabel = "Tech Stack: ";
        doc.text(tsLabel, margin, y);
        const labelW = doc.getTextWidth(tsLabel);
        doc.setFont("helvetica", "normal");
        const tsLines = doc.splitTextToSize(proj.techStack, contentW - labelW) as string[];
        doc.text(tsLines[0] ?? "", margin + labelW, y);
        for (let k = 1; k < tsLines.length; k++) {
          y += 5;
          ensurePage(5);
          doc.text(tsLines[k] ?? "", margin + labelW, y);
        }
        y += 5;
      }

      y += 3;
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (data.education.length > 0) {
    addSection("Education");

    for (const edu of data.education) {
      ensurePage(14);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...black);
      doc.text(edu.degree || "Degree", margin, y);

      if (edu.dates) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...medGray);
        doc.text(edu.dates, pageW - margin, y, { align: "right" });
      }
      y += 5;

      if (edu.institution) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...medGray);
        doc.text(edu.institution, margin, y);
        y += 7;
      }
    }
    y += 2;
  }

  // ── Certificates ──────────────────────────────────────────────────────────
  const activeCerts = data.certificates.filter(
    (c) => c.issuer.trim() || c.names.length > 0
  );
  if (activeCerts.length > 0) {
    addSection("Certificates");

    for (const cert of activeCerts) {
      ensurePage(14);

      if (cert.issuer.trim()) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...black);
        doc.text(cert.issuer, margin, y);

        if (cert.date) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...medGray);
          doc.text(cert.date, pageW - margin, y, { align: "right" });
        }
        y += 5;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkGray);

      for (const name of cert.names) {
        if (!name.trim()) continue;
        const line = `•  ${name.trim()}`;
        const lines = doc.splitTextToSize(line, contentW - 6) as string[];
        ensurePage(lines.length * 5 + 2);
        doc.text(lines, margin + 3, y);
        y += lines.length * 5 + 1.5;
      }

      y += 4;
    }
  }

  const safeName = (data.personalInfo.name || "cv")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  doc.save(`${safeName}-cv.pdf`);
}
