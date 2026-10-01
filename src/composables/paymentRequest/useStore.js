import { ref } from "vue";

const isClient = typeof window !== "undefined";

const STORAGE_KEY = "paymentRequestsVersionThirteen";

const RESPONSIBLE_KEY = "ResponsibleOptionsVersionOne";

const defaultResponsibleOptions = [
  { responsible: "RUAS", coa: "5-200" },
  { responsible: "DUTA", coa: "5-100" },
];

export const today = () => new Date().toISOString().slice(0, 10);

export const STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVISION: "revision",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const PAYMENT_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
};

export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVISION_REQUESTED: "revision_requested",
};

const seed = [
  // Draft
  {
    prId: 1,
    prRfpNumber: "1301-0012026",
    prStatus: "draft",
    prVendor: "HYUNDAI",
    prRequestedAmount: 9410000,
    prDescriptionItem:
      "First 50% progress payment for the water purifier installation project.",
    prQoutNumber: "QUO-001/IX/2026",
    prPoNumber: "PO-001/IX/2026",
    responsibleName: "RUAS",
    adminName: "Rama",
    prCreateDate: "2026-09-01",
    approvals: [],
    payments: [
      {
        paymentId: 1,
        paymentStage: "down_payment",
        paymentAmount: 9410000,
        paymentBank: "BCA",
        paymentBankAccountNumber: "8800551109",
        paymentBankAccountName: "HARYANTO",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 2,
    prRfpNumber: "1301-0022026",
    prStatus: "draft",
    prVendor: "TOYOTA",
    prRequestedAmount: 18500000,
    prDescriptionItem:
      "Monthly periodic service and routine equipment maintenance.",
    prQoutNumber: "QUO-002/IX/2026",
    prPoNumber: "PO-002/IX/2026",
    responsibleName: "DUTA",
    adminName: "Sinta",
    prCreateDate: "2026-09-02",
    approvals: [],
    payments: [
      {
        paymentId: 2,
        paymentStage: "full_payment",
        paymentAmount: 18500000,
        paymentBank: "MANDIRI",
        paymentBankAccountNumber: "1234567890",
        paymentBankAccountName: "PT TOYOTA PARTNER",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 3,
    prRfpNumber: "1301-0032026",
    prStatus: "draft",
    prVendor: "HONDA",
    prRequestedAmount: 25750000,
    prDescriptionItem: "Procurement and installation of workshop equipment.",
    prQoutNumber: "QUO-003/IX/2026",
    prPoNumber: "PO-003/IX/2026",
    responsibleName: "RUAS",
    adminName: "Dimas",
    prCreateDate: "2026-09-03",
    approvals: [],
    payments: [
      {
        paymentId: 3,
        paymentStage: "down_payment",
        paymentAmount: 25750000,
        paymentBank: "BNI",
        paymentBankAccountNumber: "1122334455",
        paymentBankAccountName: "PT HONDA NUSANTARA",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 4,
    prRfpNumber: "1301-0042026",
    prStatus: "draft",
    prVendor: "MITSUBISHI",
    prRequestedAmount: 1250000000,
    prDescriptionItem:
      "Payment for the complete overhaul of the assembly plant compressor and pneumatic systems, including replacement of pressure valves, hose assemblies, and control units, followed by a full performance test, technician reports for every serviced unit, and a short training session for the operators who will use the upgraded equipment.",
    prQoutNumber: "QUO-004/IX/2026",
    prPoNumber: "PO-004/IX/2026",
    responsibleName: "DUTA",
    adminName: "Nadia",
    prCreateDate: "2026-09-04",
    approvals: [],
    payments: [
      {
        paymentId: 4,
        paymentStage: "down_payment",
        paymentAmount: 625000000,
        paymentBank: "CIMB NIAGA",
        paymentBankAccountNumber: "6677889900",
        paymentBankAccountName: "MITSUBISHI",
        paymentStatus: "draft",
      },
    ],
  },

  // Submitted
  {
    prId: 5,
    prRfpNumber: "1301-0052026",
    prStatus: "submitted",
    prVendor: "KIA",
    prRequestedAmount: 32500000,
    prDescriptionItem:
      "Office renovation milestone: partitions, lighting, and repainting.",
    prQoutNumber: "QUO-005/IX/2026",
    prPoNumber: "PO-005/IX/2026",
    responsibleName: "DUTA",
    adminName: "Fajar",
    prCreateDate: "2026-09-05",
    approvals: [
      {
        approvalId: 1,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "pending",
        approvalNotes: "",
      },
      {
        approvalId: 2,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "pending",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 5,
        paymentStage: "down_payment",
        paymentAmount: 32500000,
        paymentBank: "BRI",
        paymentBankAccountNumber: "4455667788",
        paymentBankAccountName: "PT KIA PARTNER",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 6,
    prRfpNumber: "1301-0062026",
    prStatus: "submitted",
    prVendor: "SUZUKI",
    prRequestedAmount: 12800000,
    prDescriptionItem:
      "Preventive maintenance and spare parts for operational vehicles.",
    prQoutNumber: "QUO-006/IX/2026",
    prPoNumber: "PO-006/IX/2026",
    responsibleName: "RUAS",
    adminName: "Rama",
    prCreateDate: "2026-09-05",
    approvals: [
      {
        approvalId: 3,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 4,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "pending",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 6,
        paymentStage: "full_payment",
        paymentAmount: 12800000,
        paymentBank: "BCA",
        paymentBankAccountNumber: "7788990011",
        paymentBankAccountName: "PT SUZUKI SERVICE",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 7,
    prRfpNumber: "1301-0072026",
    prStatus: "submitted",
    prVendor: "HYUNDAI",
    prRequestedAmount: 43500000,
    prDescriptionItem:
      "Office facility upgrade: air conditioning, cabling, and furniture.",
    prQoutNumber: "QUO-007/IX/2026",
    prPoNumber: "PO-007/IX/2026",
    responsibleName: "DUTA",
    adminName: "Sinta",
    prCreateDate: "2026-09-06",
    approvals: [
      {
        approvalId: 5,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 6,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 7,
        adminName: "Hendra",
        approvalLevel: 3,
        approvalStatus: "pending",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 7,
        paymentStage: "down_payment",
        paymentAmount: 43500000,
        paymentBank: "BCA",
        paymentBankAccountNumber: "3300114455",
        paymentBankAccountName: "PT HYUNDAI SERVICE",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 8,
    prRfpNumber: "1301-0082026",
    prStatus: "submitted",
    prVendor: "TOYOTA",
    prRequestedAmount: 18600000,
    prDescriptionItem:
      "September fleet service under the annual service agreement.",
    prQoutNumber: "QUO-008/IX/2026",
    prPoNumber: "PO-008/IX/2026",
    responsibleName: "RUAS",
    adminName: "Dimas",
    prCreateDate: "2026-09-06",
    approvals: [
      {
        approvalId: 8,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "pending",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 8,
        paymentStage: "full_payment",
        paymentAmount: 18600000,
        paymentBank: "MANDIRI",
        paymentBankAccountNumber: "2211445566",
        paymentBankAccountName: "PT TOYOTA INDONESIA",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 9,
    prRfpNumber: "1301-0092026",
    prStatus: "submitted",
    prVendor: "HONDA",
    prRequestedAmount: 27500000,
    prDescriptionItem: "Quarterly heavy equipment maintenance contract.",
    prQoutNumber: "QUO-009/IX/2026",
    prPoNumber: "PO-009/IX/2026",
    responsibleName: "DUTA",
    adminName: "Nadia",
    prCreateDate: "2026-09-07",
    approvals: [
      {
        approvalId: 9,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 10,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "pending",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 9,
        paymentStage: "down_payment",
        paymentAmount: 27500000,
        paymentBank: "BNI",
        paymentBankAccountNumber: "3344556677",
        paymentBankAccountName: "PT HONDA PARTNER",
        paymentStatus: "draft",
      },
    ],
  },

  // Approved
  {
    prId: 10,
    prRfpNumber: "1301-0102026",
    prStatus: "approved",
    prVendor: "KIA",
    prRequestedAmount: 62500000,
    prDescriptionItem:
      "Second phase showroom renovation: flooring, glass facade, and rewiring.",
    prQoutNumber: "QUO-010/VIII/2026",
    prPoNumber: "PO-010/VIII/2026",
    responsibleName: "DUTA",
    adminName: "Fajar",
    prCreateDate: "2026-08-28",
    approvals: [
      {
        approvalId: 11,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 12,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "approved",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 10,
        paymentStage: "down_payment",
        paymentAmount: 62500000,
        paymentBank: "BRI",
        paymentBankAccountNumber: "6677001122",
        paymentBankAccountName: "PT KIA PARTNER",
        paymentStatus: "pending",
      },
    ],
  },
  {
    prId: 11,
    prRfpNumber: "1301-0112026",
    prStatus: "approved",
    prVendor: "MITSUBISHI",
    prRequestedAmount: 21500000,
    prDescriptionItem:
      "Compressor and pneumatic system overhaul at the assembly plant.",
    prQoutNumber: "QUO-011/VIII/2026",
    prPoNumber: "PO-011/VIII/2026",
    responsibleName: "RUAS",
    adminName: "Rama",
    prCreateDate: "2026-08-27",
    approvals: [
      {
        approvalId: 13,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 11,
        paymentStage: "full_payment",
        paymentAmount: 21500000,
        paymentBank: "CIMB NIAGA",
        paymentBankAccountNumber: "7766554433",
        paymentBankAccountName: "PT MITSUBISHI PARTNER",
        paymentStatus: "pending",
      },
    ],
  },
  {
    prId: 12,
    prRfpNumber: "1301-0122026",
    prStatus: "approved",
    prVendor: "SUZUKI",
    prRequestedAmount: 47500000,
    prDescriptionItem:
      "Covered parking area and vehicle wash bay construction.",
    prQoutNumber: "QUO-012/VIII/2026",
    prPoNumber: "PO-012/VIII/2026",
    responsibleName: "DUTA",
    adminName: "Sinta",
    prCreateDate: "2026-08-26",
    approvals: [
      {
        approvalId: 14,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 15,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "approved",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 12,
        paymentStage: "down_payment",
        paymentAmount: 23750000,
        paymentBank: "MANDIRI",
        paymentBankAccountNumber: "6655443322",
        paymentBankAccountName: "PT SUZUKI PARTNER",
        paymentStatus: "pending",
      },
    ],
  },
  {
    prId: 13,
    prRfpNumber: "1301-0132026",
    prStatus: "approved",
    prVendor: "HYUNDAI",
    prRequestedAmount: 68000000,
    prDescriptionItem:
      "Electric vehicle charging station network at the headquarters.",
    prQoutNumber: "QUO-013/VIII/2026",
    prPoNumber: "PO-013/VIII/2026",
    responsibleName: "RUAS",
    adminName: "Dimas",
    prCreateDate: "2026-08-25",
    approvals: [
      {
        approvalId: 16,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 17,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 18,
        adminName: "Hendra",
        approvalLevel: 3,
        approvalStatus: "approved",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 13,
        paymentStage: "down_payment",
        paymentAmount: 34000000,
        paymentBank: "BCA",
        paymentBankAccountNumber: "8899112233",
        paymentBankAccountName: "PT HYUNDAI VENDOR",
        paymentStatus: "pending",
      },
    ],
  },

  // Rejected
  {
    prId: 14,
    prRfpNumber: "1301-0142026",
    prStatus: "rejected",
    prVendor: "TOYOTA",
    prRequestedAmount: 31800000,
    prDescriptionItem: "Outsourced technician labor for the service center.",
    prQoutNumber: "QUO-014/VIII/2026",
    prPoNumber: "PO-014/VIII/2026",
    responsibleName: "DUTA",
    adminName: "Nadia",
    prCreateDate: "2026-08-24",
    approvals: [
      {
        approvalId: 19,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "rejected",
        approvalNotes:
          "Invoiced amount does not match the approved quotation and purchase order.",
      },
    ],
    payments: [
      {
        paymentId: 14,
        paymentStage: "full_payment",
        paymentAmount: 31800000,
        paymentBank: "MANDIRI",
        paymentBankAccountNumber: "3030303030",
        paymentBankAccountName: "PT TOYOTA VENDOR",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 15,
    prRfpNumber: "1301-0152026",
    prStatus: "rejected",
    prVendor: "HONDA",
    prRequestedAmount: 39500000,
    prDescriptionItem: "Workshop tooling replacement.",
    prQoutNumber: "QUO-015/VIII/2026",
    prPoNumber: "PO-015/VIII/2026",
    responsibleName: "RUAS",
    adminName: "Fajar",
    prCreateDate: "2026-08-23",
    approvals: [
      {
        approvalId: 20,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 21,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "rejected",
        approvalNotes:
          "Payment document not valid: expired date and vendor legal name mismatch.",
      },
    ],
    payments: [
      {
        paymentId: 15,
        paymentStage: "down_payment",
        paymentAmount: 39500000,
        paymentBank: "BCA",
        paymentBankAccountNumber: "1234123412",
        paymentBankAccountName: "PT HONDA VENDOR",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 16,
    prRfpNumber: "1301-0162026",
    prStatus: "rejected",
    prVendor: "KIA",
    prRequestedAmount: 47000000,
    prDescriptionItem: "Interior finishing work for the new office floor.",
    prQoutNumber: "QUO-016/VIII/2026",
    prPoNumber: "PO-016/VIII/2026",
    responsibleName: "DUTA",
    adminName: "Rama",
    prCreateDate: "2026-08-22",
    approvals: [
      {
        approvalId: 22,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 23,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "rejected",
        approvalNotes:
          "Budget allocation needs correction: cost account does not match the expense.",
      },
    ],
    payments: [
      {
        paymentId: 16,
        paymentStage: "full_payment",
        paymentAmount: 47000000,
        paymentBank: "BRI",
        paymentBankAccountNumber: "4321432143",
        paymentBankAccountName: "PT KIA VENDOR",
        paymentStatus: "draft",
      },
    ],
  },

  // Revision
  {
    prId: 17,
    prRfpNumber: "1301-0172026",
    prStatus: "revision",
    prVendor: "MITSUBISHI",
    prRequestedAmount: 36000000,
    prDescriptionItem: "Warehouse expansion milestone payment.",
    prQoutNumber: "QUO-017/VIII/2026",
    prPoNumber: "PO-017/VIII/2026",
    responsibleName: "RUAS",
    adminName: "Sinta",
    prCreateDate: "2026-08-21",
    approvals: [
      {
        approvalId: 24,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "revision_requested",
        approvalNotes:
          "Progress report lacks site photographs. Please attach them.",
      },
    ],
    payments: [
      {
        paymentId: 17,
        paymentStage: "down_payment",
        paymentAmount: 36000000,
        paymentBank: "CIMB NIAGA",
        paymentBankAccountNumber: "7070707070",
        paymentBankAccountName: "PT MITSUBISHI VENDOR",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 18,
    prRfpNumber: "1301-0182026",
    prStatus: "revision",
    prVendor: "SUZUKI",
    prRequestedAmount: 29000000,
    prDescriptionItem:
      "Marketing event services for the regional sales campaign.",
    prQoutNumber: "QUO-018/VIII/2026",
    prPoNumber: "PO-018/VIII/2026",
    responsibleName: "DUTA",
    adminName: "Dimas",
    prCreateDate: "2026-08-20",
    approvals: [
      {
        approvalId: 25,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 26,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "revision_requested",
        approvalNotes:
          "Attach written management authorization for this event.",
      },
    ],
    payments: [
      {
        paymentId: 18,
        paymentStage: "full_payment",
        paymentAmount: 29000000,
        paymentBank: "MANDIRI",
        paymentBankAccountNumber: "8080808080",
        paymentBankAccountName: "PT SUZUKI VENDOR",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 19,
    prRfpNumber: "1301-0192026",
    prStatus: "revision",
    prVendor: "HYUNDAI",
    prRequestedAmount: 15500000,
    prDescriptionItem: "Annual servicing of backup power generators.",
    prQoutNumber: "QUO-019/VIII/2026",
    prPoNumber: "PO-019/VIII/2026",
    responsibleName: "RUAS",
    adminName: "Nadia",
    prCreateDate: "2026-08-19",
    approvals: [
      {
        approvalId: 27,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "revision_requested",
        approvalNotes:
          "Requested amount is different from the quotation. Please correct it.",
      },
    ],
    payments: [
      {
        paymentId: 19,
        paymentStage: "full_payment",
        paymentAmount: 15500000,
        paymentBank: "BCA",
        paymentBankAccountNumber: "9988001122",
        paymentBankAccountName: "PT HYUNDAI PARTNER",
        paymentStatus: "draft",
      },
    ],
  },

  // Completed
  {
    prId: 20,
    prRfpNumber: "1301-0202026",
    prStatus: "completed",
    prVendor: "TOYOTA",
    prRequestedAmount: 51000000,
    prDescriptionItem:
      "Monthly vehicle maintenance program for the company car pool.",
    prQoutNumber: "QUO-020/VIII/2026",
    prPoNumber: "PO-020/VIII/2026",
    responsibleName: "DUTA",
    adminName: "Fajar",
    prCreateDate: "2026-08-15",
    approvals: [
      {
        approvalId: 28,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 29,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "approved",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 20,
        paymentStage: "full_payment",
        paymentAmount: 51000000,
        paymentBank: "BNI",
        paymentBankAccountNumber: "3344556688",
        paymentBankAccountName: "PT TOYOTA PARTNER",
        paymentStatus: "paid",
      },
    ],
  },
  {
    prId: 21,
    prRfpNumber: "1301-0212026",
    prStatus: "completed",
    prVendor: "HONDA",
    prRequestedAmount: 27500000,
    prDescriptionItem: "Consumable materials for the assembly line.",
    prQoutNumber: "QUO-021/VIII/2026",
    prPoNumber: "PO-021/VIII/2026",
    responsibleName: "RUAS",
    adminName: "Rama",
    prCreateDate: "2026-08-14",
    approvals: [
      {
        approvalId: 30,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 21,
        paymentStage: "full_payment",
        paymentAmount: 27500000,
        paymentBank: "BNI",
        paymentBankAccountNumber: "5566001122",
        paymentBankAccountName: "PT HONDA VENDOR",
        paymentStatus: "paid",
      },
    ],
  },
  {
    prId: 22,
    prRfpNumber: "1301-0222026",
    prStatus: "completed",
    prVendor: "KIA",
    prRequestedAmount: 56500000,
    prDescriptionItem: "Customer experience center project milestone.",
    prQoutNumber: "QUO-022/VIII/2026",
    prPoNumber: "PO-022/VIII/2026",
    responsibleName: "DUTA",
    adminName: "Sinta",
    prCreateDate: "2026-08-13",
    approvals: [
      {
        approvalId: 31,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "approved",
        approvalNotes: "",
      },
      {
        approvalId: 32,
        adminName: "Sari",
        approvalLevel: 2,
        approvalStatus: "approved",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 22,
        paymentStage: "down_payment",
        paymentAmount: 28250000,
        paymentBank: "BRI",
        paymentBankAccountNumber: "9911223344",
        paymentBankAccountName: "PT KIA PARTNER",
        paymentStatus: "paid",
      },
      {
        paymentId: 23,
        paymentStage: "final_payment",
        paymentAmount: 28250000,
        paymentBank: "BRI",
        paymentBankAccountNumber: "9911223344",
        paymentBankAccountName: "PT KIA PARTNER",
        paymentStatus: "paid",
      },
    ],
  },

  // Cancelled
  {
    prId: 23,
    prRfpNumber: "1301-0232026",
    prStatus: "cancelled",
    prVendor: "MITSUBISHI",
    prRequestedAmount: 19500000,
    prDescriptionItem:
      "Calibration and certification of quality control instruments.",
    prQoutNumber: "QUO-023/VIII/2026",
    prPoNumber: "PO-023/VIII/2026",
    responsibleName: "RUAS",
    adminName: "Dimas",
    prCreateDate: "2026-08-10",
    approvals: [],
    payments: [
      {
        paymentId: 24,
        paymentStage: "full_payment",
        paymentAmount: 19500000,
        paymentBank: "CIMB NIAGA",
        paymentBankAccountNumber: "1928374650",
        paymentBankAccountName: "PT MITSUBISHI SERVICES",
        paymentStatus: "draft",
      },
    ],
  },
  {
    prId: 24,
    prRfpNumber: "1301-0242026",
    prStatus: "cancelled",
    prVendor: "SUZUKI",
    prRequestedAmount: 14500000,
    prDescriptionItem:
      "Outsourced security and janitorial services for August.",
    prQoutNumber: "QUO-024/VIII/2026",
    prPoNumber: "PO-024/VIII/2026",
    responsibleName: "DUTA",
    adminName: "Nadia",
    prCreateDate: "2026-08-09",
    approvals: [
      {
        approvalId: 33,
        adminName: "Budi",
        approvalLevel: 1,
        approvalStatus: "pending",
        approvalNotes: "",
      },
    ],
    payments: [
      {
        paymentId: 25,
        paymentStage: "full_payment",
        paymentAmount: 14500000,
        paymentBank: "BCA",
        paymentBankAccountNumber: "1357913579",
        paymentBankAccountName: "PT SUZUKI SERVICES",
        paymentStatus: "draft",
      },
    ],
  },
];

// Responsible options (tidak berubah)
const loadResponsibleOptions = () => {
  if (!isClient) return defaultResponsibleOptions;
  try {
    const raw = localStorage.getItem(RESPONSIBLE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(
    RESPONSIBLE_KEY,
    JSON.stringify(defaultResponsibleOptions),
  );
  return defaultResponsibleOptions;
};

export const responsibleOptions = ref(loadResponsibleOptions());

export const addResponsible = ({ responsible, coa }) => {
  responsibleOptions.value.push({ responsible, coa });
  if (!isClient) return;
  localStorage.setItem(
    RESPONSIBLE_KEY,
    JSON.stringify(responsibleOptions.value),
  );
};

// Payment requests
const load = () => {
  if (!isClient) return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};

export const requests = ref(load());

export const persist = () => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests.value));
};

export const getRequest = (id) =>
  requests.value.find((item) => item.prId === Number(id));

export const nextId = () =>
  Math.max(0, ...requests.value.map((item) => item.prId)) + 1;

export const generateRfpNumber = () =>
  `1301-${String(nextId()).padStart(3, "0")}${new Date().getFullYear()}`;

export const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const date = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

export function useStore() {
  return {
    requests,
    responsibleOptions,
    addResponsible,
    persist,
    getRequest,
    nextId,
    generateRfpNumber,
    money,
    date,
    today,
  };
}
