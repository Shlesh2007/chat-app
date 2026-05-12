import fs from 'fs';
import path from 'path';

/**
 * Extract text from any supported file type.
 * Supported: pdf, txt, md, doc, docx, xls, xlsx, csv,
 *            js, ts, py, java, c, cpp, html, css, json, xml, yaml, yml
 */
export async function extractFileText(filePath, fileType) {
  const ext = fileType.toLowerCase().replace('.', '');

  // ── Plain text / code files ───────────────────────────────────────────────
  const textTypes = [
    'txt', 'md', 'markdown',
    'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
    'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt',
    'html', 'htm', 'css', 'scss', 'sass',
    'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'env',
    'sh', 'bash', 'bat', 'ps1',
    'sql', 'graphql', 'proto',
    'r', 'matlab', 'scala',
  ];

  if (textTypes.includes(ext)) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (ext === 'pdf') {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  // ── Word documents (.doc / .docx) ─────────────────────────────────────────
  if (ext === 'docx' || ext === 'doc') {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  // ── Excel (.xlsx / .xls) ─────────────────────────────────────────────────
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = (await import('xlsx')).default;
    const workbook = XLSX.readFile(filePath);
    let text = '';
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      text += `\n--- Sheet: ${sheetName} ---\n${csv}\n`;
    }
    return text.trim();
  }

  // ── CSV ───────────────────────────────────────────────────────────────────
  if (ext === 'csv') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // ── Fallback: try reading as text ─────────────────────────────────────────
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(`Unsupported file type: .${ext}`);
  }
}
