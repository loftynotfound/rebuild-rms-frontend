<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  emptyMessage: { type: String, default: "Belum ada data" },
  rowKey: { type: String, default: "id" },
});
</script>

<template>
  <table class="hidden w-full text-center lg:table">
    <thead>
      <tr class="divide-x divide-slate-200 border-y border-slate-200">
        <th
          v-for="col in columns"
          :key="col.key"
          class="px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 break-words"
          :class="col.class"
        >
          <slot :name="`header-${col.key}`" :col="col">{{ col.label }}</slot>
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-200">
      <tr v-if="loading">
        <td
          :colspan="columns.length"
          class="px-3 py-12 text-center text-xs text-slate-400"
        >
          Memuat data...
        </td>
      </tr>
      <tr v-else-if="error">
        <td
          :colspan="columns.length"
          class="px-3 py-12 text-center text-xs text-red-500"
        >
          {{ error }}
        </td>
      </tr>
      <tr v-else-if="rows.length === 0">
        <td
          :colspan="columns.length"
          class="px-3 py-12 text-center text-xs text-slate-400"
        >
          {{ emptyMessage }}
        </td>
      </tr>
      <template v-else>
        <tr
          v-for="row in rows"
          :key="row[rowKey]"
          class="divide-x divide-slate-200 border-b border-slate-200"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-3 py-3 text-xs text-slate-700 break-words align-top"
            :class="col.tdClass"
          >
            <slot :name="col.key" :row="row">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </template>
    </tbody>
  </table>

  <div class="lg:hidden">
    <div v-if="loading" class="px-6 py-12 text-center text-xs text-slate-400">
      Memuat data...
    </div>
    <div v-else-if="error" class="px-6 py-12 text-center text-xs text-red-500">
      {{ error }}
    </div>
    <div
      v-else-if="rows.length === 0"
      class="px-6 py-12 text-center text-xs text-slate-400"
    >
      {{ emptyMessage }}
    </div>

    <div v-else class="space-y-3 px-6 py-4">
      <div
        v-for="(row, index) in rows"
        :key="row[rowKey]"
        class="rounded-lg border border-slate-200 p-4"
      >
        <slot name="card" :row="row" :index="index" />
      </div>
    </div>
  </div>
</template>
