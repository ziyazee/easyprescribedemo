import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4_W = 210; // mm
const A4_H = 297;

/**
 * Capture an array of DOM page elements and stitch them into one A4 PDF.
 * Each element is rendered as one full page.
 *
 * @param {HTMLElement[]} pages - Array of DOM nodes (one per page).
 * @param {string} filename - Output filename (without .pdf extension).
 */
export async function downloadPrescriptionPdf(pages, filename = 'prescription') {
  if (!Array.isArray(pages)) pages = [pages];

  const pdf = new jsPDF('p', 'mm', 'a4');

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i];

    // Clone off-screen so we capture full content without viewport constraints
    const clone = el.cloneNode(true);
    clone.querySelectorAll('input').forEach((input) => {
      const span = document.createElement('span');
      span.textContent = input.value || '';
      span.style.cssText = 'font:inherit;color:inherit;';
      input.replaceWith(span);
    });

    // Lock clone to exact A4 proportions: 850px × 1202px.
    // PageShell uses minHeight:1202px so content can overflow; we must
    // clamp here so the captured canvas is always exactly A4-ratio.
    clone.style.height = '1202px';
    clone.style.maxHeight = '1202px';
    clone.style.overflow = 'hidden';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:850px;overflow:hidden;background:white;z-index:-1;';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Wait for all images (including Flaticon CDN icons) to load before capture
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((r) => {
                img.onload = r;
                img.onerror = r;
              })
      )
    );
    await new Promise((r) => setTimeout(r, 100));

    let canvas;
    try {
      canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
    } finally {
      document.body.removeChild(wrapper);
    }

    if (i > 0) pdf.addPage();

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfW = A4_W;
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, Math.min(pdfH, A4_H));
  }

  pdf.save(`${filename}.pdf`);
}
