import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function generateBankStatementPDF({
  userName = 'Valued Account Holder',
  userEmail = '',
  userPhone = '',
  userAddress = 'Dhaka, Bangladesh',
  accountName = 'Consolidated Treasury Vault',
  accountNumber = 'ALL-VAULTS',
  accountType = 'Institutional',
  currency = 'BDT (Tk)',
  startDate = '',
  endDate = '',
  openingBalance = 0,
  closingBalance = 0,
  totalInflow = 0,
  totalOutflow = 0,
  transactions = []
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const brandRose = [225, 29, 72];
  const darkNavy = [15, 23, 42];
  const slateText = [100, 116, 139];
  const emeraldColor = [16, 185, 129];

  // 1. TOP ORNAMENTAL ACCENT BARS
  doc.setFillColor(...brandRose);
  doc.rect(0, 0, pageWidth, 7, 'F');
  doc.setFillColor(...darkNavy);
  doc.rect(0, 7, pageWidth, 2, 'F');

  // 2. HEADER LEFT: INSTITUTION BRANDING
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...darkNavy);
  doc.text('FinFlow', 40, 48);

  doc.setFontSize(10);
  doc.setTextColor(...brandRose);
  doc.text('TREASURY & LIQUIDITY MANAGEMENT ERP', 125, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateText);
  doc.text('Official Financial Transaction Statement • Regulatory Archive', 40, 62);
  doc.text(`Statement Issue Timestamp: ${new Date().toLocaleString('en-US', { hour12: true })}`, 40, 74);

  // 3. HEADER RIGHT: STATEMENT PERIOD BADGE
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth - 210, 32, 170, 48, 5, 5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...brandRose);
  doc.text('AUDIT PERIOD', pageWidth - 200, 47);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkNavy);
  doc.text(`${startDate || 'Opening Record'} to ${endDate || 'Current'}`, pageWidth - 200, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateText);
  doc.text(`Base Unit: ${currency}`, pageWidth - 200, 72);

  // Divider
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(1);
  doc.line(40, 90, pageWidth - 40, 90);

  // 4. TWO-COLUMN METADATA BOX: USER DETAILS vs VAULT DETAILS
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(243, 215, 217);
  doc.roundedRect(40, 100, pageWidth - 80, 80, 6, 6, 'FD');

  // Column A: Account Holder Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...brandRose);
  doc.text('ACCOUNT HOLDER DETAILS', 55, 117);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkNavy);
  doc.text(userName || 'Authorized Treasury User', 55, 133);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text(`Email: ${userEmail || 'registered-account@finflow.io'}`, 55, 147);
  doc.text(`Phone: ${userPhone || 'Not recorded'}`, 55, 159);
  doc.text(`Address: ${userAddress || 'Dhaka, Bangladesh'}`, 55, 171);

  // Column B: Vault Account Information
  const colBX = pageWidth / 2 + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...brandRose);
  doc.text('TREASURY VAULT SPECIFICATIONS', colBX, 117);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text(accountName, colBX, 133);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text(`Account No / Identifier: ${accountNumber}`, colBX, 147);
  doc.text(`Account Category: ${accountType.toUpperCase()} RESERVE`, colBX, 159);
  doc.text(`Record Status: VERIFIED & ACTIVE`, colBX, 171);

  // 5. FOUR SUMMARY KPI CARDS
  const cardY = 192;
  const cardWidth = (pageWidth - 80 - 24) / 4;
  const cardHeight = 46;

  const kpis = [
    { label: 'OPENING BALANCE', value: `Tk ${Number(openingBalance).toLocaleString()}`, color: darkNavy },
    { label: 'TOTAL INFLOWS (+)', value: `Tk ${Number(totalInflow).toLocaleString()}`, color: emeraldColor },
    { label: 'TOTAL OUTFLOWS (-)', value: `Tk ${Number(totalOutflow).toLocaleString()}`, color: brandRose },
    { label: 'CLOSING BALANCE', value: `Tk ${Number(closingBalance).toLocaleString()}`, color: darkNavy }
  ];

  kpis.forEach((kpi, i) => {
    const xPos = 40 + i * (cardWidth + 8);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(xPos, cardY, cardWidth, cardHeight, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...slateText);
    doc.text(kpi.label, xPos + 8, cardY + 16);

    doc.setFontSize(10.5);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, xPos + 8, cardY + 34);
  });

  // 6. BUILD TRANSACTION LEDGER WITH RUNNING BALANCE
  let running = Number(openingBalance) || 0;
  const tableRows = transactions.map((tx, idx) => {
    const isInflow = ['income', 'transfer_in'].includes(tx.type);
    const amt = Number(tx.amount || 0);
    if (isInflow) {
      running += amt;
    } else {
      running -= amt;
    }

    const inText = isInflow ? `+Tk ${amt.toLocaleString()}` : '-';
    const outText = !isInflow ? `-Tk ${amt.toLocaleString()}` : '-';
    const balText = `Tk ${running.toLocaleString()}`;

    return [
      idx + 1,
      tx.transaction_date || '-',
      tx.notes || tx.description || 'General Ledger Entry',
      (tx.category || 'General').toUpperCase(),
      inText,
      outText,
      balText
    ];
  });

  doc.autoTable({
    startY: 250,
    margin: { left: 40, right: 40, bottom: 90 },
    head: [['#', 'DATE', 'DESCRIPTION / BENEFICIARY', 'CATEGORY', 'DEPOSIT (+)', 'WITHDRAWAL (-)', 'BALANCE']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 7,
      halign: 'left'
    },
    styles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 6,
      lineColor: [241, 245, 249],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', textColor: slateText },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 75, textColor: slateText },
      4: { cellWidth: 70, halign: 'right', fontStyle: 'bold', textColor: emeraldColor },
      5: { cellWidth: 70, halign: 'right', fontStyle: 'bold', textColor: brandRose },
      6: { cellWidth: 75, halign: 'right', fontStyle: 'bold', textColor: darkNavy }
    }
  });

  // 7. OFFICIAL SIGNATURE & STAMP BOX
  const finalY = doc.lastAutoTable.finalY + 35;
  if (finalY + 50 < pageHeight - 30) {
    doc.setDrawColor(203, 213, 225);
    doc.line(50, finalY + 25, 170, finalY + 25);
    doc.line(pageWidth - 170, finalY + 25, pageWidth - 50, finalY + 25);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateText);
    doc.text('Prepared by Account Holder', 110, finalY + 38, { align: 'center' });
    doc.text('Official Treasury Seal / Verification', pageWidth - 110, finalY + 38, { align: 'center' });
  }

  // 8. FOOTER WITH PAGE NUMBERS
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FinFlow Treasury Management System • Authorized Financial Ledger • Page ${p} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 16,
      { align: 'center' }
    );
  }

  const cleanFileName = `FinFlow_Statement_${(userName || 'Account').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(cleanFileName);
}

export function generateStatementExcel({
  userName = '',
  accountName = 'Treasury Ledger',
  transactions = []
}) {
  const formattedRows = transactions.map((t, idx) => ({
    'SL': idx + 1,
    'Posting Date': t.transaction_date || t.date || '',
    'Beneficiary / Payee': t.notes || t.description || '',
    'Classification': t.category || 'General',
    'Flow': (t.type || '').toUpperCase(),
    'Amount (BDT)': Number(t.amount || 0)
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Treasury_Statement');

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 }
  ];

  XLSX.writeFile(workbook, `FinFlow_${accountName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
}