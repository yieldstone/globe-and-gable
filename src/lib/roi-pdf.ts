import { convertFromUsd, formatMoney, type Currency } from "./currency";
import type { RoiInput, RoiMarket, RoiResult } from "./roi";

interface PdfInput {
  market: RoiMarket;
  currency: Currency;
  values: RoiInput;
  result: RoiResult;
}

export async function exportRoiPdf({ market, currency, values, result }: PdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const money = (usd: number, compact = false) => formatMoney(convertFromUsd(usd, currency), currency, { compact });
  const percentage = (value: number | null) => value === null ? "N/A" : `${value.toFixed(2)}%`;
  const finalYear = result.rows.at(-1);

  doc.setTextColor(20, 35, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Yieldstone ROI Calculator", 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(85, 96, 115);
  doc.text(`${market} | ${result.mode === "off-plan" ? "Off-Plan (Under Construction)" : "Ready Property"} | ${currency}`, 40, 62);

  doc.setFontSize(9);
  const inputLines = [
    `Purchase price: ${money(values.purchasePriceUsd)}    Monthly rent: ${money(values.monthlyRentUsd)}    Annual service charges: ${money(values.annualServiceChargesUsd)}`,
    `Annual appreciation: ${values.annualAppreciationPct.toFixed(2)}%    ${result.mode === "off-plan" ? `Payment plan: ${values.downPaymentPct}% / ${values.duringConstructionPct}% / ${values.onHandoverPct}%    Handover: Year ${result.handoverYears}` : `Down payment: ${values.downPaymentPct}%    Interest: ${values.interestRatePct}%    Loan term: ${values.loanTermYears} years`}`,
  ];
  doc.text(inputLines, 40, 88);

  doc.setDrawColor(218, 224, 233);
  doc.line(40, 116, 802, 116);
  doc.setFontSize(11);
  doc.setTextColor(20, 35, 61);
  const summaries = [
    ["10-year IRR", percentage(result.irrPct)],
    [result.mode === "off-plan" ? "Post-handover cash-on-cash" : "Annual cash-on-cash", percentage(result.cashOnCashPct)],
    ["Year 10 property value", finalYear ? money(finalYear.propertyValue) : "N/A"],
    ["Annual net rent", money(result.annualNetRentalIncome)],
  ];
  summaries.forEach(([label, value], index) => {
    const x = 40 + index * 195;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(85, 96, 115);
    doc.text(label ?? "", x, 142);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 35, 61);
    doc.text(value ?? "N/A", x, 162);
  });

  doc.setFontSize(12);
  doc.text("10-year projection", 40, 205);
  const headers = ["Year", "Property value", result.mode === "off-plan" ? "Capital payment" : "Debt service", "Net rent", "Net cash flow", "Sale proceeds", "Loan balance"];
  const xs = [40, 78, 196, 322, 425, 530, 643, 750];
  doc.setFillColor(240, 244, 249);
  doc.rect(36, 218, 770, 24, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(85, 96, 115);
  headers.forEach((header, index) => doc.text(header, xs[index] ?? 40, 233));

  result.rows.forEach((row, index) => {
    const y = 257 + index * 24;
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 252);
      doc.rect(36, y - 14, 770, 24, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(35, 45, 62);
    const cells = [
      String(row.year),
      money(row.propertyValue),
      money(row.capitalOrDebtPayment),
      money(row.netRentalIncome),
      money(row.netCashFlow),
      money(row.saleProceeds),
      money(row.mortgageBalance),
    ];
    cells.forEach((cell, cellIndex) => doc.text(cell, xs[cellIndex] ?? 40, y));
  });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 125);
  doc.text("Illustrative estimates only. Rent and service charges start after handover in Off-Plan mode. Year 10 includes estimated sale proceeds for IRR.", 40, 525);
  doc.text("All monetary values are shown in the selected currency. Reference rate: 1 USD = 3.6725 AED.", 40, 540);
  doc.save(`yieldstone-roi-${market.toLowerCase().replaceAll(" ", "-")}-${currency.toLowerCase()}.pdf`);
}
