<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useUnits } from "@/composables/control/useUnit";
import Table from "@/components/ui/Table.vue";
import Card from "@/components/ui/CardList.vue";
import Pagination from "@/components/ui/Pagination.vue";
import Modal from "@/components/ui/Modal.vue";

const authStore = useAuthStore();

const {
  rows,
  loading,
  error,
  page,
  item,
  totalData,
  totalPage,
  fetchUnits,
  goToPage,
  handleDelete,
  handleAdd,
  handleEdit,
  showModal,
  modalMode,
  submitting,
  formError,
  form,
  showDeleteModal,
  closeDeleteModal,
  deleteTarget,
  deleteSubmitting,
  confirmDelete,
  closeModal,
  submitForm,
} = useUnits();

const columns = [
  { key: "no", label: "No", class: "w-16" },
  { key: "unit_title", label: "Title" },
  { key: "action", label: "Action", class: "text-center w-24" },
];

onMounted(fetchUnits);
</script>

<template>
  <div>
    <h1 class="mb-4 sm:mb-6 text-xl sm:text-2xl font-semibold text-slate-800">
      Unit List
    </h1>

    <div class="rounded-md bg-white shadow-sm">
      <div class="flex justify-end px-4 sm:px-6 pt-4 sm:pt-6">
        <button
          v-if="authStore.hasAccess('create_unit')"
          type="button"
          class="flex w-full sm:w-auto items-center justify-center gap-2 rounded-sm bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600"
          @click="handleAdd"
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
          Add Unit
        </button>
      </div>

      <!-- MOBILE: card list -->
      <div class="mt-4 p-4 sm:hidden">
        <Card
          :rows="rows"
          :loading="loading"
          :error="error"
          row-key="unit_id"
          empty-message="Belum ada unit"
        >
          <template #default="{ row }">
            <p class="mb-3 break-words text-lg font-semibold text-slate-800">
              {{ row.unit_title }}
            </p>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-if="authStore.hasAccess('edit_unit')"
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-md border border-yellow-400 bg-white px-3 py-2 text-sm font-medium text-yellow-500 hover:bg-yellow-50"
                aria-label="Edit unit"
                @click="handleEdit(row)"
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
                Edit
              </button>

              <button
                v-if="authStore.hasAccess('delete_unit')"
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-md border border-red-400 bg-white px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                aria-label="Hapus unit"
                @click="handleDelete(row)"
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
                Delete
              </button>
            </div>
          </template>
        </Card>
      </div>

      <!-- DESKTOP/TABLET: table -->
      <div class="mt-4 hidden sm:block overflow-x-auto">
        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          :error="error"
          row-key="unit_id"
          empty-message="Belum ada unit"
        >
          <template #action="{ row }">
            <div class="flex items-center justify-center gap-3">
              <button
                v-if="authStore.hasAccess('edit_unit')"
                type="button"
                class="text-yellow-400 hover:text-yellow-500"
                aria-label="Edit unit"
                @click="handleEdit(row)"
              >
                <svg
                  class="h-5 w-5"
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
                v-if="authStore.hasAccess('delete_unit')"
                type="button"
                class="text-red-400 hover:text-red-500"
                aria-label="Hapus unit"
                @click="handleDelete(row)"
              >
                <svg
                  class="h-5 w-5"
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
          </template>
        </Table>
      </div>

      <Pagination
        v-if="!loading && !error && totalData > 0"
        :page="page"
        :total-page="totalPage"
        :total-data="totalData"
        :per-page="item"
        @change="goToPage"
      />
    </div>

    <!-- Modal Create / Edit Unit -->
    <Modal
      v-if="showModal"
      :title="modalMode === 'create' ? 'Add Unit' : 'Edit Unit'"
      @close="closeModal"
    >
      <form class="space-y-4" @submit.prevent="submitForm">
        <p
          v-if="formError"
          class="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {{ formError }}
        </p>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700"
            >Title</label
          >
          <input
            v-model="form.title"
            type="text"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="Contoh: Pallet"
          />
        </div>

        <div class="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            type="button"
            class="w-full sm:w-auto rounded-sm border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full sm:w-auto rounded-sm bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {{ submitting ? "Saving..." : "Save" }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal Delete -->
    <Modal v-if="showDeleteModal" title="Delete Unit" @close="closeDeleteModal">
      <div class="space-y-4">
        <p class="text-sm text-slate-600">
          Are you sure you want to delete the unit
          <strong>{{ deleteTarget?.unit_title }}</strong
          >? This action cannot be undone.
        </p>

        <div class="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            type="button"
            class="w-full sm:w-auto rounded-sm border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            @click="closeDeleteModal"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="deleteSubmitting"
            class="w-full sm:w-auto rounded-sm bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            @click="confirmDelete"
          >
            {{ deleteSubmitting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
