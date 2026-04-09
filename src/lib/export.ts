import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import type { Transcription } from '../types';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

export function exportToTxt(transcription: Transcription) {
  let content = `Transcription: ${transcription.filename}\n`;
  content += `Date: ${new Date(transcription.created_at).toLocaleString()}\n`;
  content += `Language: ${transcription.language}\n`;
  content += `Model: ${transcription.model}\n`;
  content += `---\n\n`;

  if (transcription.segments.length > 0) {
    transcription.segments.forEach((seg) => {
      content += `[${formatTime(seg.start)}] ${seg.text}\n`;
    });
  } else {
    content += transcription.text;
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${baseName(transcription.filename)}.txt`);
}

export function exportToSrt(transcription: Transcription) {
  let content = '';

  if (transcription.segments.length > 0) {
    transcription.segments.forEach((seg, i) => {
      content += `${i + 1}\n`;
      content += `${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n`;
      content += `${seg.text}\n\n`;
    });
  } else {
    content += `1\n00:00:00,000 --> 00:00:00,000\n${transcription.text}\n\n`;
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${baseName(transcription.filename)}.srt`);
}

export function exportToPdf(transcription: Transcription) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  doc.setFontSize(16);
  doc.text(transcription.filename, margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Date: ${new Date(transcription.created_at).toLocaleString()} | Language: ${transcription.language} | Model: ${transcription.model}`,
    margin,
    y
  );
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, margin + pageWidth, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(40);

  if (transcription.segments.length > 0) {
    transcription.segments.forEach((seg) => {
      const timestamp = `[${formatTime(seg.start)}] `;
      const text = seg.text;
      const lines = doc.splitTextToSize(timestamp + text, pageWidth);

      if (y + lines.length * 5 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setTextColor(100, 100, 200);
      doc.text(timestamp, margin, y);
      doc.setTextColor(40);
      const tsWidth = doc.getTextWidth(timestamp);
      const contentLines = doc.splitTextToSize(text, pageWidth - tsWidth);
      doc.text(contentLines, margin + tsWidth, y);
      y += contentLines.length * 5 + 3;
    });
  } else {
    const lines = doc.splitTextToSize(transcription.text, pageWidth);
    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    });
  }

  doc.save(`${baseName(transcription.filename)}.pdf`);
}

export async function exportToDocx(transcription: Transcription) {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: transcription.filename, bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Date: ${new Date(transcription.created_at).toLocaleString()} | Language: ${transcription.language} | Model: ${transcription.model}`,
          size: 18,
          color: '888888',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  if (transcription.segments.length > 0) {
    transcription.segments.forEach((seg) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${formatTime(seg.start)}] `, color: '6366F1', size: 20 }),
            new TextRun({ text: seg.text, size: 20 }),
          ],
          spacing: { after: 100 },
        })
      );
    });
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: transcription.text, size: 20 })],
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${baseName(transcription.filename)}.docx`);
}
