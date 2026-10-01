<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

const route = useRoute();

const { getRequest, money, date } = usePaymentRequest();

const item = computed(() => getRequest(route.params.id));
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
            <span class="text-slate-600 font-normal">{{ item.rfpNumber }}</span>
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
          <span class="text-slate-600">{{ item.description || "-" }}</span>
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
              <span class="text-slate-900 font-medium">{{
                money(item.totalPreviousPayment)
              }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-slate-600">Margin (Rp):</span>
              <span class="text-slate-900 font-medium">{{
                money(item.margin)
              }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-slate-600">Target Invoice Date:</span>
              <span class="text-slate-900 font-medium">{{
                date(item.targetInvoiceDate) || "-"
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-200">
        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Responsible & COA:</span>
              <span class="text-slate-900 font-medium"
                >{{ item.responsible }} {{ item.coa }}</span
              >
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Person In Charge:</span>
              <span class="text-slate-900 font-medium">{{
                item.preparedBy || "-"
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <article
      class="rounded-sm border border-slate-200 bg-white px-6 py-6 sm:px-8 sm:py-8"
    >
      <div class="text-center">
        <h2 class="text-[20px] font-extrabold leading-6 text-slate-900">
          REQUEST FOR PAYMENT
        </h2>
        <p class="text-[20px] font-extrabold leading-7 text-slate-900">
          PT REZEKI UTAMI SEJAHTERA
        </p>
      </div>

      <div class="mt-6 grid gap-7 md:grid-cols-2">
        <table class="w-full border-collapse text-xs text-slate-800">
          <tbody>
            <tr>
              <th
                class="w-[31%] border border-slate-200 bg-slate-100 px-2.5 py-2 text-left font-medium"
              >
                No RFP
              </th>
              <td class="border border-slate-200 bg-white px-2.5 py-2">
                {{ item.rfpNumber || "-" }}
              </td>
            </tr>
            <tr>
              <th
                class="w-[31%] border border-slate-200 bg-slate-100 px-2.5 py-2 text-left font-medium"
              >
                Date
              </th>
              <td class="border border-slate-200 bg-white px-2.5 py-2">
                {{ date(item.rfpDate) }}
              </td>
            </tr>
            <tr>
              <th
                class="w-[31%] border border-slate-200 bg-slate-100 px-2.5 py-2 text-left font-medium"
              >
                No Quot
              </th>
              <td class="border border-slate-200 bg-white px-2.5 py-2">
                {{ item.quotationNumber || "-" }}
              </td>
            </tr>
            <tr>
              <th
                class="w-[31%] border border-slate-200 bg-slate-100 px-2.5 py-2 text-left font-medium"
              >
                PO Number
              </th>
              <td class="border border-slate-200 bg-white px-2.5 py-2">
                {{ item.poNumber || "-" }}
              </td>
            </tr>
          </tbody>
        </table>

        <table class="w-full border-collapse text-xs text-slate-800">
          <tbody>
            <tr>
              <th
                class="w-[31%] border border-slate-200 bg-slate-100 px-2.5 py-2 text-left font-medium"
              >
                Payment Type
              </th>
              <td class="border border-slate-200 bg-white px-2.5 py-2">
                {{ item.paymentType || "-" }}
              </td>
            </tr>
            <tr>
              <th
                class="w-[31%] border border-slate-200 bg-slate-100 px-2.5 py-2 text-left font-medium"
              >
                Bank
              </th>
              <td class="border border-slate-200 bg-white px-2.5 py-2">
                {{ item.bankName || "-" }}
              </td>
            </tr>
            <tr>
              <th
                class="w-[31%] border border-slate-200 bg-slate-100 px-2.5 py-2 text-left font-medium"
              >
                Bank Account No.
              </th>
              <td class="border border-slate-200 bg-white px-2.5 py-2">
                {{ item.bankAccountNumber || "-" }}
              </td>
            </tr>
            <tr>
              <th
                class="w-[31%] border border-slate-200 bg-slate-100 px-2.5 py-2 text-left font-medium"
              >
                Bank Account Name
              </th>
              <td class="border border-slate-200 bg-white px-2.5 py-2">
                {{ item.bankAccountName || "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <table
        class="mt-6 w-full table-fixed border-collapse text-xs text-slate-800"
      >
        <thead>
          <tr>
            <th
              class="w-1/2 border border-slate-200 bg-blue-600 px-2.5 py-2.5 text-center font-bold text-white"
            >
              DESCRIPTION
            </th>
            <th
              class="border border-slate-200 bg-blue-600 px-2.5 py-2.5 text-center font-bold text-white"
            >
              AMOUNT
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-slate-200 bg-white p-0 align-top">
              <div class="min-h-13 p-2.5 leading-[1.45]">
                {{ item.description || "-" }}
              </div>
              <div>
                <div
                  class="grid grid-cols-[138px_1fr] border-t border-slate-200"
                >
                  <span class="bg-slate-100 px-2.5 py-1.5 font-medium">PO</span>
                  <strong class="px-2.5 py-1.5 font-normal">{{
                    money(item.poAmount)
                  }}</strong>
                </div>
                <div
                  class="grid grid-cols-[138px_1fr] border-t border-slate-200"
                >
                  <span class="bg-slate-100 px-2.5 py-1.5 font-medium"
                    >HPP</span
                  >
                  <strong class="px-2.5 py-1.5 font-normal">{{
                    money(item.cogs)
                  }}</strong>
                </div>
                <div
                  class="grid grid-cols-[138px_1fr] border-t border-slate-200"
                >
                  <span class="bg-slate-100 px-2.5 py-1.5 font-medium"
                    >Margin</span
                  >
                  <strong class="px-2.5 py-1.5 font-normal"
                    >{{ money(item.margin) }} ({{ item.marginPct }}%)</strong
                  >
                </div>
                <div
                  class="grid grid-cols-[105px_1fr] border-t border-slate-200 sm:grid-cols-[138px_1fr]"
                >
                  <span class="bg-slate-100 px-2.5 py-1.5 font-medium"
                    >Target Invoice</span
                  >
                  <strong class="px-2.5 py-1.5 font-normal">{{
                    date(item.targetInvoiceDate)
                  }}</strong>
                </div>
              </div>
            </td>
            <td
              class="border border-slate-200 bg-white px-2.5 py-3 text-center align-top font-bold"
            >
              {{ money(item.totalAmount) }}
            </td>
          </tr>
          <tr>
            <th
              class="border border-slate-200 bg-white px-2.5 py-2.5 text-right font-bold text-slate-800"
            >
              TOTAL AMOUNT
            </th>
            <th
              class="border border-slate-200 bg-white px-2.5 py-2.5 text-center font-bold text-slate-800"
            >
              {{ money(item.totalAmount) }}
            </th>
          </tr>
        </tbody>
      </table>

      <table
        class="mt-6 w-full table-fixed border-collapse text-xs text-slate-800"
      >
        <thead>
          <tr>
            <th
              class="border border-slate-200 bg-blue-600 px-2.5 py-2.5 text-center font-bold text-white"
            >
              Prepared by :
            </th>
            <th
              class="border border-slate-200 bg-blue-600 px-2.5 py-2.5 text-center font-bold text-white"
            >
              Reviewed by :
            </th>
            <th
              class="border border-slate-200 bg-blue-600 px-2.5 py-2.5 text-center font-bold text-white"
            >
              Approve by :
            </th>
            <th
              class="border border-slate-200 bg-blue-600 px-2.5 py-2.5 text-center font-bold text-white"
            >
              Posted by :
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              class="h-33 border border-slate-200 px-2 pb-2.5 text-center align-bottom"
            >
              <div class="flex h-23 items-center justify-center">
                <img
                  v-if="item.signature"
                  :src="item.signature"
                  alt="Prepared by signature"
                  class="max-h-16.25 max-w-33.75 object-contain"
                />
              </div>
              <span class="block min-h-4.5">{{ item.preparedBy || "-" }}</span>
            </td>
            <td
              class="h-33 border border-slate-200 px-2 pb-2.5 text-center align-bottom"
            >
              <div class="flex h-23 items-center justify-center">
                <img
                  v-if="item.reviewedSignature"
                  :src="item.reviewedSignature"
                  alt="Checked by signature"
                  class="max-h-16.25 max-w-33.75 object-contain"
                />
              </div>
              <span class="block min-h-4.5">{{ item.reviewedBy || "-" }}</span>
            </td>
            <td
              class="h-33 border border-slate-200 px-2 pb-2.5 text-center align-bottom"
            >
              <div class="flex h-23 items-center justify-center">
                <img
                  v-if="item.approvedSignature"
                  :src="item.approvedSignature"
                  alt="Approve by signature"
                  class="max-h-16.25 max-w-33.75 object-contain"
                />
              </div>
              <span class="block min-h-4.5">{{ item.approvedBy || "-" }}</span>
            </td>
            <td
              class="h-33 border border-slate-200 px-2 pb-2.5 text-center align-bottom"
            >
              <div class="flex h-23 items-center justify-center">
                <img
                  v-if="item.postedSignature"
                  :src="item.postedSignature"
                  alt="Posted by signature"
                  class="max-h-16.25 max-w-33.75 object-contain"
                />
              </div>
              <span class="block min-h-4.5">{{ item.postedBy || "-" }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  </div>

  <div
    v-else
    class="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400"
  >
    Payment request not found.
  </div>
</template>
