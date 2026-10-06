import api from "@/js/api";

// Untuk responseType blob, body error juga berupa Blob
async function errorMessage(e, fallback = "Failed to load the file.") {
  const data = e.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message ?? fallback;
    } catch {
      /* bukan JSON */
    }
  }
  return fallback;
}

// interceptor api.js sudah mengembalikan response.data, jadi hasilnya langsung Blob
export async function fetchBlob(url, params) {
  try {
    return await api.get(url, { params, responseType: "blob" });
  } catch (e) {
    throw new Error(await errorMessage(e));
  }
}

function saveBlob(blob, filename) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export async function downloadFile(url, filename, params) {
  saveBlob(await fetchBlob(url, params), filename);
}

// PDF/gambar dibuka di tab baru, selain itu diunduh
export async function openDocument(url, filename) {
  // tab dibuka sinkron dulu supaya tidak diblokir popup blocker
  const win = window.open("", "_blank");
  try {
    const blob = await fetchBlob(url);
    if (win && /^(application\/pdf|image\/)/.test(blob.type)) {
      const href = URL.createObjectURL(blob);
      win.location.href = href;
      setTimeout(() => URL.revokeObjectURL(href), 60_000);
      return;
    }
    win?.close();
    saveBlob(blob, filename);
  } catch (e) {
    win?.close();
    throw e;
  }
}