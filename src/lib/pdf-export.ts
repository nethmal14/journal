import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Edition } from "./issue-types";

interface ExportOptions {
  selector: string;
  filename: string;
  edition: Edition;
}

// Render DOM nodes matching `selector` to a multi-page A4 PDF.
// Each matched element becomes one PDF page.
export async function exportToPdf({ selector, filename, edition }: ExportOptions) {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (nodes.length === 0) throw new Error("No pages to export");

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    // Wait for any images inside to load before capture
    await waitForImages(node);

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: edition.tokens.surface,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    // Fit canvas into PDF page preserving aspect ratio
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    if (i > 0) pdf.addPage();
    // If content taller than one page, html2canvas has already captured the
    // whole node — we just place it scaled to page width and let it overflow.
    // For MVP this is acceptable; future iteration can slice into multiple pages.
    pdf.addImage(imgData, "JPEG", 0, 0, imgW, Math.min(imgH, pageH));
  }

  pdf.save(filename);
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
    )
  ).then(() => undefined);
}
