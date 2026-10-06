<script setup>
import { computed, onMounted, ref, watch } from "vue";
import api from "@/js/api";
import { useAuthStore } from "@/stores/auth";
import { openDocument } from "@/composables/paymentRequest/useDownload";

import Pagination from "@/components/ui/Pagination.vue";
import ReviewCancel from "@/components/paymentRequest/modal/ReviewCancel.vue";

defineProps({
  money: { type: Function, required: true },
  date: { type: Function, required: true },
});
const emit = defineEmits(["changed"]);

const authStore = useAuthStore();
const me = computed(() => authStore.admin?.admin_id);

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];
const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-600 border border-amber-200",
  approved: "bg-teal-100 text-teal-600 border border-teal-200",
  rejected: "bg-red-100 text-red-600 border border-red-200",
};

const status = ref("pending");
const page = ref(1);
const perPage = 10;
const totalPage = ref(1);
const totalData = ref(0);

const rows = ref([]);
const loading = ref(false);
const error = ref("");

const fetchList = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await api.get("/pr/cancel-requests", {
      params: { status: status.value, page: page.value, item: perPage },
    });
    rows.value = res.data ?? [];
    totalData.value = res.meta?.total_data ?? rows.value.length;
    totalPage.value = res.meta?.total_page ?? 1;
  } catch (e) {
    error.value =
      e.response?.data?.message ?? "Failed to load cancellation requests.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchList);

watch(status, () => {
  page.value = 1;
  fetchList();
});

const goToPage = (p) => {
  page.value = p;
  fetchList();
};

const viewDocument = async (row) => {
  error.value = "";
  try {
    await openDocument(
      `/pr/cancel-requests/${row.cancel_id}/document`,
      row.cancel_document_name,
    );
  } catch (e) {
    error.value = e.message;
  }
};

// --- review ---
const review = ref(null); // { row, mode }
const reviewLoading = ref(false);
const reviewError = ref("");

const openReview = (row, mode) => {
  reviewError.value = "";
  review.value = { row, mode };
};

const confirmReview = async (notes) => {
  const { row, mode } = review.value;
  reviewLoading.value = true;
  reviewError.value = "";
  try {
    await api.post(`/pr/cancel-requests/${row.cancel_id}/${mode}`, { notes });
    review.value = null;
    await fetchList();
    emit("changed");
  } catch (e) {
    reviewError.value =
      e.response?.data?.message ?? "Failed to process the request.";
  } finally {
    reviewLoading.value = false;
  }
};
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        type="button"
        class="h-9 rounded-sm border px-3 text-sm font-medium"
        :class="
          status === f.key
            ? 'border-teal-200 bg-teal-50 text-teal-600'
            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
        "
        @click="status = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <p
      v-if="error"
      class="rounded-sm border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-500"
    >
      {{ error }}
    </p>

    <p v-if="loading" class="py-12 text-center text-sm text-slate-400">Loading...</p>

    <div
      v-else-if="!rows.length"
      class="flex flex-col items-center justify-center gap-2 py-16 text-center"
    >
      <Icon icon="hugeicons:file-block" class="size-10 text-slate-400" />
      <p class="text-sm font-medium text-slate-800">No cancellation requests.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article
        v-for="row in rows"
        :key="row.cancel_id"
        class="flex flex-col gap-3 rounded-sm border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-slate-800">{{ row.rfp_no }}</p>
            <p class="text-xs text-slate-500">{{ row.pr_description_item }}</p>
          </div>
          <span
            class="inline-flex shrink-0 rounded-sm px-1.5 py-1 text-xs font-medium capitalize"
            :class="STATUS_STYLE[row.cancel_status] || 'bg-slate-100 text-slate-600'"
          >
            {{ row.cancel_status }}
          </span>
        </div>

        <dl class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt class="text-slate-400">Requester</dt>
            <dd class="font-medium text-slate-800">{{ row.requester_name || "-" }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Amount</dt>
            <dd class="font-medium text-slate-800">{{ money(row.pr_requested_amount) }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Requested At</dt>
            <dd class="font-medium text-slate-800">{{ date(row.cancel_create_date) }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">PR Status</dt>
            <dd class="font-medium capitalize text-slate-800">{{ row.pr_status }}</dd>
          </div>
        </dl>

        <div class="rounded-sm bg-slate-50 p-3 text-xs">
          <p class="mb-1 font-medium text-slate-600">Reason</p>
          <p class="whitespace-pre-line text-slate-700">{{ row.cancel_reason }}</p>
        </div>

        <div v-if="row.cancel_status !== 'pending'" class="rounded-sm bg-slate-50 p-3 text-xs">
          <p class="mb-1 font-medium text-slate-600">
            Reviewed by {{ row.reviewer_name || "-" }}
            <span v-if="row.cancel_review_date" class="font-normal text-slate-400">
              · {{ date(row.cancel_review_date) }}
            </span>
          </p>
          <p v-if="row.cancel_review_notes" class="whitespace-pre-line text-slate-700">
            {{ row.cancel_review_notes }}
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
            @click="viewDocument(row)"
          >
            <Icon icon="hugeicons:file-view" class="size-4" />
            {{ row.cancel_document_name || "View document" }}
          </button>

          <div v-if="row.cancel_status === 'pending'" class="flex gap-2">
            <p
              v-if="row.requester_id === me"
              class="self-center text-[11px] text-slate-400"
            >
              You cannot review your own request.
            </p>
            <template v-else>
              <button
                type="button"
                class="rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                @click="openReview(row, 'reject')"
              >
                Reject
              </button>
              <button
                type="button"
                class="rounded-sm bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                @click="openReview(row, 'approve')"
              >
                Approve
              </button>
            </template>
          </div>
        </div>
      </article>
    </div>

    <Pagination
      v-if="rows.length"
      class="pt-2"
      :page="page"
      :total-page="totalPage"
      :total-data="totalData"
      :per-page="perPage"
      @change="goToPage"
    />

    <ReviewCancel
      v-if="review"
      :target="review.row"
      :mode="review.mode"
      :loading="reviewLoading"
      :error="reviewError"
      @close="review = null"
      @confirm="confirmReview"
    />
  </section>
</template>