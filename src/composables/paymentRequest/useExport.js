import api from "@/js/api";

// Menyimpan Blob (isi file dari backend) menjadi file unduhan di browser.
const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Saat backend membalas error (400/403/404), isinya JSON tetapi diterima
// sebagai Blob. Fungsi ini membukanya agar pesan dari backend bisa dibaca.
const getErrorMessage = async (err) => {
  const data = err.response?.data;

  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text());
      if (body.message) return body.message;
    } catch {}
  }

  return err.message ?? "Gagal mengunduh file";
};

// GET /api/pr/payments/export -> file .xlsx
// start_date dan end_date wajib dikirim berpasangan, kalau tidak backend membalas 400.
const exportExcel = async ({ startDate, endDate } = {}) => {
  const params = {};

  if (startDate && endDate) {
    params.start_date = startDate;
    params.end_date = endDate;
  }

  try {
    const blob = await api.get("/pr/payments/export", {
      params,
      responseType: "blob",
    });

    downloadFile(blob, "payment-request-summary.xlsx");
  } catch (err) {
    throw new Error(await getErrorMessage(err));
  }
};

// GET /api/pr/{id}/export -> file .docx
const exportWord = async (item) => {
  try {
    const blob = await api.get(`/pr/${item.prId}/export`, {
      responseType: "blob",
    });

    downloadFile(
      blob,
      `${item.prRfpNumber || item.prId}-request-for-payment.docx`,
    );
  } catch (err) {
    throw new Error(await getErrorMessage(err));
  }
};

export function useExport() {
  return { exportExcel, exportWord };
}
