import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import Settings from "../views/Settings.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/", // パスが "/" のときの設定
    name: "Home", // このルートに "Home"という名前を付ける
    component: Home, // router-view の中に Home コンポーネントを表示する
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
