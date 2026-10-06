<script setup>
import { onMounted, ref, watch } from "vue";
import api from "@/js/api";

const props = defineProps({
  prId: { type: Number, required: true },
  date: { type: Function, required: true },
});

const TYPE_LABEL = {
  revision_request: "Revision",
  payment_cancellation: "Payment cancelled",
  internal_note: "Note",
};

const comments = ref([]);
const loading = ref(false);
const forbidden = ref(false);
const error = ref("");

const text = ref("");
const sending = ref(false);

const fetchComments = async () => {
  loading.value = true;
  try {
    comments.value = (await api.get(`/pr/${props.prId}/comments`)).data ?? [];
  } catch (e) {
    if (e.response?.status === 403) forbidden.value = true;
    else error.value = e.response?.data?.message ?? "Failed to load comments.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchComments);
watch(() => props.prId, fetchComments);

const send = async () => {
  if (!text.value.trim()) return;
  sending.value = true;
  error.value = "";
  try {
    await api.post(`/pr/${props.prId}/comments`, {
      text: text.value.trim(),
      type: "general",
    });
    text.value = "";
    await fetchComments();
  } catch (e) {
    error.value = e.response?.data?.message ?? "Failed to send the comment.";
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <div v-if="!forbidden" class="rounded-sm border border-slate-200 bg-white px-6 py-4">
    <h2 class="mb-2 text-sm font-semibold text-slate-900">Comments</h2>

    <p v-if="loading" class="text-sm text-slate-400">Loading...</p>
    <p v-else-if="!comments.length" class="text-sm text-slate-400">No comments yet.</p>

    <ul v-else class="divide-y divide-slate-200 text-sm">
      <li v-for="c in comments" :key="c.comment_id" class="space-y-1 py-3">
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium text-slate-900">
            {{ c.admin_name || "-" }}
            <span
              v-if="TYPE_LABEL[c.comment_type]"
              class="ml-1 rounded-sm border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
            >
              {{ TYPE_LABEL[c.comment_type] }}
            </span>
          </span>
          <span class="text-xs text-slate-400">{{ date(c.comment_create_date) }}</span>
        </div>
        <p class="whitespace-pre-line text-slate-600">{{ c.comment_text }}</p>
      </li>
    </ul>

    <div class="mt-3 space-y-2 border-t border-slate-200 pt-3">
      <textarea
        v-model="text"
        rows="3"
        class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
        placeholder="Write a comment..."
      />
      <div class="flex items-center justify-between">
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
        <span v-else />
        <button
          type="button"
          class="rounded-sm bg-teal-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          :disabled="sending || !text.trim()"
          @click="send"
        >
          {{ sending ? "Sending..." : "Send" }}
        </button>
      </div>
    </div>
  </div>
</template>