<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

import Document from "@/components/paymentRequest/display/Document.vue";

const route = useRoute();

const { fetchDetail, detailLoading, money, date } = usePaymentRequest();

const item = ref(null);

const loadDetail = async () => {
  item.value = await fetchDetail(route.params.id);
};

onMounted(loadDetail);
watch(() => route.params.id, loadDetail);
</script>

<template>
  <div v-if="item" class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl font-semibold text-slate-800">Detail</h1>
      </div>
    </div>

    <div class="flex flex-col gap-4 px-6 py-6 bg-white border border-slate-200">
      <div>
        <div class="py-2 border-y border-slate-200">
          <h2 class="text-sm text-slate-900 font-medium">
            Request For Payment Number:
            <span class="text-slate-600 font-normal">
              {{ item.rfpNumber }}
            </span>
          </h2>
        </div>

        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Type:</span>
              <span class="text-slate-900 font-medium">
                {{ item.rfpType || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Date:</span>
              <span class="text-slate-900 font-medium">
                {{ date(item.createdAt || item.rfpDate) }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Quotation Number:</span>
              <span class="text-slate-900 font-medium">
                {{ item.quotationNumber || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Purchase Order Number:</span>
              <span class="text-slate-900 font-medium">
                {{ item.poNumber || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div>
          <h2
            class="py-2 border-y border-slate-200 text-sm font-semibold text-slate-900"
          >
            Payment Method:
            <span class="text-slate-600 font-normal">
              {{ item.paymentType || "-" }}
            </span>
          </h2>
        </div>

        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Vendor:</span>
              <span class="text-slate-900 font-medium">
                {{ item.vendor || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Bank Name:</span>
              <span class="text-slate-900 font-medium">
                {{ item.bankName || "-" }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Bank Account Number:</span>
              <span class="text-slate-900 font-medium">
                {{ item.bankAccountNumber || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Bank Account Name:</span>
              <span class="text-slate-900 font-medium">
                {{ item.bankAccountName || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="py-2 border-y border-slate-200 text-sm font-normal">
          <h2 class="text-slate-900 font-medium">Description:</h2>
          <span class="text-slate-600">
            {{ item.description || "-" }}
          </span>
        </div>

        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Total Amount:</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.totalAmount) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Purchase Order Amount:</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.poAmount) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">COGS Amount:</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.cogs) }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Total Previous Payments:</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.totalPreviousPayment) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Margin (Rp):</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.margin) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Target Invoice Date:</span>
              <span class="text-slate-900 font-medium">
                {{ date(item.targetInvoiceDate) || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-200">
        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Responsible & COA:</span>
              <span class="text-slate-900 font-medium">
                {{ item.responsible }} {{ item.coa }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Person In Charge:</span>
              <span class="text-slate-900 font-medium">
                {{ item.preparedBy || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Document :item="item" :money="money" :date="date" />
  </div>

  <div
    v-else-if="!detailLoading"
    class="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400"
  >
    Payment request not found.
  </div>
</template>
