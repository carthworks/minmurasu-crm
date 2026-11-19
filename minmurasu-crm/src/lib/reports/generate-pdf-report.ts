import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ClientProjectRow, DashboardKPIs } from '@/lib/queries/dashboard';
import { formatINR, formatNumber, formatPercent } from '@/lib/utils';

export type ReportType =
  | 'Monthly Marketing Report'
  | 'Campaign Performance & ROI Report'
  | 'Lead Conversion Report'
  | 'Revenue & Retainer Report';

export interface GeneratePdfReportInput {
  reportType: ReportType;
  clientId: string;
  clientName: string;
  kpis: DashboardKPIs;
  rows: ClientProjectRow[];
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/brand/min-murasu-logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateClientPdfReport(input: GeneratePdfReportInput): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateStamp = now.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const shortClientRef =
    input.clientId === 'all'
      ? 'MM-ALL-CLIENTS'
      : `MM-${input.clientId.slice(0, 8).toUpperCase()}`;

  // 1. Top Deep Navy Brand Header Banner
  doc.setFillColor(13, 32, 64); // #0D2040
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Electric Orange accent bar
  doc.setFillColor(245, 130, 32); // #F58220
  doc.rect(0, 34, pageWidth, 1.5, 'F');

  // Logo image in header
  const logoDataUrl = await loadLogoDataUrl();
  if (logoDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 7, 18, 18, 2.5, 2.5, 'F');
    doc.addImage(logoDataUrl, 'PNG', 15.5, 8.5, 15, 15);
  }

  const textStartX = logoDataUrl ? 36 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MIN MURASU', textStartX, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(245, 130, 32);
  doc.text('THE DIGITAL DRUM  ·  WWW.MINMURASU.DIGITAL', textStartX, 19.5);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.text('Turn Digital Attention Into Business Growth', textStartX, 25);

  // Right-aligned Report Title & Metadata in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(input.reportType, pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Client: ${input.clientName}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Client ID: ${shortClientRef}`, pageWidth - 14, 24.5, { align: 'right' });
  doc.text(`Generated: ${dateStamp}`, pageWidth - 14, 29, { align: 'right' });

  // 2. Executive Summary KPI Strip
  let cursorY = 44;
  doc.setTextColor(13, 32, 64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Executive Performance Summary (Measured Records)', 14, cursorY);

  cursorY += 4;
  const kpiCards = [
    { label: 'Campaign Spend', value: formatINR(input.kpis.campaignSpendInr) },
    { label: 'Revenue Attributed', value: formatINR(input.kpis.revenueAttributedInr) },
    { label: 'Average Campaign ROI', value: formatPercent(input.kpis.avgRoiPct, 1) },
    { label: 'Total Leads (Qualified)', value: `${formatNumber(input.kpis.totalLeads)} (${formatNumber(input.kpis.qualifiedLeads)})` },
  ];

  const cardWidth = (pageWidth - 28 - 9) / 4;
  kpiCards.forEach((card, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cursorY, cardWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(card.label, x + 3, cursorY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(13, 32, 64);
    doc.text(card.value, x + 3, cursorY + 13.5);
  });

  cursorY += 26;

  // 3. Campaign & Client Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 32, 64);
  doc.text('Campaign & Channel Attribution Breakdown', 14, cursorY);

  autoTable(doc, {
    startY: cursorY + 3,
    head: [['Client', 'Campaign', 'Channel', 'Status', 'Leads', 'Spend (INR)', 'Revenue (INR)', 'ROI']],
    body:
      input.rows.length > 0
        ? input.rows.map((r) => [
            r.clientName,
            r.campaignName,
            r.channelName,
            r.status.toUpperCase(),
            formatNumber(r.leads),
            formatINR(r.spendInr),
            formatINR(r.revenueInr),
            `${r.roiPct}%`,
          ])
        : [['—', 'No measured campaign records for this selection.', '—', '—', '0', '₹0', '₹0', '0%']],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [13, 32, 64],
    },
    headStyles: {
      fillColor: [13, 32, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 22 },
  });

  // 4. Standardized Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `MIN MURASU · Confidential Client Report · Client ID: ${shortClientRef}`,
      14,
      pageHeight - 9
    );
    doc.text(
      `Generated ${dateStamp}  |  Page ${i} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 9,
      { align: 'right' }
    );
  }

  const safeFileSlug = input.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fileDate = now.toISOString().slice(0, 10);
  doc.save(`minmurasu-${safeFileSlug}-${fileDate}.pdf`);
}

export async function generateInvoicePdf(invoice: {
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amountInr: number;
  dueDate: string;
  status: string;
  notes?: string | null;
}): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateStamp = now.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const shortClientRef = `MM-${invoice.clientId.slice(0, 8).toUpperCase()}`;

  doc.setFillColor(13, 32, 64);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setFillColor(245, 130, 32);
  doc.rect(0, 34, pageWidth, 1.5, 'F');

  const logoDataUrl = await loadLogoDataUrl();
  if (logoDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 7, 18, 18, 2.5, 2.5, 'F');
    doc.addImage(logoDataUrl, 'PNG', 15.5, 8.5, 15, 15);
  }

  const textStartX = logoDataUrl ? 36 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MIN MURASU', textStartX, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(245, 130, 32);
  doc.text('THE DIGITAL DRUM  ·  WWW.MINMURASU.DIGITAL', textStartX, 19.5);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`INVOICE ${invoice.invoiceNumber}`, pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Client ID: ${shortClientRef}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Issue Date: ${dateStamp}  |  Due: ${invoice.dueDate}`, pageWidth - 14, 25, {
    align: 'right',
  });

  autoTable(doc, {
    startY: 48,
    head: [['Billed To', 'Service / Description', 'Status', 'Amount (INR)']],
    body: [
      [
        `${invoice.clientName}\n(${shortClientRef})`,
        invoice.notes || 'Digital Growth & Marketing Retainer Services',
        invoice.status.toUpperCase(),
        formatINR(invoice.amountInr),
      ],
    ],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: [13, 32, 64] },
    headStyles: { fillColor: [13, 32, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `MIN MURASU · Coimbatore, Tamil Nadu · Client ID: ${shortClientRef}`,
    14,
    pageHeight - 9
  );
  doc.text(`Generated ${dateStamp}  |  Page 1 of 1`, pageWidth - 14, pageHeight - 9, {
    align: 'right',
  });

  doc.save(`${invoice.invoiceNumber.toLowerCase()}.pdf`);
}
