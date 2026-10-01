import { watch, onBeforeUnmount, nextTick } from "vue";
import { Chart } from "chart.js/auto";

/**
 * Mount, update, dan destroy instance Chart.js secara otomatis.
 *
 * Canvas dikontrol oleh v-if/v-else (loading/error/empty state), sehingga
 * elemen <canvas> baru muncul di DOM setelah data selesai di-fetch. Karena
 * itu canvasRef itu sendiri di-watch (bukan hanya configRef) — begitu Vue
 * me-render elemen <canvas> ke DOM, chart otomatis dibuat saat itu juga,
 * tanpa bergantung urutan reactivity antara ref loading & ref data lain.
 *
 * @param {import('vue').Ref<HTMLCanvasElement|null>} canvasRef - template ref elemen <canvas>
 * @param {import('vue').ComputedRef<object>} configRef - computed berisi config Chart.js ({ type, data, options })
 */
export function useChart(canvasRef, configRef) {
  let chartInstance = null;

  function createChart() {
    if (!canvasRef.value) return;
    chartInstance?.destroy();
    chartInstance = new Chart(canvasRef.value, configRef.value);
  }

  function updateChart() {
    if (!chartInstance || !canvasRef.value) {
      createChart();
      return;
    }
    chartInstance.data = configRef.value.data;
    chartInstance.options = configRef.value.options;
    chartInstance.update();
  }

  // Terpicu saat elemen <canvas> muncul/hilang dari DOM (akibat v-if/v-else)
  watch(canvasRef, async (el) => {
    await nextTick();
    if (el) {
      createChart();
    } else {
      chartInstance?.destroy();
      chartInstance = null;
    }
  });

  // Terpicu saat data chart berubah, tapi canvas sudah ada
  watch(configRef, updateChart, { deep: true });

  onBeforeUnmount(() => {
    chartInstance?.destroy();
    chartInstance = null;
  });
}
