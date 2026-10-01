import { createApp } from "vue";
import { createPinia } from "pinia";
import { Icon } from "@iconify/vue";
import App from "../App.vue";
import router from "./router";
import "../css/style.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.component("Icon", Icon);

app.mount("#app");
