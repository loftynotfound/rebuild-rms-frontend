<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
  money: {
    type: Function,
    required: true,
  },
  date: {
    type: Function,
    required: true,
  },
});
</script>

<template>
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
              <div class="grid grid-cols-[138px_1fr] border-t border-slate-200">
                <span class="bg-slate-100 px-2.5 py-1.5 font-medium"> PO </span>

                <strong class="px-2.5 py-1.5 font-normal">
                  {{ money(item.poAmount) }}
                </strong>
              </div>

              <div class="grid grid-cols-[138px_1fr] border-t border-slate-200">
                <span class="bg-slate-100 px-2.5 py-1.5 font-medium">
                  HPP
                </span>

                <strong class="px-2.5 py-1.5 font-normal">
                  {{ money(item.cogs) }}
                </strong>
              </div>

              <div class="grid grid-cols-[138px_1fr] border-t border-slate-200">
                <span class="bg-slate-100 px-2.5 py-1.5 font-medium">
                  Margin
                </span>

                <strong class="px-2.5 py-1.5 font-normal">
                  {{ money(item.margin) }} ({{ item.marginPct }}%)
                </strong>
              </div>

              <div
                class="grid grid-cols-[105px_1fr] border-t border-slate-200 sm:grid-cols-[138px_1fr]"
              >
                <span class="bg-slate-100 px-2.5 py-1.5 font-medium">
                  Target Invoice
                </span>

                <strong class="px-2.5 py-1.5 font-normal">
                  {{ date(item.targetInvoiceDate) }}
                </strong>
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

            <span class="block min-h-4.5">
              {{ item.preparedBy || "-" }}
            </span>
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

            <span class="block min-h-4.5">
              {{ item.reviewedBy || "-" }}
            </span>
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

            <span class="block min-h-4.5">
              {{ item.approvedBy || "-" }}
            </span>
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

            <span class="block min-h-4.5">
              {{ item.postedBy || "-" }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </article>
</template>
