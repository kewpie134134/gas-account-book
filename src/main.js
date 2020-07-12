import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import firebase from "firebase";

Vue.config.productionTip = false;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcRikqmKWelEhSwfaB6whvxD7nuGAKmjg",
  authDomain: "gas-account-book.firebaseapp.com",
  databaseURL: "https://gas-account-book.firebaseio.com",
  projectId: "gas-account-book",
  storageBucket: "gas-account-book.appspot.com",
  messagingSenderId: "143085539083",
  appId: "1:143085539083:web:ef635dbb6bddbcb4191c0e",
  measurementId: "G-Y6CNTECVN0",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
