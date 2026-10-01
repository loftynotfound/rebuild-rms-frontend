import { reactive, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import api from "@/js/api";
import { formatCurrency } from "./usePO";

export function useCreatePO() {
  const router = useRouter();

  const submitting = ref(false);
  const error = ref("");

  const form = reactive({
    order_num: "",
    date: "",
    region_id: "",
    pic_id: "",
    pic_client_id: "",
    division_id: "",
    client_id: 0,
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    sub_client: "",
  });

  const items = ref([]);

  // Dropdown options
  const regionOptions = ref([]);
  const picOptions = ref([]);
  const picClientOptions = ref([]);
  const divisionOptions = ref([]);
  const unitOptions = ref([]);
  const currentPpn = ref(null);

  // ── Client search & select ────────────────────────
  const clientKeyword = ref("");
  const clientOptions = ref([]);
  const clientSearchLoading = ref(false);
  let clientSearchTimeout = null;
  let suppressNextSearch = false;

  watch(clientKeyword, (keyword) => {
    clearTimeout(clientSearchTimeout);

    // Perubahan keyword ini berasal dari selectClient (bukan ketikan user),
    // jadi jangan cari ulang / munculkan dropdown lagi.
    if (suppressNextSearch) {
      suppressNextSearch = false;
      return;
    }

    // User mengetik ulang setelah sebelumnya sudah memilih client → anggap mau
    // ganti/isi manual, lepaskan client_id yang lama.
    if (form.client_id) {
      form.client_id = 0;
    }

    if (!keyword) {
      clientOptions.value = [];
      return;
    }
    clientSearchTimeout = setTimeout(async () => {
      clientSearchLoading.value = true;
      try {
        const res = await api.get("/clients/select", { params: { keyword } });
        clientOptions.value = res.data ?? [];
      } catch {
        clientOptions.value = [];
      } finally {
        clientSearchLoading.value = false;
      }
    }, 400);
  });

  function selectClient(client) {
    suppressNextSearch = true;
    form.client_id = client.client_id;
    form.client_name = client.client_name;
    form.client_email = client.client_email;
    form.client_phone = client.client_phone;
    form.client_address = client.client_address;
    clientKeyword.value = client.client_name;
    // Tutup dropdown segera; tidak menunggu watcher (watcher di-skip via suppressNextSearch)
    clientOptions.value = [];
  }

  function clearSelectedClient() {
    suppressNextSearch = true;
    form.client_id = 0;
    form.client_name = "";
    form.client_email = "";
    form.client_phone = "";
    form.client_address = "";
    clientKeyword.value = "";
    clientOptions.value = [];
  }

  // Dropdown yang tampil langsung di form utama. Unit sengaja dipisah — hanya
  // dipakai di modal Add/Edit Item, jadi di-lazy-load lewat fetchUnitOptions()
  // saat modal itu pertama kali dibuka (lihat openAddItem/openEditItem).
  async function fetchFormOptions() {
    try {
      const [regionRes, picRes, picClientRes, divisionRes, ppnRes] =
        await Promise.all([
          api.get("/regions/select"),
          api.get("/admins/pic"),
          api.get("/admins/pic-client"),
          api.get("/divisions/select"),
          api.get("/ppn/current"),
        ]);
      regionOptions.value = regionRes.data ?? [];
      picOptions.value = picRes.data ?? [];
      picClientOptions.value = picClientRes.data ?? [];
      divisionOptions.value = divisionRes.data ?? [];
      currentPpn.value = ppnRes.data ?? null;
    } catch (err) {
      error.value = "Gagal memuat data pendukung form";
    }
  }

  // Lazy-load: dipanggil saat modal Add/Edit Item dibuka pertama kali.
  async function fetchUnitOptions() {
    if (unitOptions.value.length > 0) return;
    try {
      const res = await api.get("/units/select");
      unitOptions.value = res.data ?? [];
    } catch (err) {
      error.value = "Gagal memuat data unit";
    }
  }

  // ── Item management ──────────────────────────────
  function addItem(item) {
    items.value.push({ ...item, _localId: crypto.randomUUID() });
  }

  function updateItem(localId, item) {
    const index = items.value.findIndex((i) => i._localId === localId);
    if (index !== -1) items.value[index] = { ...item, _localId: localId };
  }

  function removeItem(localId) {
    items.value = items.value.filter((i) => i._localId !== localId);
  }

  // ── Kalkulasi total ───────────────────────────────
  const subtotal = computed(() =>
    items.value.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
      0,
    ),
  );

  // Field response GET /api/ppn/current mengikuti konvensi prefix modul (ppn_id, ppn_value),
  // sama seperti region_id/region_title, division_id/division_title, dst.
  const ppnRate = computed(() =>
    Number(currentPpn.value?.ppn_value ?? currentPpn.value?.value ?? 0),
  );

  const ppnAmount = computed(() =>
    Math.round(subtotal.value * (ppnRate.value / 100)),
  );

  const total = computed(() => subtotal.value + ppnAmount.value);

  // ── Submit ────────────────────────────────────────
  async function submitForm() {
    error.value = "";

    if (items.value.length === 0) {
      error.value = "Minimal 1 item Purchase Order wajib diisi";
      return false;
    }

    submitting.value = true;
    try {
      const payload = {
        order_num: form.order_num,
        region_id: Number(form.region_id),
        pic_id: form.pic_id,
        pic_client_id: form.pic_client_id,
        division_id: Number(form.division_id),
        ppn_id: currentPpn.value?.ppn_id ?? currentPpn.value?.id,
        date: form.date,
        client_id: Number(form.client_id) || 0,
        sub_client: form.sub_client,
        items: items.value.map((item) => ({
          desc: item.desc,
          product: item.product,
          qty: Number(item.qty),
          unit_id: Number(item.unit_id),
          price: Number(item.price),
        })),
      };

      // client_* hanya dibutuhkan saat client baru (client_id = 0); jika client
      // sudah dipilih dari daftar existing, backend mengambil datanya otomatis.
      // Nama client baru diambil dari clientKeyword karena itu yang diketik user manual.
      if (!payload.client_id) {
        payload.client_name = clientKeyword.value;
        payload.client_email = form.client_email;
        payload.client_phone = form.client_phone;
        payload.client_address = form.client_address;
      }

      const res = await api.post("/po", payload);
      // TODO: arahkan ke halaman detail PO (mis. /po/{id}) setelah route detail dibuat
      router.push("/po");
      return true;
    } catch (err) {
      error.value =
        err.response?.data?.message || "Gagal membuat Purchase Order";
      return false;
    } finally {
      submitting.value = false;
    }
  }

  function cancelForm() {
    router.push("/po");
  }

  return {
    form,
    items,
    submitting,
    error,
    regionOptions,
    picOptions,
    picClientOptions,
    divisionOptions,
    unitOptions,
    currentPpn,
    clientKeyword,
    clientOptions,
    clientSearchLoading,
    selectClient,
    clearSelectedClient,
    subtotal,
    ppnRate,
    ppnAmount,
    total,
    fetchFormOptions,
    fetchUnitOptions,
    addItem,
    updateItem,
    removeItem,
    submitForm,
    cancelForm,
    formatCurrency,
  };
}
