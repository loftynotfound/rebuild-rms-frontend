<script setup>
import { onMounted, ref, watch } from "vue";
import api from "@/js/api";
import Status from "@/components/paymentRequest/badge/Status.vue";

const props = defineProps({
  prId: { type: Number, required: true },
  date: { type: Function, required: true },
});

const history = ref([]);
const loading = ref(false);
const error = ref("");

const fetchHistory = async () => {
  loading.value = true;
  error.value = "";
  try {
    history.value = (await api.get(`/pr/${props.prId}/history`)).data ?? [];
  } catch (e) {
    error.value = e.response?.data?.message ?? "Failed to load status history.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchHistory);
watch(() => props.prId, fetchHistory);
</script>

<template>
  <div class="rounded-sm border border-slate-200 bg-white px-6 py-4">
    <h2 class="mb-3 text-sm font-semibold text-slate-900">Status History</h2>

    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
    <p v-else-if="loading" class="text-sm text-slate-400">Loading...</p>
    <p v-else-if="!history.length" class="text-sm text-slate-400">No history yet.</p>

    <ol v-else class="space-y-4 border-l border-slate-200 pl-4 text-sm">
      <li v-for="h in history" :key="h.history_id" class="relative">
        <span class="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-teal-500" />
        <div class="flex flex-wrap items-center gap-1.5">
          <Status v-if="h.history_from_status" :status="h.history_from_status" />
          <Icon
            v-if="h.history_from_status"
            icon="hugeicons:arrow-right-01"
            class="size-4 text-slate-400"
          />
          <Status :status="h.history_to_status" />
        </div>
        <p v-if="h.history_notes" class="mt-1 whitespace-pre-line text-slate-600">
          {{ h.history_notes }}
        </p>
        <p class="mt-0.5 text-xs text-slate-400">
          {{ h.admin_name || "-" }} · {{ date(h.history_create_date) }}
        </p>
      </li>
    </ol>
  </div>
</template>