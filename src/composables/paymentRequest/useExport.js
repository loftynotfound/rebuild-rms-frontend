import {
  money,
  date,
  responsibleOptions,
  APPROVAL_STATUS,
} from "@/composables/paymentRequest/useStore";

const downloadFile = (content, type, filename) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const getCoa = (responsibleName) =>
  responsibleOptions.value.find(
    (option) => option.responsible === responsibleName,
  )?.coa ?? "-";

const getMargin = (item) => {
  const poAmount = Number(item.prPoAmount || 0);
  const cogs = Number(item.prCogs || 0);
  const margin = poAmount - cogs;
  const percent = poAmount ? ((margin / poAmount) * 100).toFixed(2) : "0.00";

  return { poAmount, cogs, margin, percent };
};

const joinPayments = (item, key) =>
  (item.payments ?? [])
    .map((payment) => payment[key])
    .filter(Boolean)
    .join("; ");

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const csvHeader = [
  "RFP Number",
  "Description",
  "Responsible",
  "COA",
  "Vendor",
  "Total Amount",
  "Account Name",
  "Account Number",
  "Purchase Order Amount",
  "COGS Amount",
  "Margin (Rp)",
  "Margin (%)",
  "Target Invoice Date",
  "Purchase Order Number",
  "Status",
];

const toCsvRow = (item) => {
  const { poAmount, cogs, margin, percent } = getMargin(item);

  return [
    item.prRfpNumber,
    item.prDescriptionItem,
    item.responsibleName,
    getCoa(item.responsibleName),
    item.prVendor,
    money(item.prRequestedAmount),
    joinPayments(item, "paymentBankAccountName"),
    joinPayments(item, "paymentBankAccountNumber"),
    money(poAmount),
    money(cogs),
    money(margin),
    `${percent}%`,
    date(item.prTargetInvoiceDate),
    item.prPoNumber,
    item.prStatus,
  ];
};

const exportExcel = (rows = []) => {
  const csv = [csvHeader, ...rows.map(toCsvRow)]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  downloadFile(csv, "text/csv;charset=utf-8;", "payment-request-summary.csv");
};

const escapeHtml = (value) =>
  String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const exportMoney = (value) => escapeHtml(money(value));

const wordStyles = `
  @page {
    size: A4;
    margin: 14mm;
  }

  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9pt;
    color: #1f2937;
  }

  /* Judul */
  .title {
    margin: 0 0 14px;
    text-align: center;
  }

  .title h1,
  .title h2 {
    margin: 0;
    font-size: 15pt;
    font-weight: 700;
    line-height: 1.25;
  }

  .title h2 {
    margin-top: 2px;
  }

  /* Dua tabel info berdampingan */
  .grid {
    width: 100%;
    margin-bottom: 12px;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .grid > tbody > tr > td {
    width: 50%;
    padding: 0 6px;
    vertical-align: top;
  }

  .grid > tbody > tr > td:first-child {
    padding-left: 0;
  }

  .grid > tbody > tr > td:last-child {
    padding-right: 0;
  }

  /* Tabel umum */
  table.form,
  table.payment,
  table.metrics,
  table.signature {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .form th,
  .form td,
  .payment th,
  .payment td,
  .metrics th,
  .metrics td,
  .signature th,
  .signature td {
    border: 1px solid #bfc4cc;
  }

  /* Tabel info (label kiri, isi kanan) */
  .form th,
  .metrics th {
    width: 31%;
    padding: 7px 8px;
    background: #f1f3f6;
    font-weight: 500;
    text-align: left;
  }

  .form td,
  .metrics td {
    padding: 7px 8px;
    font-weight: 400;
  }

  /* Tabel deskripsi dan nominal */
  .payment {
    margin-top: 12px;
  }

  .payment thead th,
  .signature thead th {
    padding: 8px;
    background: #2161ef;
    color: #ffffff;
    font-weight: 700;
    text-align: center;
  }

  td.description {
    padding: 0;
    vertical-align: top;
  }

  .description-text {
    min-height: 40px;
    padding: 9px;
    line-height: 1.4;
  }

  td.amount {
    padding: 11px 8px;
    font-weight: 700;
    text-align: center;
    vertical-align: top;
  }

  th.total {
    padding: 9px;
    background: #ffffff;
    color: #1f2937;
    text-align: right;
  }

  th.total.amount-total {
    text-align: center;
  }

  /* Tanda tangan */
  .signature {
    margin-top: 12px;
  }

  .signature td {
    height: 105px;
    padding: 0 6px 8px;
    text-align: center;
    vertical-align: bottom;
  }
`;

