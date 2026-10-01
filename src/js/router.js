// src/js/router.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/auth/Login.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: () => import("../views/auth/ResetPassword.vue"),
  },
  {
    path: "/activate",
    name: "activate",
    component: () => import("../views/auth/ResetPassword.vue"),
  },
  {
    path: "/",
    component: () => import("../layouts/Layout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/dashboard" },
      {
        path: "/dashboard",
        name: "dashboard",
        component: () => import("../views/dashboard/Dashboard.vue"),
      },
      {
        path: "/profile",
        name: "Profile",
        component: () => import("@/views/auth/Profile.vue"),
      },
      {
        path: "/admin/list",
        name: "admin",
        component: () => import("../views/admin/Admin.vue"),
      },
      {
        path: "/admin/roles",
        name: "role",
        component: () => import("../views/admin/Role.vue"),
      },
      {
        path: "/admin/divisions",
        name: "division",
        component: () => import("@/views/admin/Division.vue"),
      },
      {
        path: "/admin/access",
        name: "access-list",
        component: () => import("@/views/admin/Access.vue"),
      },
      {
        path: "/region",
        name: "region",
        component: () => import("@/views/region/Region.vue"),
      },
      {
        path: "/client",
        name: "client",
        component: () => import("@/views/client/Client.vue"),
      },
      {
        path: "/control/unit",
        name: "unit",
        component: () => import("@/views/control/Unit.vue"),
      },
      {
        path: "/control/ppn",
        name: "ppn",
        component: () => import("@/views/control/PPN.vue"),
      },
      {
        path: "/po",
        name: "purchase-order",
        component: () => import("@/views/po/PO.vue"),
      },
      {
        path: "/po/create",
        name: "purchase-order-create",
        component: () => import("@/views/po/CreatePO.vue"),
      },
      {
        path: "/po/:id",
        name: "purchase-order-detail",
        component: () => import("@/views/po/DetailPO.vue"),
      },
      {
        path: "/report",
        name: "report",
        component: () => import("@/views/report/Report.vue"),
      },
      {
        path: "/payment-request/overview",
        name: "payment-request-overview",
        component: () => import("@/views/paymentRequest/Overview.vue"),
      },
      {
        path: "/payment-request/report",
        name: "payment-request-report",
        component: () => import("@/views/paymentRequest/Report.vue"),
      },
      {
        path: "/payment-request/form",
        name: "payment-request-form",
        component: () => import("@/views/paymentRequest/Form.vue"),
      },
      {
        path: "/payment-request/:id",
        name: "payment-request-detail",
        component: () => import("@/views/paymentRequest/Detail.vue"),
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.sessionRestored) {
    await authStore.restoreSession();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;
