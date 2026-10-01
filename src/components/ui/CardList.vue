<script setup>
defineProps({
  columns: { type: Array, default: () => [] }, // [{ key, label, class? }] — used by the fallback layout only
  rows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  emptyMessage: { type: String, default: "Belum ada data" },
  rowKey: { type: String, default: "id" },
});
</script>

<template>
  <div class="space-y-3">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="n in 3"
        :key="n"
        class="animate-pulse rounded-lg border border-slate-100 p-4"
      >
        <div class="mb-2 h-4 w-1/2 rounded bg-slate-100"></div>
        <div class="h-3 w-2/3 rounded bg-slate-100"></div>
      </div>
    </div>

    <!-- Error State -->
    <p
      v-else-if="error"
      class="rounded-sm bg-red-50 px-3 py-3 text-center text-sm text-red-500"
    >
      {{ error }}
    </p>

    <!-- Empty State -->
    <p
      v-else-if="rows.length === 0"
      class="py-12 text-center text-sm text-slate-400"
    >
      {{ emptyMessage }}
    </p>

    <!-- Data Cards -->
    <div
      v-for="(row, index) in rows"
      v-else
      :key="row[rowKey]"
      class="rounded-lg border border-slate-100 p-4"
    >
      <!--
        Custom card body: pass a default slot to design the card however a given
        page needs (header + badge, grids, footers, action buttons, etc).
        `row` and `index` are exposed so callers can do their own numbering/formatting.
      -->
      <slot :row="row" :index="index" :columns="columns">
        <!-- Fallback layout, used only if the caller doesn't provide a default slot -->
        <dl class="space-y-2">
          <div
            v-for="col in columns"
            :key="col.key"
            class="flex items-start justify-between gap-3 text-sm"
          >
            <dt
              class="flex-shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400"
            >
              {{ col.label }}
            </dt>
            <dd class="min-w-0 text-right text-slate-700">
              <slot :name="col.key" :row="row">{{ row[col.key] }}</slot>
            </dd>
          </div>
        </dl>
      </slot>
    </div>
  </div>
</template>
