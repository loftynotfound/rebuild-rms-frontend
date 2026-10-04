<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCreatePO } from "@/composables/po/useCreatePO";

const authStore = useAuthStore();

const {
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
} = useCreatePO();

// Daftar product untuk dropdown di modal item — data hardcode, belum ada endpoint master product
const PRODUCT_OPTIONS = [
  "Maintenance",
  "PKWT",
  "Project",
  "Disnaker",
  "Alih Daya",
];

// State modal tambah/edit item (disimpan di view karena murni UI, bukan business logic)
const showItemModal = ref(false);
const editingItemId = ref(null);
const itemDraft = ref({ product: "", desc: "", qty: 1, unit_id: "", price: 0 });

function openAddItem() {
  editingItemId.value = null;
  itemDraft.value = { product: "", desc: "", qty: 1, unit_id: "", price: 0 };
  showItemModal.value = true;
  fetchUnitOptions();
}

function openEditItem(item) {
  editingItemId.value = item._localId;
  itemDraft.value = { ...item };
  showItemModal.value = true;
  fetchUnitOptions();
}

function saveItemDraft() {
  if (editingItemId.value) {
    updateItem(editingItemId.value, itemDraft.value);
  } else {
    addItem(itemDraft.value);
  }
  showItemModal.value = false;
}

function unitLabel(unitId) {
  return unitOptions.value.find((u) => u.unit_id === unitId)?.unit_title ?? "-";
}

