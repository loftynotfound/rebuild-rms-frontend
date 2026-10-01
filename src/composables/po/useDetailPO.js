import { ref, reactive, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/js/api";
import { formatCurrency, formatDate } from "./usePO";
import { usePOFormOptions } from "./useFormOptionsPO";

// Urutan status linear untuk menentukan tombol "lanjut ke status berikutnya"
const STATUS_FLOW = ["open", "prepared", "progress", "complete"];

const STATUS_LABEL = {
  open: "Open",
  prepared: "Prepared",
  progress: "In Progress",
  complete: "Completed",
  cancel: "Canceled",
};

export function usePODetail(poId) {
  const router = useRouter();
  const authStore = useAuthStore();

  const loading = ref(false);
  const error = ref("");
  const actionLoading = ref(false);

  // GET /api/po/{id} mengembalikan { data: { po: {...}, items: [...] } } — dua
  // object terpisah, bukan flat dengan items nested di dalam po.
  const po = ref(null);
  const items = ref([]);
  const activities = ref([]);
  const documents = ref([]);

  const activeTab = ref("preview");
  const isEditMode = ref(false);

  // ── Permission & visibility rules ─────────────────
  const canEdit = computed(() => authStore.hasAccess("edit_po"));
  const canCreateNotes = computed(() => authStore.hasAccess("create_notes"));
  const canUploadDocument = computed(() =>
    authStore.hasAccess("upload_document"),
  );
  const canChangeStatPaid = computed(() =>
    authStore.hasAccess("change_stat_paid"),
  );
  const canUpdateInvoice = computed(() =>
    authStore.hasAccess("update_invoice"),
  );
  const canDeletePo = computed(() => authStore.hasAccess("delete_po"));

  const showEditTab = computed(
    () => canEdit.value && po.value?.po_status === "open",
  );
  const showDocumentTab = computed(() =>
    ["progress", "complete"].includes(po.value?.po_status),
  );

  const showInvoiceInPreview = computed(() => {
    const idx = STATUS_FLOW.indexOf(po.value?.po_status);
    return !!po.value?.po_invoice && idx > STATUS_FLOW.indexOf("prepared");
  });

  const statusLabel = computed(
    () => STATUS_LABEL[po.value?.po_status] ?? po.value?.po_status,
  );

  const nextStatus = computed(() => {
    const idx = STATUS_FLOW.indexOf(po.value?.po_status);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  });

  const nextStatusLabel = computed(() => {
    if (nextStatus.value === "prepared") return "Set as Prepared";
    if (nextStatus.value === "progress") return "Set as In Progress";
    if (nextStatus.value === "complete") return "Set as Complete";
    return null;
  });

  const showCancelButton = computed(() => po.value?.po_status !== "cancel");
  const showDeleteButton = computed(
    () => po.value?.po_status === "cancel" && canDeletePo.value,
  );

  const isPaid = computed(() => po.value?.po_paid === "yes");

  // ── Fetch ──────────────────────────────────────────
  async function fetchDetail() {
    loading.value = true;
    error.value = "";
    try {
      const res = await api.get(`/po/${poId}`);
      po.value = res.data?.po ?? null;
      items.value = res.data?.items ?? [];
    } catch (err) {
      error.value =
        err.response?.data?.message || "Failed to load Purchase Order detail";
    } finally {
      loading.value = false;
    }
  }

  async function fetchActivities() {
    try {
      const res = await api.get(`/po/${poId}/activities`);
      activities.value = res.data ?? [];
    } catch {
      activities.value = [];
    }
  }

  async function fetchDocuments() {
    try {
      const res = await api.get(`/po/${poId}/documents`);
      documents.value = res.data ?? [];
    } catch {
      documents.value = [];
    }
  }

  // Activities & documents lazy-load: hanya di-fetch saat tab Activity/Document
  // pertama kali dibuka (lihat watch(activeTab) di bawah), bukan saat halaman mount.
  async function fetchAll() {
    await fetchDetail();
  }

  const activitiesLoaded = ref(false);
  const documentsLoaded = ref(false);

  async function ensureActivitiesLoaded() {
    if (activitiesLoaded.value) return;
    activitiesLoaded.value = true;
    await fetchActivities();
  }

  async function ensureDocumentsLoaded() {
    if (documentsLoaded.value) return;
    documentsLoaded.value = true;
    await fetchDocuments();
  }

  watch(activeTab, (tab) => {
    if (tab === "activity") ensureActivitiesLoaded();
    if (tab === "document") ensureDocumentsLoaded();
  });

  // ── Status actions ─────────────────────────────────
  async function changeStatus(status) {
    actionLoading.value = true;
    try {
      await api.post(`/po/${poId}/status`, { status });
      await fetchDetail();
      await fetchActivities();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to update status";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function advanceToNextStatus() {
    if (!nextStatus.value) return false;
    return changeStatus(nextStatus.value);
  }

  async function cancelPO() {
    return changeStatus("cancel");
  }

  async function deletePO() {
    actionLoading.value = true;
    try {
      await api.delete(`/po/${poId}`);
      router.push("/po");
      return true;
    } catch (err) {
      error.value =
        err.response?.data?.message || "Failed to delete Purchase Order";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function togglePaid() {
    const newPaid = isPaid.value ? "no" : "yes";
    actionLoading.value = true;
    try {
      await api.post(`/po/${poId}/paid`, { paid: newPaid });
      await fetchDetail();
      await fetchActivities();
      return true;
    } catch (err) {
      error.value =
        err.response?.data?.message || "Failed to update payment status";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateInvoice(invoiceNumber) {
    actionLoading.value = true;
    try {
      await api.post(`/po/${poId}/invoice`, { invoice: invoiceNumber });
      await fetchDetail();
      await fetchActivities();
      return true;
    } catch (err) {
      error.value =
        err.response?.data?.message || "Failed to update invoice number";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function updateNotes(notes) {
    actionLoading.value = true;
    try {
      await api.post(`/po/${poId}/notes`, { notes });
      await fetchDetail();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to update notes";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function addNotesActivity(note) {
    actionLoading.value = true;
    try {
      await api.post(`/po/${poId}/notes-activity`, { note });
      await fetchActivities();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to add note";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  // ── Document actions ───────────────────────────────
  async function uploadDocument(file, title) {
    actionLoading.value = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      await api.post(`/po/${poId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchDocuments();
      await fetchDetail();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to upload document";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function deleteDocument(docId) {
    actionLoading.value = true;
    try {
      await api.delete(`/po/${poId}/documents/${docId}`);
      await fetchDocuments();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to delete document";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  async function downloadDocument(doc, mode = "download") {
    try {
      const blob = await api.get(
        `/po/${poId}/documents/${doc.document_id}/download`,
        {
          responseType: "blob",
        },
      );
      // 'blob' di sini SUDAH berupa Blob asli (interceptor api.js sudah unwrap
      // response.data untuk kita) — tidak perlu lagi bungkus ulang atau baca
      // res.headers, karena axios otomatis set blob.type dari Content-Type.
      const url = window.URL.createObjectURL(blob);

      if (mode === "preview") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.document_title || "document";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal membuka dokumen";
    }
  }

  // ── Edit mode: header + client + items ────────────
  const {
    regionOptions,
    picOptions,
    divisionOptions,
    picClientOptions,
    unitOptions,
    fetchFormOptions,
    fetchUnitOptions,
    clientKeyword,
    clientOptions,
    clientSearchLoading,
    makeClientSearch,
  } = usePOFormOptions();

  const editForm = reactive({
    order_num: "",
    region_id: "",
    division_id: "",
    pic_id: "",
    pic_client_id: "",
    date: "",
    client_id: 0,
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    sub_client: "",
  });

  const { selectClient, clearSelectedClient, presetClientKeyword } =
    makeClientSearch(editForm);

  // Item baru (belum tersimpan) vs existing dibedakan oleh item_id. Item baru:
  // POST saat Save. Item existing yang diubah: PUT. Item existing yang dihapus:
  // ditandai lewat deletedItemIds lalu DELETE saat Save.
  const editItems = ref([]);
  const deletedItemIds = ref([]);

  function loadEditItems() {
    editItems.value = items.value.map((item) => ({
      _localId: crypto.randomUUID(),
      item_id: item.item_id,
      product: item.item_product,
      desc: item.item_desc,
      qty: item.item_qty,
      price: item.item_price,
      unit_id: item.unit_id,
    }));
    deletedItemIds.value = [];
  }

  function loadEditForm() {
    if (!po.value) return;
    editForm.order_num = po.value.po_order_num ?? "";
    editForm.region_id = po.value.region_id ?? "";
    editForm.pic_id = po.value.pic_id ?? ""; // fix Bug #1
    editForm.pic_client_id = po.value.pic_client_id ?? "";
    editForm.division_id = po.value.division_id ?? ""; // fix Bug #2
    editForm.date = po.value.po_date ? po.value.po_date.slice(0, 10) : "";
    editForm.client_id = po.value.client_id ?? 0;
    editForm.client_name = po.value.client_name ?? "";
    editForm.client_email = po.value.client_email ?? "";
    editForm.client_phone = po.value.client_phone ?? "";
    editForm.client_address = po.value.client_address ?? "";
    editForm.sub_client = po.value.po_subclient ?? "";
    presetClientKeyword(editForm.client_name);
  }

  function enterEditMode() {
    loadEditForm();
    loadEditItems();
    fetchFormOptions();
    isEditMode.value = true;
  }

  function exitEditMode() {
    isEditMode.value = false;
  }

  function addEditItem(item) {
    editItems.value.push({
      ...item,
      _localId: crypto.randomUUID(),
      item_id: null,
    });
  }

  function updateEditItem(localId, item) {
    const index = editItems.value.findIndex((i) => i._localId === localId);
    if (index !== -1)
      editItems.value[index] = { ...editItems.value[index], ...item };
  }

  function removeEditItem(localId) {
    const target = editItems.value.find((i) => i._localId === localId);
    if (target?.item_id) deletedItemIds.value.push(target.item_id);
    editItems.value = editItems.value.filter((i) => i._localId !== localId);
  }

  const editSubtotal = computed(() =>
    editItems.value.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
      0,
    ),
  );

  async function saveEdit() {
    actionLoading.value = true;
    error.value = "";
    try {
      const headerPayload = {
        order_num: editForm.order_num,
        region_id: Number(editForm.region_id),
        pic_id: editForm.pic_id,
        pic_client_id: editForm.pic_client_id,
        division_id: editForm.division_id ? Number(editForm.division_id) : null,
        date: editForm.date,
        client_id: Number(editForm.client_id) || 0,
        sub_client: editForm.sub_client,
      };
      if (!headerPayload.client_id) {
        headerPayload.client_name = editForm.client_name;
        headerPayload.client_email = editForm.client_email;
        headerPayload.client_phone = editForm.client_phone;
        headerPayload.client_address = editForm.client_address;
      }
      await api.put(`/po/${poId}`, headerPayload);

      for (const itemId of deletedItemIds.value) {
        await api.delete(`/po/items/${itemId}`);
      }

      for (const item of editItems.value) {
        const itemPayload = {
          desc: item.desc,
          product: item.product,
          qty: Number(item.qty),
          unit_id: Number(item.unit_id),
          price: Number(item.price),
        };
        if (item.item_id) {
          await api.put(`/po/items/${item.item_id}`, itemPayload);
        } else {
          await api.post(`/po/${poId}/items`, itemPayload);
        }
      }

      await fetchAll();
      exitEditMode();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to save changes";
      return false;
    } finally {
      actionLoading.value = false;
    }
  }

  function unitLabel(unitId) {
    return (
      unitOptions.value.find((u) => u.unit_id === unitId)?.unit_title ?? "-"
    );
  }

  return {
    loading,
    error,
    actionLoading,
    po,
    items,
    activities,
    documents,
    activeTab,
    isEditMode,
    isPaid,
    canEdit,
    canCreateNotes,
    canUploadDocument,
    canChangeStatPaid,
    canUpdateInvoice,
    canDeletePo,
    showEditTab,
    showDocumentTab,
    showInvoiceInPreview,
    statusLabel,
    nextStatus,
    nextStatusLabel,
    showCancelButton,
    showDeleteButton,
    fetchAll,
    fetchDetail,
    fetchActivities,
    fetchDocuments,
    advanceToNextStatus,
    cancelPO,
    deletePO,
    togglePaid,
    updateInvoice,
    updateNotes,
    addNotesActivity,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    editForm,
    editItems,
    editSubtotal,
    regionOptions,
    picOptions,
    picClientOptions,
    divisionOptions,
    unitOptions,
    fetchUnitOptions,
    clientKeyword,
    clientOptions,
    clientSearchLoading,
    selectClient,
    clearSelectedClient,
    enterEditMode,
    exitEditMode,
    addEditItem,
    updateEditItem,
    removeEditItem,
    saveEdit,
    unitLabel,
    formatCurrency,
    formatDate,
  };
}
