import { ref, computed } from "vue";

// Semua state & handler modal untuk halaman detail PO dikumpulkan di sini,
// supaya file .vue hanya berisi destructuring + template.
export function usePODetailModals(detail) {
  const {
    po,
    editItems,
    nextStatusLabel,
    advanceToNextStatus,
    cancelPO,
    deletePO,
    togglePaid,
    updateInvoice,
    updateNotes,
    addNotesActivity,
    uploadDocument,
    deleteDocument,
    addEditItem,
    updateEditItem,
    removeEditItem,
    isPaid,
    unitOptions,
    fetchUnitOptions,
  } = detail;

  const PRODUCT_OPTIONS = [
    "Maintenance",
    "PKWT",
    "Project",
    "Disnaker",
    "Alih Daya",
  ];

  // ── Notes (header PO) ────────────────────────────
  const showNotesModal = ref(false);
  const notesDraft = ref("");

  function openNotesModal() {
    notesDraft.value = po.value?.po_notes ?? "";
    showNotesModal.value = true;
  }

  async function saveNotes() {
    if (await updateNotes(notesDraft.value)) showNotesModal.value = false;
  }

  // ── Leave activity note ──────────────────────────
  const showLeaveNoteModal = ref(false);
  const leaveNoteDraft = ref("");

  async function submitLeaveNote() {
    if (await addNotesActivity(leaveNoteDraft.value)) {
      leaveNoteDraft.value = "";
      showLeaveNoteModal.value = false;
    }
  }

  // ── Invoice ───────────────────────────────────────
  const showInvoiceModal = ref(false);
  const invoiceDraft = ref("");

  function openInvoiceModal() {
    invoiceDraft.value = po.value?.po_invoice ?? "";
    showInvoiceModal.value = true;
  }

  async function saveInvoice() {
    if (await updateInvoice(invoiceDraft.value)) showInvoiceModal.value = false;
  }

  // ── Confirm (status change / cancel / delete / paid / delete doc) ──
  // variant: 'default' (teal) untuk aksi biasa, 'danger' (merah) untuk aksi
  // destruktif/tidak bisa dibatalkan (cancel PO, delete PO, delete document).
  const confirmModal = ref({
    show: false,
    title: "",
    message: "",
    action: null,
    variant: "default",
  });

  function askConfirm(title, message, action, variant = "default") {
    confirmModal.value = { show: true, title, message, action, variant };
  }

  async function runConfirmedAction() {
    const action = confirmModal.value.action;
    confirmModal.value.show = false;
    if (action) await action();
  }

  function confirmAdvanceStatus() {
    askConfirm(
      `Change status to "${nextStatusLabel.value?.replace("Set as ", "")}"?`,
      "This will move the Purchase Order to the next stage.",
      advanceToNextStatus,
    );
  }

  function confirmCancel() {
    askConfirm(
      "Cancel this Purchase Order?",
      "This action can be reversed only by an admin with delete access.",
      cancelPO,
      "danger",
    );
  }

  function confirmDelete() {
    askConfirm(
      "Delete this Purchase Order?",
      "This action is permanent and cannot be undone.",
      deletePO,
      "danger",
    );
  }

  function confirmTogglePaid() {
    const label = isPaid.value ? "Set as Not Paid" : "Set as Paid";
    askConfirm(
      `${label}?`,
      "This will update the payment status of this Purchase Order.",
      togglePaid,
    );
  }

  function confirmDeleteDocument(doc) {
    askConfirm(
      `Delete "${doc.document_title ?? doc.document_name}"?`,
      "This document will be permanently removed.",
      () => deleteDocument(doc.document_id),
      "danger",
    );
  }

  // ── Add/Edit item (edit mode) ────────────────────
  const showItemModal = ref(false);
  const editingItemLocalId = ref(null);
  const itemDraft = ref({
    product: "",
    desc: "",
    qty: 1,
    unit_id: "",
    price: 0,
  });

  function openAddItem() {
    editingItemLocalId.value = null;
    itemDraft.value = { product: "", desc: "", qty: 1, unit_id: "", price: 0 };
    showItemModal.value = true;
    fetchUnitOptions();
  }

  function openEditItem(item) {
    editingItemLocalId.value = item._localId;
    itemDraft.value = { ...item };
    showItemModal.value = true;
    fetchUnitOptions();
  }

  function saveItemDraft() {
    if (editingItemLocalId.value) {
      updateEditItem(editingItemLocalId.value, itemDraft.value);
    } else {
      addEditItem(itemDraft.value);
    }
    showItemModal.value = false;
  }

  // ── Upload document ───────────────────────────────
  const showUploadModal = ref(false);
  const uploadTitle = ref("");
  const uploadFile = ref(null);

  function onFileChange(event) {
    uploadFile.value = event.target.files[0] ?? null;
  }

  // ── Document helpers ──────────────────────────────
  function getFileExt(doc) {
    const file = doc.document_file ?? "";
    return file.split(".").pop()?.toLowerCase() ?? "-";
  }

  async function submitUpload() {
    if (!uploadFile.value) return;
    if (await uploadDocument(uploadFile.value, uploadTitle.value)) {
      uploadTitle.value = "";
      uploadFile.value = null;
      showUploadModal.value = false;
    }
  }

  return {
    PRODUCT_OPTIONS,
    showNotesModal,
    notesDraft,
    openNotesModal,
    saveNotes,
    showLeaveNoteModal,
    leaveNoteDraft,
    submitLeaveNote,
    showInvoiceModal,
    invoiceDraft,
    openInvoiceModal,
    saveInvoice,
    confirmModal,
    confirmAdvanceStatus,
    confirmCancel,
    confirmDelete,
    confirmTogglePaid,
    confirmDeleteDocument,
    runConfirmedAction,
    showItemModal,
    editingItemLocalId,
    itemDraft,
    openAddItem,
    openEditItem,
    saveItemDraft,
    showUploadModal,
    uploadTitle,
    uploadFile,
    getFileExt,
    onFileChange,
    submitUpload,
  };
}
