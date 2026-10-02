<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAdmins } from "@/composables/admin/useAdmin";
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
  fetchAdmins,
  goToPage,
  handleActivate,
  handleDeactivate,
  handleResendActivation,
  handleAdd,
  handleEdit,
  showModal,
  modalMode,
  submitting,
  formError,
  roles,
  regions,
  form,
  closeModal,
  submitForm,
} = useAdmins();

const columns = [
  { key: "no", label: "No", class: "w-16" },
  { key: "admin_email", label: "Email" },
  { key: "admin_name", label: "Username" },
  { key: "role_title", label: "Role" },
  { key: "region_title", label: "Region" },
  { key: "action", label: "Action", class: "text-center w-24" },
];

onMounted(fetchAdmins);
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-800">
      Admin List
    </h1>

    <div class="rounded-md bg-white shadow-sm">
      <div class="flex justify-end px-4 sm:px-6 pt-4 sm:pt-6">
        <button
          v-if="authStore.hasAccess('create_new_admin')"
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
          Add
        </button>
      </div>

      <!-- MOBILE: card list -->
      <div class="mt-4 p-4 sm:hidden">
        <Card
          :rows="rows"
          :loading="loading"
          :error="error"
          row-key="admin_id"
          empty-message="Belum ada data admin"
        >
          <template #default="{ row }">
            <p class="mb-1 break-words text-lg font-semibold text-slate-800">
              {{ row.admin_name }}
            </p>
            <p class="mb-1 text-sm text-slate-500">
              Email:
              <span class="font-medium text-slate-600">{{
                row.admin_email
              }}</span>
            </p>
            <p class="mb-1 text-sm text-slate-500">
              Role:
              <span class="font-medium text-slate-600">{{
                row.role_title
              }}</span>
            </p>
            <p class="mb-3 text-sm text-slate-500">
              Region:
              <span class="font-medium text-slate-600">{{
                row.region_title
              }}</span>
            </p>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-if="authStore.hasAccess('edit_other_admin')"
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-md border border-yellow-400 bg-white px-3 py-2 text-sm font-medium text-yellow-500 hover:bg-yellow-50"
                aria-label="Edit admin"
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
                v-if="
                  row.admin_active === 'active' &&
                  authStore.hasAccess('deactivate_other_admin')
                "
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-md border border-red-400 bg-white px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                aria-label="Nonaktifkan admin"
                @click="handleDeactivate(row)"
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
                    d="M18.364 18.364A9 9 0 105.636 5.636a9 9 0 0012.728 12.728zM5.636 5.636l12.728 12.728"
                  />
                </svg>
                Inactive
              </button>

              <template v-else-if="row.admin_active === 'inactive'">
                <button
                  v-if="authStore.hasAccess('deactivate_other_admin')"
                  type="button"
                  class="flex items-center justify-center gap-1.5 rounded-md border border-emerald-500 bg-white px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                  aria-label="Aktifkan admin"
                  @click="handleActivate(row)"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Active
                </button>

                <button
                  v-if="authStore.hasAccess('resend_admin_activation')"
                  type="button"
                  class="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-sky-500 bg-white px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
                  aria-label="Kirim ulang email aktivasi"
                  @click="handleResendActivation(row)"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Resend Activation
                </button>
              </template>
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
          row-key="admin_id"
          empty-message="Belum ada data admin"
        >
          <template #action="{ row }">
            <div class="flex items-center justify-center gap-3">
              <button
                v-if="authStore.hasAccess('edit_other_admin')"
                type="button"
                title="Edit"
                class="text-yellow-400 hover:text-yellow-500"
                aria-label="Edit admin"
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
                v-if="
                  row.admin_active === 'active' &&
                  authStore.hasAccess('deactivate_other_admin')
                "
                type="button"
                title="Inactive"
                class="text-red-400 hover:text-red-500"
                aria-label="Nonaktifkan admin"
                @click="handleDeactivate(row)"
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
                    d="M18.364 18.364A9 9 0 105.636 5.636a9 9 0 0012.728 12.728zM5.636 5.636l12.728 12.728"
                  />
                </svg>
              </button>

              <template v-else-if="row.admin_active === 'inactive'">
                <button
                  v-if="authStore.hasAccess('deactivate_other_admin')"
                  type="button"
                  title="Active"
                  class="text-emerald-500 hover:text-emerald-600"
                  aria-label="Aktifkan admin"
                  @click="handleActivate(row)"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>

                <button
                  v-if="authStore.hasAccess('resend_admin_activation')"
                  type="button"
                  title="Resend-email"
                  class="text-sky-500 hover:text-sky-600"
                  aria-label="Kirim ulang email aktivasi"
                  @click="handleResendActivation(row)"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </template>
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

    <!-- Modal Create / Edit Admin -->
    <Modal
      v-if="showModal"
      :title="modalMode === 'create' ? 'Add Admin' : 'Edit Admin'"
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
            >Email</label
          >
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700"
            >Username</label
          >
          <input
            v-model="form.username"
            type="text"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="Enter username"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700"
            >Role</label
          >
          <select
            v-model="form.role_id"
            required
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="" disabled>Choose role</option>
            <option
              v-for="role in roles"
              :key="role.role_id"
              :value="Number(role.role_id)"
            >
              {{ role.role_title }}
            </option>
          </select>
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
          v-if="authStore.hasAccess('edit_pic')"
          class="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700"
              >PIC Internal</label
            >
            <select
              v-model="form.pic"
              class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700"
              >PIC Client</label
            >
            <select
              v-model="form.pic_client"
              class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
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
  </div>
</template>
