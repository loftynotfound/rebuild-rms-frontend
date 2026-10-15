import api from "@/js/api";

const getErrorMessage = async (error, fallback = "Gagal memproses file.") => {
  const data = error.response?.data;

  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text());
      if (body.message) return body.message;
    } catch {}
  }

  return error.response?.data?.message ?? error.message ?? fallback;
};

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const fetchBlob = async (url, params) => {
  try {
    return await api.get(url, {
      params,
      responseType: "blob",
    });
  } catch (error) {
    throw new Error(await getErrorMessage(error));
  }
};

const downloadFile = async (url, filename, params) => {
  const blob = await fetchBlob(url, params);
  saveBlob(blob, filename);
};

const openDocument = async (url, filename) => {
  const win = window.open("", "_blank");

  try {
    const blob = await fetchBlob(url);

    if (win && /^(application\/pdf|image\/)/.test(blob.type)) {
      const objectUrl = URL.createObjectURL(blob);

      win.location.href = objectUrl;

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return;
    }

    win?.close();
    saveBlob(blob, filename);
  } catch (error) {
    win?.close();
    throw error;
  }
};

const exportExcel = async ({ startDate, endDate } = {}) => {
  const params = {};

  if (startDate && endDate) {
    params.start_date = startDate;
    params.end_date = endDate;
  }

  try {
    const blob = await fetchBlob("/pr/payments/export", params);
    saveBlob(blob, "payment-request-summary.xlsx");
  } catch (error) {
    throw new Error(await getErrorMessage(error, "Gagal mengekspor Excel."));
  }
};

const exportWord = async (item) => {
  try {
    const blob = await fetchBlob(`/pr/${item.prId}/export`);

    saveBlob(blob, `${item.prRfpNumber || item.rfpNumber || item.prId}-request-for-payment.docx`);
  } catch (error) {
    throw new Error(await getErrorMessage(error, "Gagal mengekspor Word."));
  }
};

export function useExport() {
  return {
    fetchBlob,
    downloadFile,
    openDocument,
    exportExcel,
    exportWord,
  };
}
