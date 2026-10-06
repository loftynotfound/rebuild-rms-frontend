<script setup>
import {computed} from "vue";
import Modal from "@/components/ui/Modal.vue"

const props = defineProps({
    title: { type: String, default: "Result" },
    rows: { type: Array, requiered: true }
})

const emit = defineEmits(["close"]);
const failed = computed(() => props.rows.filter((r) => !r.success));
const okCount = computed(() => props.rows.length - failed.value.length)
</script>

<template>
    <Modal :title="title" @close="emit('close')">
        <div class="space-y-4">
            <p class="text-sm text-slate-600">
                <span class="font-semibold text-teal-600"> {{ okCount }} succeded</span>
                <span class="font-semibold text-red-600"> {{ failed.length }} failed</span>
                out of {{ rows.length }}
            </p>

            <ul class="max-h-64 divide-y divide-slate-200 overflow-y-auto text-sm">
                <li v-for="(r, i) in failed" :key="i" class="py-2">
                    <p class="font-medium text-slate-800">{{ r.label }}</p>
                    <p class="text-xs text-red-500">{{ r.error }}</p>
                </li>
            </ul>

            <div class="flex justify-end">
                <button
                type="button"
                class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
                @click="emite('close')"
                >
                    close
                </button>
            </div>
        </div>
    </Modal>
</template>