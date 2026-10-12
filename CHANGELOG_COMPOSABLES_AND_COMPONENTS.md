# Changelog: Components and Composables

Dokumentasi perubahan struktur folder, penamaan file, dan pembagian tanggung jawab komponen serta composables pada fitur Payment Request.

## 1. Components

Direktori utama: `components/paymentRequest/`

### 1.1. Base Components

Folder `badge/`, `button/`, dan `input/` direorganisasi ke dalam `base/` untuk mengelompokkan komponen UI dasar berdasarkan peran dan fungsinya.

#### Badge

| Previous Path      | New Path               |
| ------------------ | ---------------------- |
| `badge/Label.vue`  | `base/BadgeLabel.vue`  |
| `badge/Status.vue` | `base/BadgeStatus.vue` |

#### Button

| Previous Path            | New Path                |
| ------------------------ | ----------------------- |
| `button/Action.vue`      | `base/ButtonAction.vue` |
| `button/Create.vue`      | `base/ButtonCreate.vue` |
| `button/Draft.vue`       | `base/ButtonDraft.vue`  |
| `button/ExportExcel.vue` | `base/ButtonExcel.vue`  |
| `button/ExportWord.vue`  | `base/ButtonWord.vue`   |
| `button/Sort.vue`        | `base/ButtonSort.vue`   |
| `button/Submit.vue`      | `base/ButtonSubmit.vue` |

#### Input

| Previous Path             | New Path                      |
| ------------------------- | ----------------------------- |
| `input/Date.vue`          | `base/InputDate.vue`          |
| `input/PaymentMethod.vue` | `base/InputRequestMethod.vue` |
| `input/PaymentStage.vue`  | `base/InputRequestStage.vue`  |
| `input/Search.vue`        | `base/InputSearch.vue`        |
| `input/Suggest.vue`       | `overlay/ModalSuggest.vue`    |

### 1.2. Panel Components

Folder `display/` dan `tab/` direorganisasi ke dalam `panel/` untuk mengelompokkan komponen yang menyajikan konten, informasi, atau bagian tertentu dari halaman.

#### Display

| Previous Path                   | New Path                        |
| ------------------------------- | ------------------------------- |
| `display/Attachments.vue`       | `panel/DisplayAttachment.vue`   |
| `display/CancelRequestList.vue` | `panel/DisplayCancellation.vue` |
| `display/Comments.vue`          | `panel/DisplayComment.vue`      |
| `display/Data.vue`              | `panel/DisplayCard.vue`         |
| `display/Document.vue`          | `panel/DisplayDocument.vue`     |
| `display/PaymentsPanel.vue`     | `panel/DisplayPayment.vue`      |
| `display/StatusHistory.vue`     | `panel/DisplayHistory.vue`      |

#### Tab

| Previous Path     | New Path                         |
| ----------------- | -------------------------------- |
| `tab/Segment.vue` | `panel/DisplayTab.vue`           |
| `tab/Detail.vue`  | Not present in the new structure |

### 1.3. Overlay Components

Folder `modal/` direorganisasi ke dalam `overlay/` untuk mengelompokkan komponen yang menyediakan antarmuka interaksi di atas konten utama, seperti modal, dialog, dan elemen interaktif sementara.

| Previous Path             | New Path                         |
| ------------------------- | -------------------------------- |
| `modal/Assign.vue`        | `overlay/ModalAssign.vue`        |
| `modal/BulkResult.vue`    | `overlay/ModalResult.vue`        |
| `modal/Cancel.vue`        | `overlay/ModalCancel.vue`        |
| `modal/CancelPayment.vue` | `overlay/ModalCancelPayment.vue` |
| `modal/CancelRequest.vue` | `overlay/ModalCancelRequest.vue` |
| `modal/Dropdown.vue`      | `overlay/ModalDropdown.vue`      |
| `modal/EditAmounts.vue`   | `overlay/ModalAmounts.vue`       |
| `modal/ExportExcel.vue`   | `overlay/ModalExcel.vue`         |
| `modal/Handler.vue`       | `overlay/ModalHandler.vue`       |
| `modal/RecordPayment.vue` | `overlay/ModalPayment.vue`       |
| `modal/Reject.vue`        | `overlay/ModalReject.vue`        |
| `modal/ReviewCancel.vue`  | `overlay/ModalCancelReview.vue`  |
| `modal/Signature.vue`     | `overlay/ModalSignature.vue`     |
| `modal/SubmitPR.vue`      | `overlay/ModalSubmit.vue`        |

### 1.4. Component Responsibilities

Pembagian direktori baru mengikuti tiga kategori utama:

- **`base/`** — Komponen UI dasar dengan fungsi spesifik yang dapat digunakan kembali, seperti badge, tombol, dan input.
- **`overlay/`** — Komponen untuk interaksi sementara yang ditampilkan di atas atau terpisah dari konten utama, seperti modal dan dialog.
- **`panel/`** — Komponen yang menyajikan atau mengelompokkan konten dan informasi sebagai bagian dari halaman.

Pembagian ini bertujuan memperjelas peran setiap komponen, menyederhanakan navigasi direktori, dan menjaga konsistensi penamaan file.

---

## 2. Composables

Direktori utama: `composables/paymentRequest/`

Struktur composables direorganisasi untuk memisahkan tanggung jawab berdasarkan fungsi fitur. Beberapa file diganti namanya, sedangkan file lainnya direstrukturisasi, digabungkan, atau dipecah ke dalam composables yang lebih spesifik.

### 2.1. Renamed Composables

| Previous File         | New File       |
| --------------------- | -------------- |
| `usePRList.js`        | `useList.js`   |
| `useRequestLookup.js` | `useLookup.js` |

Perubahan nama dilakukan untuk menyederhanakan penamaan dan menyelaraskannya dengan tanggung jawab composable masing-masing.

### 2.2. Restructured Composables

#### `useCard.js`

Fungsi-fungsi yang sebelumnya dikelola dalam `useCard.js` direstrukturisasi ke composables yang lebih spesifik:

- `useDetail.js` — Fungsi terkait detail data.
- `useActivity.js` — Fungsi terkait aktivitas.
- `useDocument.js` — Fungsi terkait dokumen.
- `usePayment.js` — Fungsi terkait pembayaran.

#### `useDownload.js`

Fungsi pengunduhan dan pengelolaan dokumen direstrukturisasi ke:

- `useDocument.js`
- `useExport.js`

Pembagian fungsi mengikuti tanggung jawab masing-masing composable.

#### `useStore.js`

State dan fungsi yang berkaitan dengan pengelolaan daftar direstrukturisasi ke `useList.js`.

#### `useFilter.js`

Fungsi daftar dan pemfilteran data direstrukturisasi ke `useList.js` untuk mengelompokkan logika yang berkaitan dengan pengelolaan daftar.

#### `useData.js`

Fungsi pengelolaan data didistribusikan ke composables terkait sesuai dengan tanggung jawab masing-masing.

#### `useCreate.js`

Fungsi pembuatan dan pengajuan data direstrukturisasi ke composables terkait, termasuk `useApproval.js` untuk fungsi yang berkaitan dengan proses pengajuan atau persetujuan.

#### `useStatus.js`

Fungsi pengelolaan status direstrukturisasi ke composables terkait sesuai dengan tanggung jawab masing-masing.

#### `useApproval.js`

`useApproval.js` menampung fungsi terkait proses persetujuan (_approval_) serta lookup yang sebelumnya dikelola secara terpisah.