onMounted(() => {
  fetchFormOptions();
});
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-800">Create Purchase Order</h1>

    <form class="space-y-6" @submit.prevent="submitForm">
      <p
        v-if="error"
        class="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ error }}
      </p>

      <!-- PO Information -->
      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2
          class="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-600"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6M9 8h1M5 21h14a2 2 0 002-2V7.414a1 1 0 00-.293-.707l-4.414-4.414A1 1 0 0015.586 2H5a2 2 0 00-2 2v15a2 2 0 002 2z"
            />
          </svg>
          PO Information
        </h2>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <!-- Baris 1: PO Number, PIC Office -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >PO Number <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.order_num"
              type="text"
              required
              placeholder="PO-0000-0000"
              class="w-full rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >PIC Office <span class="text-red-500">*</span></label
            >
            <select
              v-model="form.pic_id"
              required
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
            >
              <option value="" disabled>Choose PIC</option>
              <option
                v-for="pic in picOptions"
                :key="pic.admin_id"
                :value="pic.admin_id"
              >
                {{ pic.admin_email }}
              </option>
            </select>
          </div>

          <!-- Baris 2: Region, Division, Document Date -->
          <div class="sm:col-span-2 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >Region <span class="text-red-500">*</span></label
              >
              <select
                v-model="form.region_id"
                required
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
              >
                <option value="" disabled>Choose region</option>
                <option
                  v-for="region in regionOptions"
                  :key="region.region_id"
                  :value="region.region_id"
                >
                  {{ region.region_title }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >Division <span class="text-red-500">*</span></label
              >
              <select
                v-model="form.division_id"
                required
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
              >
                <option value="" disabled>Choose division</option>
                <option
                  v-for="division in divisionOptions"
                  :key="division.division_id"
                  :value="division.division_id"
                >
                  {{ division.division_title }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >Document Date <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.date"
                type="date"
                required
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Client Information -->
      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2
          class="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-600"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Client Information
        </h2>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <!-- Baris 1: Client Name, Email -->
          <div class="relative">
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >Client Name <span class="text-red-500">*</span></label
            >
            <div class="relative">
              <input
                v-model="clientKeyword"
                type="text"
                required
                autocomplete="off"
                placeholder="Search for or Create a New Client"
                class="w-full rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
              />
              <button
                v-if="form.client_id"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Reset client"
                @click="clearSelectedClient"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            <!-- Dropdown hasil pencarian client -->
            <ul
              v-if="clientOptions.length > 0"
              class="absolute z-10 mt-1 w-full overflow-hidden rounded-sm border border-slate-200 bg-white shadow-lg"
            >
              <li
                v-if="clientSearchLoading"
                class="px-3 py-2 text-sm text-slate-400"
              >
                Searching...
              </li>
              <li
                v-for="client in clientOptions"
                :key="client.client_id"
                :disabled="!!form.client_id"
                class="cursor-pointer px-3 py-2 text-sm hover:bg-teal-50"
                @click="selectClient(client)"
              >
                {{ client.client_name }}
              </li>
            </ul>
          </div>

          <div>
            <label
              class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
              >Email</label
            >
            <input
              v-model="form.client_email"
              type="email"
              placeholder="example@client.com"
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
              :disabled="!!form.client_id"
            />
          </div>

          <!-- Baris 2: Phone, Sub Client -->
          <div>
            <label
              class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
              >Phone</label
            >
            <input
              v-model="form.client_phone"
              :disabled="!!form.client_id"
              type="text"
              placeholder="0812-3456-7890"
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >Sub Client <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.sub_client"
              type="text"
              required
              placeholder="Enter sub client"
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
            />
          </div>

          <!-- Baris 3: PIC Client, Address -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >PIC Client</label
            >
            <select
              v-model="form.pic_client_id"
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
            >
              <option value="" disabled>Choose PIC client</option>
              <option
                v-for="pic in picClientOptions"
                :key="pic.admin_id"
                :value="pic.admin_id"
              >
                {{ pic.admin_email }}
              </option>
            </select>
          </div>

          <div>
            <label
              class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
              >Address</label
            >
            <input
              v-model="form.client_address"
              type="text"
              placeholder="Enter client address"
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <!-- Purchase Order Items -->
      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-center justify-between">
          <h2
            class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal-600"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Purchase Order Items
          </h2>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-sm bg-teal-500 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600"
            @click="openAddItem"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Item
          </button>
        </div>

        <!-- Empty state (shared) -->
        <div
          v-if="items.length === 0"
          class="py-8 text-center text-sm text-slate-400"
        >
          No items. Click "Add Item" to add one.
        </div>

        <!-- ===== DESKTOP: TABLE (md and up) ===== -->
        <table v-else class="hidden w-full text-left text-sm md:table">
          <thead>
            <tr
              class="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
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
            <tr
              v-for="(item, index) in items"
              :key="item._localId"
              class="border-b border-slate-50"
            >
              <td class="py-3 pr-3 text-slate-500">{{ index + 1 }}</td>
              <td class="py-3 pr-3 font-medium text-slate-800">
                {{ item.product }}
              </td>
              <td class="py-3 pr-3 text-slate-500">{{ item.desc || "-" }}</td>
              <td class="py-3 pr-3">{{ item.qty }}</td>
              <td class="py-3 pr-3">{{ unitLabel(item.unit_id) }}</td>
              <td class="py-3 pr-3">{{ formatCurrency(item.price) }}</td>
              <td class="py-3 pr-3">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-sm p-1 text-amber-500 hover:bg-amber-50"
                    aria-label="Edit item"
                    @click="openEditItem(item)"
                  >
                    <svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="rounded-sm p-1 text-red-500 hover:bg-red-50"
                    aria-label="Hapus item"
                    @click="removeItem(item._localId)"
                  >
                    <svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ===== MOBILE: CARDS (below md) ===== -->
        <div v-if="items.length > 0" class="space-y-3 md:hidden">
          <div
            v-for="(item, index) in items"
            :key="item._localId"
            class="rounded-xl border border-slate-100 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="text-xs font-medium text-slate-400"
                  >#{{ index + 1 }}</span
                >
                <h3 class="truncate font-medium text-slate-800">
                  {{ item.product }}
                </h3>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ item.desc || "-" }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="rounded-sm p-1.5 text-amber-500 hover:bg-amber-50"
                  aria-label="Edit item"
                  @click="openEditItem(item)"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="rounded-sm p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Hapus item"
                  @click="removeItem(item._localId)"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div
              class="mt-3 grid grid-cols-3 gap-2 border-t border-slate-50 pt-3 text-xs"
            >
              <div>
                <p class="text-slate-400">Qty</p>
                <p class="font-medium text-slate-700">{{ item.qty }}</p>
              </div>
              <div>
                <p class="text-slate-400">Unit</p>
                <p class="font-medium text-slate-700">
                  {{ unitLabel(item.unit_id) }}
                </p>
              </div>
              <div>
                <p class="text-slate-400">Price</p>
                <p class="font-medium text-slate-700">
                  {{ formatCurrency(item.price) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Ringkasan total -->
        <div class="mt-4 flex justify-end">
          <div class="w-full max-w-xs space-y-2 text-sm">
            <div class="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{{ formatCurrency(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>PPN ({{ ppnRate }}%)</span>
              <span>{{ formatCurrency(ppnAmount) }}</span>
            </div>
            <div
              class="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900"
            >
              <span>Total</span>
              <span>{{ formatCurrency(total) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-sm border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          @click="cancelForm"
        >
          Cancel
        </button>
        <button
          v-if="authStore.hasAccess('create_po')"
          type="submit"
          :disabled="submitting"
          class="rounded-sm bg-teal-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {{ submitting ? "Menyimpan..." : "Create Purchase Order" }}
        </button>
      </div>
    </form>

    <!-- Modal tambah/edit item -->
    <div
      v-if="showItemModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      @click.self="showItemModal = false"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h3 class="mb-4 text-base font-semibold text-slate-800">
          {{ editingItemId ? "Edit Item" : "Add Item" }}
        </h3>

        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >Product</label
            >
            <select
              v-model="itemDraft.product"
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
            >
              <option value="" disabled>Choose product</option>
              <option
                v-for="product in PRODUCT_OPTIONS"
                :key="product"
                :value="product"
              >
                {{ product }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >Description</label
            >
            <input
              v-model="itemDraft.desc"
              type="text"
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >Qty</label
              >
              <input
                v-model.number="itemDraft.qty"
                type="number"
                min="1"
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >Unit</label
              >
              <select
                v-model="itemDraft.unit_id"
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
              >
                <option value="" disabled>Choose unit</option>
                <option
                  v-for="unit in unitOptions"
                  :key="unit.unit_id"
                  :value="unit.unit_id"
                >
                  {{ unit.unit_title }}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >Price</label
            >
            <div
              class="flex overflow-hidden rounded-sm border border-slate-200 focus-within:border-teal-400"
            >
              <span
                class="flex items-center bg-slate-50 px-3 text-sm font-medium text-slate-500"
                >IDR</span
              >
              <input
                v-model.number="itemDraft.price"
                type="number"
                min="0"
                class="w-full border-0 px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            @click="showItemModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
            @click="saveItemDraft"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
