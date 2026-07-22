import puppeteer from "puppeteer";
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateProgrammationsPDF(fournisseur, programmations, start, end) {
  const html = await ejs.renderFile(
    path.join(__dirname, '../templates/programmations.ejs'),
    { fournisseur, programmations, start, end } // pense à passer ces variables au template
  );

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '15px', right: '15px' }
  });

  await browser.close();
  return pdfBuffer;
}

export { generateProgrammationsPDF };