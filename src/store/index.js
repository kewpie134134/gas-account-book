import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

/**
 * State
 * Vuex の状態
 */
const state = {
  /** 家計簿データ */
  abData: {},
  /** 設定 */
  settings: {
    appName: "GAS 家計簿",
    apiUrl: "",
    authToken: "",
    strIncomeItems: "給料, ボーナス, 繰越",
    strOutgoItems:
      "食費, 趣味, 交通費, 買い物, 交際費, 生活費, 住宅, 通信, 車, 税金",
    strTagItems: "固定費, カード",
  },
};

/**
 * Mutations
 * Actions から State を更新するときに呼ばれる
 */
const mutations = {
  /** 指定年月の家計簿データをセットする */
  setAbData(state, { yearMonth, list }) {
    state.abData[yearMonth] = list;
  },
  /** データを追加する */
  addAbData(state, { item }) {
    const yearMonth = item.date.slice(0, 7);
    const list = state.abData[yearMonth];
    if (list) {
      list.push(item);
    }
  },
  /** 指定年月のデータを更新する */
  updateAbData(state, { yearMonth, item }) {
    const list = state.abData[yearMonth];
    if (list) {
      const index = list.findIndex((v) => v.id === item.id);
      list.splice(index, 1, item);
    }
  },
  /** 指定年月とID のデータを削除する */
  deleteAbData(state, { yearMonth, id }) {
    const list = state.abData[yearMonth];
    if (list) {
      const index = list.findIndex((v) => v.id === id);
      list.splice(index, 1);
    }
  },

  /** 設定を保存する */
  saveSettings(state, { settings }) {
    state.settings = { ...settings };
    document.title = state.settings.appName;

    localStorage.setItem("settings", JSON.stringify(settings));
  },
  /** 設定を読み込む */
  loadSettings(state) {
    const settings = JSON.parse(localStorage.getItem("settings"));
    if (settings) {
      state.settings = Object.assign(state.settings, settings);
    }
    document.title = state.settings.appName;
  },
};

/**
 * Actions
 * 画面から呼ばれ、Mutation をコミットする
 */
const actions = {
  /** 指定年月の家計簿データを取得する */
  fetchAbData({ commit }, { yearMonth }) {
    // サンプルデータを初期値として入れる
    const list = [
      {
        id: "a34109ed",
        date: `${yearMonth}-01`,
        title: "支出サンプル",
        category: "買い物",
        tags: "タグ1",
        income: null,
        outgo: 2000,
        memo: "メモ",
      },
      {
        id: "7c8fa764",
        date: `${yearMonth}-02`,
        title: "収入サンプル",
        category: "給料",
        tags: "タグ1,タグ2",
        income: 2000,
        outgo: null,
        memo: "メモ",
      },
    ];
    commit("setAbData", { yearMonth, list });
  },
  /** データを追加する */
  addAbData({ commit }, { item }) {
    commit("addAbData", { item });
  },
  /** データを更新する */
  updateAbData({ commit }, { beforeYM, item }) {
    const yearMonth = item.date.slice(0, 7);
    // 更新前後で年月の変更が無ければそのまま値を更新
    if (yearMonth === beforeYM) {
      commit("updateAbData", { yearMonth, item });
      return;
    }
    // 更新があれば、更新前年月のデータから削除して、新しくデータを追加する
    const id = item.id;
    commit("deleteAbData", { yearMonth: beforeYM, id });
    commit("addAbData", { item });
  },
  /** データを削除する */
  deleteAbData({ commit }, { item }) {
    const yearMonth = item.date.slice(0, 7);
    const id = item.id;
    commit("deleteAbData", { yearMonth, id });
  },

  /** 設定を保存する */
  saveSettings({ commit }, { settings }) {
    commit("saveSettings", { settings });
  },

  /** 設定を読み込む */
  loadSettings({ commit }) {
    commit("loadSettings");
  },
};

/** カンマ区切りの文字をトリミングして配列にする */
const createItems = (v) =>
  v
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length !== 0);

/**
 * Getters
 * 画面から取得され、State を加工して渡す
 * Vuex版 computedのようなもの。
 */
const getters = {
  /** 収入カテゴリ（配列） */
  incomeItems(state) {
    return createItems(state.settings.strIncomeItems);
  },
  /** 支出カテゴリ（配列） */
  outgoItems(state) {
    return createItems(state.settings.strOutgoItems);
  },
  /** タグ（配列） */
  tagItems(state) {
    return createItems(state.settings.strTagItems);
  },
};

const store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
});

export default store;
