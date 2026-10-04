<script setup>
import { computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";
import { usePODetail } from "@/composables/po/useDetailPO";
import { usePODetailModals } from "@/composables/po/useDetailModalPO";

const authStore = useAuthStore();

const route = useRoute();
const detail = usePODetail(route.params.id);
const modals = usePODetailModals(detail);

const {
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
  canCreateNotes,
  canUploadDocument,
  canChangeStatPaid,
  canUpdateInvoice,
  showEditTab,
  showDocumentTab,
  showInvoiceInPreview,
  statusLabel,
  nextStatusLabel,
  showCancelButton,
  showDeleteButton,
  fetchAll,
  saveEdit,
  enterEditMode,
  exitEditMode,
  editForm,
  editItems,
  editSubtotal,
  regionOptions,
  picOptions,
  picClientOptions,
  unitOptions,
  divisionOptions,
  clientKeyword,
  clientOptions,
  clientSearchLoading,
  selectClient,
  clearSelectedClient,
  removeEditItem,
  unitLabel,
  formatCurrency,
  formatDate,
  downloadDocument,
  showQuotationTab,
  canLinkQuotation,
  linkedQuotations,
  quotationsLoading,
  quotationError,
  quotationPRs,
  prsLoading,
  candidates,
  candidatesLoading,
  canUnlinkQuotation,
  unlinkDisabledByStatus,
} = detail;

const {
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
  showPRsModal,
  selectedQuotation,
  openPRsModal,
  showLinkModal,
  candidateKeyword,
  openLinkModal,
  searchCandidates,
  submitLink,
  showUnlinkModal,
  unlinkTarget,
  unlinkNotes,
  openUnlinkModal,
  submitUnlink,
} = modals;

const STATUS_BADGE_CLASS = {
  open: "bg-blue-50 text-blue-600",
  prepared: "bg-amber-50 text-amber-600",
  progress: "bg-purple-50 text-purple-600",
  complete: "bg-teal-50 text-teal-600",
  cancel: "bg-red-50 text-red-600",
};
const badgeClass = computed(
  () =>
    STATUS_BADGE_CLASS[po.value?.po_status] ?? "bg-slate-100 text-slate-600",
);

onMounted(fetchAll);
</script>

<template>
  <div>
    <div v-if="loading" class="py-16 text-center text-sm text-slate-400">
      Loading Purchase Order...
    </div>
    <div v-else-if="error && !po" class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ error }}
    </div>

    <template v-else-if="po">
      <!-- Header -->
      <div class="space-y-4 flex flex-wrap items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">
            {{ po.po_id }}
          </h1>
        </div>
        <span class="rounded-full px-3 py-1 text-md font-semibold" :class="badgeClass">{{ statusLabel }}</span>
      </div>

      <p v-if="error" class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ error }}
      </p>

      <!-- Tab navigation -->
      <div class="mb-6 flex overflow-x-auto border-b border-slate-200">
        <button type="button"
          class="whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
          :class="activeTab === 'preview'
            ? 'border-teal-500 text-slate-900'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            " @click="
              activeTab = 'preview';
            isEditMode = false;
            ">
          Preview
        </button>
        <button v-if="showEditTab && authStore.hasAccess('edit_po')" type="button"
          class="whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
          :class="activeTab === 'edit'
            ? 'border-teal-500 text-slate-900'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            " @click="
              activeTab = 'edit';
            enterEditMode();
            ">
          Edit PO
        </button>
        <button type="button"
          class="whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
          :class="activeTab === 'activity'
            ? 'border-teal-500 text-slate-900'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            " @click="activeTab = 'activity'">
          Activity
        </button>
        <button v-if="showDocumentTab" type="button"
          class="whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
          :class="activeTab === 'document'
            ? 'border-teal-500 text-slate-900'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            " @click="activeTab = 'document'">
          Document
        </button>
        <button v-if="showQuotationTab" type="button"
          class="whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
          :class="activeTab === 'quotation'
            ? 'border-teal-500 text-slate-900'
            : 'border-transparent text-slate-400 hover:text-slate-600'
            " @click="activeTab = 'quotation'">
          Quotation
        </button>
      </div>

      <!-- TAB: PREVIEW -->
      <div v-if="activeTab === 'preview'" class="space-y-6">
        <!-- PO Info + Client Info: 2 kolom berdampingan -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Purchase Order Info -->
          <div>
            <h2 class="mb-3 text-sm font-semibold text-slate-800">
              Purchase Order Info
            </h2>
            <div class="rounded-md border border-slate-200 bg-white p-5 text-sm">
              <p class="text-slate-800">
                <span class="font-bold">Purchase Order ID : </span>{{ po.po_id }}
              </p>
              <p class="mt-1 text-slate-800">
                <span class="font-bold">Purchase Order No : </span>{{ po.po_order_num }}
              </p>
              <p class="mt-1 text-slate-600">
                <span>Document Date : </span>{{ formatDate(po.po_date) }}
              </p>
              <p class="mt-1 text-slate-600">
                <span>PIC : </span>{{ po.pic_name ?? "-" }}
              </p>
              <p class="mt-1 text-slate-600">
                <span>Region : </span>{{ po.region_title ?? "-" }}
              </p>
              <p v-if="showInvoiceInPreview" class="mt-1 text-slate-600">
                <span>Invoice Number : </span>{{ po.po_invoice }}
              </p>
            </div>
          </div>

          <!-- Client Info -->
          <div>
            <h2 class="mb-3 text-sm font-semibold text-slate-800">
              Client Info
            </h2>
            <div class="rounded-md border border-slate-200 bg-white p-5 text-sm">
              <p v-if="po.client_name" class="font-bold text-slate-800">
                {{ po.client_name }}
              </p>
              <p v-if="po.po_subclient" class="mt-1 text-slate-800">
                <span class="font-bold">Sub Client : </span>{{ po.po_subclient }}
              </p>
              <p v-if="po.pic_client_name" class="mt-1 text-slate-800">
                <span class="font-bold">PIC : </span>{{ po.pic_client_name }}
              </p>
              <p v-if="po.client_email" class="mt-1 text-slate-600">
                <span>Email : </span>{{ po.client_email }}
              </p>
              <p v-if="po.client_phone" class="mt-1 text-slate-600">
                <span>Phone Number : </span>{{ po.client_phone }}
              </p>
              <p v-if="po.client_address" class="mt-1 text-slate-600">
                <span>Address : </span>{{ po.client_address }}
              </p>
            </div>
          </div>
        </div>

        <!-- Purchase Order Items -->
        <section class="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-teal-600">
            Purchase Order Items
          </h2>

          <!-- Mobile: stacked cards -->
          <div class="space-y-3 sm:hidden">
            <div v-for="(item, index) in items" :key="item.item_id ?? index"
              class="rounded-xl border border-slate-100 p-3">
              <div class="mb-1 flex items-start justify-between gap-2">
                <span class="text-sm font-medium text-slate-800">{{
                  item.item_product
                }}</span>
                <span class="shrink-0 text-xs text-slate-400"
                  >#{{ index + 1 }}</span
                >
              </div>
              <p v-if="item.item_desc" class="mb-2 text-xs text-slate-500">
                {{ item.item_desc }}
              </p>
              <div class="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>{{ item.item_qty }} {{ item.unit_title }}</span>
                <span class="font-medium text-slate-700">{{
                  formatCurrency(item.item_price)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Desktop/tablet: table -->
          <div class="hidden overflow-x-auto sm:block">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th class="py-2 pr-3">No</th>
                  <th class="py-2 pr-3">Description</th>
                  <th class="py-2 pr-3">Product</th>
                  <th class="py-2 pr-3">Qty</th>
                  <th class="py-2 pr-3">Unit</th>
                  <th class="py-2 pr-3">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in items" :key="item.item_id ?? index" class="border-b border-slate-50">
                  <td class="py-3 pr-3 text-slate-500">{{ index + 1 }}</td>
                  <td class="py-3 pr-3 text-slate-500">
                    {{ item.item_desc || "-" }}
                  </td>
                  <td class="py-3 pr-3 font-medium text-slate-800">
                    {{ item.item_product }}
                  </td>
                  <td class="py-3 pr-3">{{ item.item_qty }}</td>
                  <td class="py-3 pr-3">{{ item.unit_title }}</td>
                  <td class="py-3 pr-3">
                    {{ formatCurrency(item.item_price) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 flex justify-end">
            <div class="w-full max-w-xs space-y-2 text-sm">
              <div class="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{{ formatCurrency(po.po_subtotal) }}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>PPN ({{ po.po_ppn_rate }}%)</span>
                <span>{{ formatCurrency(po.po_ppn_amount) }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>{{ formatCurrency(po.po_total) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Notes -->
        <section class="rounded-md bg-white p-6 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-teal-600">
              Purchase Order Notes
            </h2>
            <button v-if="canCreateNotes && authStore.hasAccess('update_po_notes')" type="button"
              class="text-sm font-medium text-teal-600 hover:text-teal-700" @click="openNotesModal">
              Edit Notes
            </button>
          </div>
          <p class="whitespace-pre-line text-sm text-slate-600">
            {{ po.po_notes || "No notes yet." }}
          </p>

          <div class="mt-6">
            <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent Activity
            </h3>
            <div class="max-h-56 space-y-3 overflow-y-auto pr-1">
              <div v-if="activities.length === 0" class="text-sm text-slate-400">
                No activity yet.
              </div>
              <div
                v-for="activity in activities.slice(0, 8)"
                :key="activity.activity_id"
                class="flex gap-3 text-sm"
              >
                <span
                  class="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-400"
                ></span>
                <div>
                  <p class="text-slate-700">
                    <span class="font-medium">{{
                      activity.admin_name ?? "System"
                    }}</span>
                    {{ activity.activity_notes ?? activity.note }}
                  </p>
                  <p class="text-xs text-slate-400">
                    {{ formatDate(activity.activity_create_date) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <!-- Back (kiri) -->
          <button type="button"
            class="flex items-center gap-1.5 rounded-sm border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="$router.back()">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-3">
            <button v-if="nextStatusLabel && authStore.hasAccess('change_stat_po')" type="button"
              :disabled="actionLoading"
              class="rounded-sm bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
              @click="confirmAdvanceStatus">
              {{ nextStatusLabel }}
            </button>

            <button v-if="
              canUpdateInvoice &&
              ['progress', 'complete'].includes(po.po_status) &&
              authStore.hasAccess('update_invoice')
            " type="button"
              class="rounded-sm border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              @click="openInvoiceModal">
              Update Invoice
            </button>

            <button v-if="
              canChangeStatPaid &&
              po.po_status === 'complete' &&
              authStore.hasAccess('change_stat_paid')
            " type="button" :disabled="actionLoading"
              class="rounded-sm px-4 py-2.5 text-sm font-medium disabled:opacity-50" :class="isPaid
                ? 'bg-white border border-amber-500 text-amber-600 hover:bg-amber-50'
                : 'bg-white border border-teal-500 text-teal-600 hover:bg-teal-50'
                " @click="confirmTogglePaid">
              {{ isPaid ? "Set as Not Paid" : "Set as Paid" }}
            </button>

            <button v-if="showCancelButton && authStore.hasAccess('change_stat_po')" type="button"
              :disabled="actionLoading"
              class="rounded-sm border border-red-400 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              @click="confirmCancel">
              Cancel PO
            </button>

            <button v-if="showDeleteButton && authStore.hasAccess('delete_po')" type="button" :disabled="actionLoading"
              class="rounded-sm bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              @click="confirmDelete">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- TAB: EDIT PO -->
      <div v-else-if="activeTab === 'edit'" class="space-y-6">
        <section class="rounded-md bg-white p-6 shadow-sm">
          <h2 class="mb-5 text-sm font-semibold uppercase tracking-wide text-teal-600">
            PO Information
          </h2>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <!-- Baris 1: PO Number, PIC Office -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">PO Number</label>
              <input v-model="editForm.order_num" type="text"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">PIC Office</label>
              <select v-model="editForm.pic_id"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none">
                <option value="" disabled>Choose PIC</option>
                <option v-for="pic in picOptions" :key="pic.admin_id" :value="pic.admin_id">
                  {{ pic.admin_email }}
                </option>
              </select>
            </div>

            <!-- Baris 2: Region, Division, Document Date -->
            <div class="sm:col-span-2 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">Region</label>
                <select v-model="editForm.region_id"
                  class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none">
                  <option value="" disabled>Choose region</option>
                  <option v-for="region in regionOptions" :key="region.region_id" :value="region.region_id">
                    {{ region.region_title }}
                  </option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">Division</label>
                <select v-model="editForm.division_id"
                  class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none">
                  <option value="" disabled>Choose division</option>
                  <option v-for="division in divisionOptions" :key="division.division_id" :value="division.division_id">
                    {{ division.division_title }}
                  </option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">Document Date</label>
                <input v-model="editForm.date" type="date"
                  class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-md bg-white p-6 shadow-sm">
          <h2 class="mb-5 text-sm font-semibold uppercase tracking-wide text-teal-600">
            Client Information
          </h2>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div class="relative">
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Client Name</label>
              <div class="relative">
                <input v-model="clientKeyword" type="text" autocomplete="off"
                  placeholder="Search for or Create a New Client"
                  class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
                <button v-if="editForm.client_id" type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Reset client" @click="clearSelectedClient">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <ul v-if="clientOptions.length > 0"
                class="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                <li v-if="clientSearchLoading" class="px-3 py-2 text-sm text-slate-400">
                  Searching...
                </li>
                <li v-for="client in clientOptions" :key="client.client_id"
                  class="cursor-pointer px-3 py-2 text-sm hover:bg-teal-50" @click="selectClient(client)">
                  {{ client.client_name }}
                </li>
              </ul>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Email</label>
              <input v-model="editForm.client_email" type="email" :disabled="!!editForm.client_id"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Phone</label>
              <input v-model="editForm.client_phone" type="text" :disabled="!!editForm.client_id"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Sub Client</label>
              <input v-model="editForm.sub_client" type="text"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">PIC Client</label>
              <select v-model="editForm.pic_client_id"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none">
                <option value="" disabled>Choose PIC client</option>
                <option v-for="pic in picClientOptions" :key="pic.admin_id" :value="pic.admin_id">
                  {{ pic.admin_email }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Address</label>
              <input v-model="editForm.client_address" type="text" :disabled="!!editForm.client_id"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
            </div>
          </div>
        </section>

        <section class="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-teal-600">
              Purchase Order Items
            </h2>
            <button type="button"
              class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-500 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600 sm:w-auto"
              @click="openAddItem">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>

          <!-- Mobile: stacked cards -->
          <div class="space-y-3 sm:hidden">
            <div v-if="editItems.length === 0" class="py-8 text-center text-sm text-slate-400">
              No items. Tap "Add Item" to add one.
            </div>
            <div v-for="(item, index) in editItems" :key="item._localId" class="rounded-xl border border-slate-100 p-3">
              <div class="mb-1 flex items-start justify-between gap-2">
                <span class="text-sm font-medium text-slate-800">{{
                  item.product
                }}</span>
                <span class="shrink-0 text-xs text-slate-400"
                  >#{{ index + 1 }}</span
                >
              </div>
              <p v-if="item.desc" class="mb-2 text-xs text-slate-500">
                {{ item.desc }}
              </p>
              <div class="mb-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>{{ item.qty }} {{ unitLabel(item.unit_id) }}</span>
                <span class="font-medium text-slate-700">{{
                  formatCurrency(item.price)
                }}</span>
              </div>
              <div class="flex justify-end gap-2 border-t border-slate-50 pt-2">
                <button type="button" class="rounded-md p-1.5 text-amber-500 hover:bg-amber-50" aria-label="Edit item"
                  @click="openEditItem(item)">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button type="button" class="rounded-md p-1.5 text-red-500 hover:bg-red-50" aria-label="Delete item"
                  @click="removeEditItem(item._localId)">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop/tablet: table -->
          <div class="hidden overflow-x-auto sm:block">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th class="py-2 pr-3">No</th>
                  <th class="py-2 pr-3">Product</th>
                  <th class="py-2 pr-3">Description</th>
                  <th class="py-2 pr-3">Qty</th>
                  <th class="py-2 pr-3">Unit</th>
                  <th class="py-2 pr-3">Price</th>
                  <th class="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="editItems.length === 0">
                  <td colspan="7" class="py-8 text-center text-sm text-slate-400">
                    No items. Click "Add Item" to add one.
                  </td>
                </tr>
                <tr v-for="(item, index) in editItems" :key="item._localId" class="border-b border-slate-50">
                  <td class="py-3 pr-3 text-slate-500">{{ index + 1 }}</td>
                  <td class="py-3 pr-3 font-medium text-slate-800">
                    {{ item.product }}
                  </td>
                  <td class="py-3 pr-3 text-slate-500">
                    {{ item.desc || "-" }}
                  </td>
                  <td class="py-3 pr-3">{{ item.qty }}</td>
                  <td class="py-3 pr-3">{{ unitLabel(item.unit_id) }}</td>
                  <td class="py-3 pr-3">{{ formatCurrency(item.price) }}</td>
                  <td class="py-3 pr-3">
                    <div class="flex items-center gap-2">
                      <button type="button" class="rounded-md p-1 text-amber-500 hover:bg-amber-50"
                        aria-label="Edit item" @click="openEditItem(item)">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button type="button" class="rounded-md p-1 text-red-500 hover:bg-red-50" aria-label="Delete item"
                        @click="removeEditItem(item._localId)">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 flex justify-end text-sm font-medium text-slate-700">
            Subtotal: {{ formatCurrency(editSubtotal) }}
          </div>
        </section>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <button type="button"
            class="flex items-center gap-1.5 rounded-sm border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="$router.back()">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button v-if="authStore.hasAccess('edit_po')" type="button" :disabled="actionLoading"
            class="rounded-sm bg-teal-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            @click="
              saveEdit();
            activeTab = 'preview';
            ">
            {{ actionLoading ? "Saving..." : "Save Data" }}
          </button>
        </div>
      </div>

      <!-- TAB: ACTIVITY -->
      <div v-else-if="activeTab === 'activity'" class="space-y-6">
        <section class="rounded-md bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-teal-600">
              Activity Timeline
            </h2>
            <button v-if="canCreateNotes && authStore.hasAccess('create_notes')" type="button"
              class="rounded-sm bg-teal-500 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600"
              @click="showLeaveNoteModal = true">
              Leave Notes
            </button>
          </div>

          <div v-if="activities.length === 0" class="py-8 text-center text-sm text-slate-400">
            No activity yet.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="activity in activities"
              :key="activity.activity_id"
              class="flex gap-3 border-b border-slate-50 pb-4 text-sm last:border-0"
            >
              <span
                class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400"
              ></span>
              <div>
                <p class="text-slate-700">
                  <span class="font-medium">{{
                    activity.admin_name ?? "System"
                  }}</span>
                  {{ activity.activity_notes ?? activity.note }}
                </p>
                <p class="text-xs text-slate-400">
                  {{ formatDate(activity.activity_create_date) }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div class="flex items-center justify-between">
          <button type="button"
            class="flex items-center gap-1.5 rounded-sm border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="$router.back()">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button v-if="canCreateNotes && authStore.hasAccess('create_notes')" type="button"
            class="rounded-sm bg-teal-500 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600"
            @click="showLeaveNoteModal = true">
            Leave Notes
          </button>
        </div>
      </div>

      <!-- TAB: DOCUMENT -->
      <div v-else-if="activeTab === 'document'" class="space-y-6">
        <section class="rounded-md bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-teal-600">
              Documents
            </h2>
            <button v-if="canUploadDocument && authStore.hasAccess('upload_document')" type="button"
              class="flex items-center gap-1.5 rounded-sm bg-teal-500 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600"
              @click="showUploadModal = true">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Upload Doc
            </button>
          </div>

          <!-- Mobile: stacked cards -->
          <div class="space-y-3 sm:hidden">
            <div v-if="documents.length === 0" class="py-8 text-center text-sm text-slate-400">
              No documents yet.
            </div>
            <div v-for="(doc, index) in documents" :key="doc.document_id"
              class="rounded-xl border border-slate-100 p-3">
              <div class="mb-2 flex items-start justify-between gap-2">
                <span class="text-sm font-medium text-slate-800">{{
                  doc.document_title ?? doc.document_name
                }}</span>
                <span
                  class="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-500"
                >
                  {{ getFileExt(doc) }}
                </span>
              </div>
              <div class="flex items-center gap-2 border-t border-slate-50 pt-2">
                <button type="button"
                  class="flex-1 rounded border border-slate-200 px-2.5 py-1.5 text-center text-xs font-medium text-slate-600 hover:bg-slate-50"
                  @click="downloadDocument(doc, 'download')">
                  Download
                </button>
                <button type="button"
                  class="flex-1 rounded border border-slate-200 px-2.5 py-1.5 text-center text-xs font-medium text-slate-600 hover:bg-slate-50"
                  @click="downloadDocument(doc, 'preview')">
                  Preview
                </button>
                <button v-if="authStore.hasAccess('upload_document')" type="button"
                  class="flex-1 rounded border border-red-200 px-2.5 py-1.5 text-center text-xs font-medium text-red-500 hover:bg-red-50"
                  @click="confirmDeleteDocument(doc)">
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop: table -->
          <div class="hidden overflow-x-auto sm:block">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th class="py-2 pr-3 w-10 text-center">No</th>
                  <th class="py-2 pr-3 text-center">File Name</th>
                  <th class="py-2 pr-3 w-60 text-center">Format</th>
                  <th class="py-2 pr-5 w-55 text-center">File</th>
                  <th class="py-2 pr-3 w-40 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="documents.length === 0">
                  <td colspan="5" class="py-8 text-center text-sm text-slate-400">
                    No documents yet.
                  </td>
                </tr>
                <tr v-for="(doc, index) in documents" :key="doc.document_id" class="border-b border-slate-50">
                  <td class="py-3 pr-3 text-slate-400 text-xs text-center">
                    {{ index + 1 }}
                  </td>
                  <td class="py-3 pr-3 text-slate-800 text-center">
                    {{ doc.document_title ?? doc.document_name }}
                  </td>
                  <td class="py-3 pr-3 text-center">
                    <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase text-slate">
                      {{ getFileExt(doc) }}
                    </span>
                  </td>
                  <td class="py-3 pr-3">
                    <div class="flex items-center justify-center gap-2">
                      <button type="button"
                        class="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        @click="downloadDocument(doc, 'download')">
                        Download
                      </button>
                      <button type="button"
                        class="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        @click="downloadDocument(doc, 'preview')">
                        Preview
                      </button>
                    </div>
                  </td>
                  <td class="py-3 pr-3 text-center">
                    <button v-if="authStore.hasAccess('upload_document')" type="button"
                      class="flex items-center gap-1 rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 mx-auto"
                      @click="confirmDeleteDocument(doc)">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="flex items-center justify-between">
          <button type="button"
            class="flex items-center gap-1.5 rounded-sm border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="$router.back()">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <!-- TAB: QUOTATION -->
      <div v-else-if="activeTab === 'quotation' && showQuotationTab" class="space-y-6">
        <section class="rounded-md bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-teal-600">
              Linked Quotations
            </h2>
            <button v-if="canLinkQuotation" type="button"
              class="rounded-sm bg-teal-500 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600"
              @click="openLinkModal">
              Add PR
            </button>
          </div>

          <p v-if="quotationError" class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {{ quotationError }}
          </p>

          <div v-if="quotationsLoading" class="py-8 text-center text-sm text-slate-400">
            Loading quotations...
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th class="py-2 pr-3">No</th>
                  <th class="py-2 pr-3">Quotation No</th>
                  <th class="py-2 pr-3">Linked By</th>
                  <th class="py-2 pr-3">Link Date</th>
                  <th class="py-2 pr-3 text-center">Total PR</th>
                  <th class="py-2 pr-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="linkedQuotations.length === 0">
                  <td colspan="6" class="py-8 text-center text-sm text-slate-400">
                    No linked quotations yet.
                  </td>
                </tr>
                <tr v-for="(q, index) in linkedQuotations" :key="q.quotation_id" class="border-b border-slate-50">
                  <td class="py-3 pr-3 text-slate-500">{{ index + 1 }}</td>
                  <td class="py-3 pr-3 font-medium text-slate-800">{{ q.quotation_no }}</td>
                  <td class="py-3 pr-3 text-slate-500">{{ q.quotation_link_ref_admin || "-" }}</td>
                  <td class="py-3 pr-3 text-slate-500">{{ formatDate(q.quotation_link_date) }}</td>
                  <td class="py-3 pr-3 text-center">{{ q.total_pr }}</td>
                  <td class="py-3 pr-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button type="button"
                        class="rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        @click="openPRsModal(q)">
                        View PRs
                      </button>
                      <button v-if="canUnlinkQuotation" type="button"
                        :disabled="unlinkDisabledByStatus || actionLoading"
                        class="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        @click="openUnlinkModal(q)">
                        Unlink
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="flex items-center justify-between">
          <button type="button"
            class="flex items-center gap-1.5 rounded-sm border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="$router.back()">
            Back
          </button>
        </div>
      </div>
    </template>

    <!-- Modal: Edit Notes -->
    <div v-if="showNotesModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showNotesModal = false">
      <div class="w-full max-w-md rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-4 text-base font-semibold text-slate-800">
          Edit Purchase Order Notes
        </h3>
        <textarea v-model="notesDraft" rows="4"
          class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"></textarea>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showNotesModal = false">
            Cancel
          </button>
          <button type="button" :disabled="actionLoading"
            class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            @click="saveNotes">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Leave Activity Note -->
    <div v-if="showLeaveNoteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showLeaveNoteModal = false">
      <div class="w-full max-w-md rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-4 text-base font-semibold text-slate-800">Leave Notes</h3>
        <textarea v-model="leaveNoteDraft" rows="4" placeholder="Write a note..."
          class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"></textarea>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showLeaveNoteModal = false">
            Cancel
          </button>
          <button type="button" :disabled="actionLoading"
            class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            @click="submitLeaveNote">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Update Invoice -->
    <div v-if="showInvoiceModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showInvoiceModal = false">
      <div class="w-full max-w-sm rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-4 text-base font-semibold text-slate-800">
          Update Invoice Number
        </h3>
        <input v-model="invoiceDraft" type="text" placeholder="INV-2026-XXXX"
          class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
        <div class="mt-6 flex justify-end gap-3">
          <button type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showInvoiceModal = false">
            Cancel
          </button>
          <button type="button" :disabled="actionLoading"
            class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            @click="saveInvoice">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Add/Edit Item -->
    <div v-if="showItemModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showItemModal = false">
      <div class="w-full max-w-md rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-4 text-base font-semibold text-slate-800">
          {{ editingItemLocalId ? "Edit Item" : "Add Item" }}
        </h3>
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Product</label>
            <select v-model="itemDraft.product"
              class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none">
              <option value="" disabled>Choose product</option>
              <option v-for="product in PRODUCT_OPTIONS" :key="product" :value="product">
                {{ product }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <input v-model="itemDraft.desc" type="text"
              class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Qty</label>
              <input v-model.number="itemDraft.qty" type="number" min="1"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
              <select v-model="itemDraft.unit_id"
                class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none">
                <option value="" disabled>Choose unit</option>
                <option v-for="unit in unitOptions" :key="unit.unit_id" :value="unit.unit_id">
                  {{ unit.unit_title }}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Price</label>
            <div class="flex overflow-hidden rounded-md border border-slate-200 focus-within:border-teal-400">
              <span class="flex items-center bg-slate-50 px-3 text-sm font-medium text-slate-500">IDR</span>
              <input v-model.number="itemDraft.price" type="number" min="0"
                class="w-full border-0 px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showItemModal = false">
            Cancel
          </button>
          <button type="button"
            class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
            @click="saveItemDraft">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Upload Document -->
    <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showUploadModal = false">
      <div class="w-full max-w-md rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-4 text-base font-semibold text-slate-800">
          Upload New Document
        </h3>
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">File Name</label>
            <input v-model="uploadTitle" type="text" placeholder="e.g. Signed Contract"
              class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">File</label>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
              @change="onFileChange" />
            <p class="mt-1 text-xs text-slate-400">
              PDF, DOC, DOCX, JPG, JPEG, PNG, GIF — max 10MB
            </p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showUploadModal = false">
            Cancel
          </button>
          <button type="button" :disabled="actionLoading || !uploadFile"
            class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            @click="submitUpload">
            {{ actionLoading ? "Uploading..." : "Upload" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: PR list of a linked quotation -->
    <div v-if="showPRsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showPRsModal = false">
      <div class="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-1 text-base font-semibold text-slate-800">Purchase Requests</h3>
        <p class="mb-4 text-sm text-slate-500">Quotation {{ selectedQuotation?.quotation_no }}</p>
        <p v-if="quotationError" class="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{{ quotationError }}
        </p>
        <div v-if="prsLoading" class="py-8 text-center text-sm text-slate-400">Loading...</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th class="py-2 pr-3">RFP No</th>
                <th class="py-2 pr-3">Description</th>
                <th class="py-2 pr-3">Requester</th>
                <th class="py-2 pr-3">Responsible</th>
                <th class="py-2 pr-3">Status</th>
                <th class="py-2 pr-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="quotationPRs.length === 0">
                <td colspan="6" class="py-8 text-center text-sm text-slate-400">No purchase requests.</td>
              </tr>
              <tr v-for="pr in quotationPRs" :key="pr.pr_id" class="border-b border-slate-50">
                <td class="py-3 pr-3 font-medium text-slate-800">{{ pr.pr_rfp_no }}</td>
                <td class="py-3 pr-3 text-slate-500">{{ pr.pr_description_item }}</td>
                <td class="py-3 pr-3 text-slate-500">{{ pr.requester_name || "-" }}</td>
                <td class="py-3 pr-3 text-slate-500">{{ pr.responsible_name || "-" }}</td>
                <td class="py-3 pr-3 capitalize">{{ pr.pr_status }}</td>
                <td class="py-3 pr-3 text-right">{{ formatCurrency(pr.pr_requested_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-6 flex justify-end">
          <button type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showPRsModal = false">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Add PR (link quotation group to this PO) -->
    <div v-if="showLinkModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showLinkModal = false">
      <div class="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-4 text-base font-semibold text-slate-800">Add PR (Link Quotation)</h3>
        <form class="mb-4 flex gap-2" @submit.prevent="searchCandidates">
          <input v-model="candidateKeyword" type="text" placeholder="Search quotation number"
            class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none" />
          <button type="submit"
            class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600">
            Search
          </button>
        </form>
        <p v-if="quotationError" class="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{{ quotationError }}
        </p>
        <div v-if="candidatesLoading" class="py-8 text-center text-sm text-slate-400">Loading...</div>
        <div v-else class="space-y-3">
          <div v-if="candidates.length === 0" class="py-8 text-center text-sm text-slate-400">
            No quotation candidates found.
          </div>
          <div v-for="c in candidates" :key="c.quotation_id" class="rounded-md border border-slate-200 p-4">
            <div class="mb-2 flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-slate-800">{{ c.quotation_no }}</p>
                <p v-if="c.linked_po_no" class="text-xs text-amber-600">Already linked to {{ c.linked_po_no }}</p>
                <p v-else-if="!c.eligible" class="text-xs text-slate-400">Needs at least one completed PR</p>
              </div>
              <button type="button" :disabled="actionLoading || !c.eligible || !!c.linked_po_no"
                class="rounded-sm bg-teal-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
                @click="submitLink(c)">
                Link
              </button>
            </div>
            <ul class="space-y-1 text-xs text-slate-600">
              <li v-for="m in c.members" :key="m.pr_id" class="flex justify-between">
                <span>{{ m.rfp_no }}</span>
                <span class="capitalize">{{ m.pr_status }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showLinkModal = false">
            Close
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showUnlinkModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showUnlinkModal = false"
    >
      <div class="w-full max-w-md rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-1 text-base font-semibold text-slate-800">
          Unlink Quotation
        </h3>
        <p class="mb-4 text-sm text-slate-500">
          Quotation {{ unlinkTarget?.quotation_no }} will be unlinked from this
          PO.
        </p>
        <p
          v-if="quotationError"
          class="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {{ quotationError }}
        </p>
        <label class="mb-1.5 block text-sm font-medium text-slate-700"
          >Reason <span class="text-red-500">*</span></label
        >
        <textarea
          v-model="unlinkNotes"
          rows="4"
          placeholder="Why is this link being removed?"
          class="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
        ></textarea>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showUnlinkModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="actionLoading || !unlinkNotes.trim()"
            class="rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            @click="submitUnlink"
          >
            {{ actionLoading ? "Unlinking..." : "Unlink" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirm action -->
    <div v-if="confirmModal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="confirmModal.show = false">
      <div class="w-full max-w-sm rounded-md bg-white p-6 shadow-lg">
        <h3 class="mb-2 text-base font-semibold text-slate-800">
          {{ confirmModal.title }}
        </h3>
        <p class="mb-6 text-sm text-slate-500">{{ confirmModal.message }}</p>
        <div class="flex justify-end gap-3">
          <button type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="confirmModal.show = false">
            Cancel
          </button>
          <button type="button" class="rounded-sm px-4 py-2 text-sm font-medium text-white" :class="confirmModal.variant === 'danger'
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-teal-500 hover:bg-teal-600'
            " @click="runConfirmedAction">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
