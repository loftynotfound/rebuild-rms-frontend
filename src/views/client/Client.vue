<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useClients } from "@/composables/client/useClient";
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
  fetchClients,
  goToPage,
  handleDelete,
  handleAdd,
  handleEdit,
  showModal,
  modalMode,
  submitting,
  formError,
  regions,
  form,
  showDeleteModal,
  closeDeleteModal,
  deleteTarget,
  deleteSubmitting,
  confirmDelete,
  closeModal,
  submitForm,
  togglingActive,
  toggleClientActive,
} = useClients();

const columns = [
  { key: "no", label: "No", class: "w-16" },
  { key: "client_name", label: "Name" },
  { key: "client_phone", label: "Phone" },
  { key: "client_email", label: "Email" },
  { key: "client_active", label: "Status", class: "text-center w-28" },
  { key: "action", label: "Action", class: "text-center w-24" },
];

onMounted(fetchClients);
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-800">Client List</h1>

    <div class="rounded-md bg-white shadow-sm">
      <div class="flex justify-end px-4 sm:px-6 pt-4 sm:pt-6">
        <button
          v-if="authStore.hasAccess('create_client')"
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
          Add Client
        </button>
      </div>

      <!-- MOBILE: card list -->
      <div class="mt-4 p-4 sm:hidden">
        <Card
          :rows="rows"
          :loading="loading"
          :error="error"
          row-key="client_id"
          empty-message="Belum ada client"
        >
          <template #default="{ row }">
            <div class="mb-3 flex items-start justify-between gap-2">
              <p class="wrap-break-word text-lg font-semibold text-slate-800">
                {{ row.client_name }}
              </p>
              <span
                class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="
                  row.client_active === 'yes'
                    ? 'bg-teal-50 text-teal-600'
                    : 'bg-red-50 text-red-600'
                "
              >
                {{ row.client_active === "yes" ? "Active" : "Inactive" }}
              </span>
            </div>

            <p class="mb-1 wrap-break-word text-sm text-slate-600">
              {{ row.client_phone }}
            </p>
            <p class="mb-3 wrap-break-word text-sm text-slate-600">
              {{ row.client_email }}
            </p>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-if="authStore.hasAccess('edit_client')"
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-md border border-yellow-400 bg-white px-3 py-2 text-sm font-medium text-yellow-500 hover:bg-yellow-50"
                aria-label="Edit client"
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
                v-if="authStore.hasAccess('delete_client')"
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-md border border-red-400 bg-white px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                aria-label="Hapus client"
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
          row-key="client_id"
          empty-message="Belum ada client"
        >
          <template #client_active="{ row }">
            <div class="flex justify-center">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="
                  row.client_active === 'yes'
                    ? 'bg-teal-50 text-teal-600'
                    : 'bg-red-50 text-red-600'
                "
              >
                {{ row.client_active === "yes" ? "Active" : "Inactive" }}
              </span>
            </div>
          </template>

          <template #action="{ row }">
            <div class="flex items-center justify-center gap-3">
              <button
                v-if="authStore.hasAccess('edit_client')"
                type="button"
                class="text-yellow-400 hover:text-yellow-500"
                aria-label="Edit client"
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
                v-if="authStore.hasAccess('delete_client')"
                type="button"
                class="text-red-400 hover:text-red-500"
                aria-label="Hapus client"
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
        class="p-4"
        v-if="!loading && !error && totalData > 0"
        :page="page"
        :total-page="totalPage"
        :total-data="totalData"
        :per-page="item"
        @change="goToPage"
      />
    </div>

    <!-- Modal Create / Edit Client -->
    <Modal
      v-if="showModal"
      :title="modalMode === 'create' ? 'Add Client' : 'Edit Client'"
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
            >Name</label
          >
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="Enter client name"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700"
            >Email</label
          >
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="client@example.com"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700"
            >Phone</label
          >
          <input
            v-model="form.phone"
            type="text"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="Enter client phone number"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700"
            >Address</label
          >
          <textarea
            v-model="form.address"
            rows="2"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="Enter client address"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700"
            >Region</label
          >
          <select
            v-model="form.region_id"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="" disabled>Choose region</option>
            <option
              v-for="region in regions"
              :key="region.region_id"
              :value="Number(region.region_id)"
            >
              {{ region.region_title }}
            </option>
          </select>
        </div>

        <div
          class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2"
        >
          <button
            v-if="
              modalMode === 'edit' && authStore.hasAccess('change_stat_active')
            "
            type="button"
            :disabled="togglingActive"
            class="w-full sm:w-auto rounded-sm px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            :class="
              form.client_active === 'yes'
                ? 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
                : 'text-teal-600 hover:bg-teal-50'
            "
            @click="toggleClientActive"
          >
            {{
              togglingActive
                ? "Processing..."
                : form.client_active === "yes"
                  ? "Deactivate"
                  : "Activate"
            }}
          </button>
          <div v-else />

          <div class="flex flex-col sm:flex-row gap-3">
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
        </div>
      </form>
    </Modal>

    <!-- Modal Delete -->
    <Modal
      v-if="showDeleteModal"
      title="Delete Client"
      @close="closeDeleteModal"
    >
      <div class="space-y-4">
        <p class="text-sm text-slate-600">
          Are you sure you want to delete the client
          <strong>{{ deleteTarget?.client_name }}</strong
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