const infoRows = (rows) =>
  rows
    .map(
      ([label, value]) => `
        <tr>
          <th>${label}</th>
          <td>${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

const getSigners = (item) => {
  const approvers = [...(item.approvals ?? [])]
    .sort((a, b) => a.approvalLevel - b.approvalLevel)
    .map((approval) => ({
      label: `Approved By (Level ${approval.approvalLevel}) :`,
      name:
        approval.approvalStatus === APPROVAL_STATUS.APPROVED
          ? approval.adminName
          : "-",
    }));

  return [{ label: "Prepared By :", name: item.adminName }, ...approvers];
};

const signatureTable = (item) => {
  const signers = getSigners(item);

  const headCells = signers
    .map((signer) => `<th>${escapeHtml(signer.label)}</th>`)
    .join("");

  const bodyCells = signers
    .map((signer) => `<td><b>${escapeHtml(signer.name)}</b></td>`)
    .join("");

  return `
    <table class="signature">
      <thead>
        <tr>${headCells}</tr>
      </thead>
      <tbody>
        <tr>${bodyCells}</tr>
      </tbody>
    </table>`;
};

const buildWordHtml = (item) => {
  const { margin, percent } = getMargin(item);
  const payment = item.payments?.[0] ?? {};

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Request for Payment - ${escapeHtml(item.prRfpNumber)}</title>
  <style>${wordStyles}</style>
</head>
<body>

  <div class="title">
    <h1>REQUEST FOR PAYMENT</h1>
    <h2>PT REZEKI UTAMI SEJAHTERA</h2>
  </div>

  <table class="grid">
    <tr>
      <td>
        <table class="form">
          ${infoRows([
            ["Request For Payment Number", item.prRfpNumber],
            ["Date", date(item.prCreateDate)],
            ["Quotation Number", item.prQoutNumber],
            ["Purchase Order Number", item.prPoNumber],
          ])}
        </table>
      </td>
      <td>
        <table class="form">
          ${infoRows([
            ["Method", payment.paymentType],
            ["Bank Name", payment.paymentBank],
            ["Bank Account Number", payment.paymentBankAccountNumber],
            ["Bank Account Name", payment.paymentBankAccountName],
          ])}
        </table>
      </td>
    </tr>
  </table>

  <table class="payment">
    <thead>
      <tr>
        <th style="width: 50%">DESCRIPTION</th>
        <th>AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="description">
          <div class="description-text">${escapeHtml(item.prDescriptionItem)}</div>
          <table class="metrics">
            ${infoRows([
              [
                "Responsible &amp; COA",
                `${item.responsibleName} ${getCoa(item.responsibleName)}`,
              ],
              ["Purchase Order Amount", money(item.prPoAmount)],
              ["COGS Amount", money(item.prCogs)],
              ["Margin", `${money(margin)} (${percent}%)`],
              ["Target Invoice Date", date(item.prTargetInvoiceDate)],
            ])}
          </table>
        </td>
        <td class="amount">${exportMoney(item.prRequestedAmount)}</td>
      </tr>
      <tr>
        <th class="total">TOTAL AMOUNT</th>
        <th class="total amount-total">${exportMoney(item.prRequestedAmount)}</th>
      </tr>
    </tbody>
  </table>

  ${signatureTable(item)}

</body>
</html>`;
};

const exportWord = (item) => {
  downloadFile(
    buildWordHtml(item),
    "application/msword",
    `${item.prRfpNumber || item.prId}-request-for-payment.doc`,
  );
};

export function useExport() {
  return { exportExcel, exportWord };
}
