import Vue from "vue";
import Vuex from "vuex";

// 作成した API クライアントを使えるようにする
import gasApi from "../api/gasApi";

Vue.use(Vuex);

/**
 * State
 * Vuex の状態
 */
const state = {
  /** 家計簿データ */
  abData: {},

  /** ローディング状態 */
  loading: {
    fetch: false,
    add: false,
    update: false,
    delete: false,
  },

  /** エラーメッセージ */
  errorMessage: "",

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

  /** ローディング状態をセットする */
  setLoading(state, { type, v }) {
    state.loading[type] = v;
  },

  /** エラーメッセージをセットする */
  setErrorMessage(state, { message }) {
    state.errorMessage = message;
  },

  /**
   * 設定を保存する
   * 内部で、アプリ設定の apiUrl, authToken を gasApiに反映させる
   */
  saveSettings(state, { settings }) {
    state.settings = { ...settings };
    const { appName, apiUrl, authToken } = state.settings;
    document.title = appName;
    gasApi.setUrl(apiUrl);
    gasApi.setAuthToken(authToken);
    // 家計簿データを初期化
    state.abData = {};

    localStorage.setItem("settings", JSON.stringify(settings));
  },

  /**
   * 設定を読み込む
   * 内部で、アプリ設定の apiUrl, authToken を gasApiに反映させる
   */
  loadSettings(state) {
    const settings = JSON.parse(localStorage.getItem("settings"));
    if (settings) {
      state.settings = Object.assign(state.settings, settings);
    }
    const { appName, apiUrl, authToken } = state.settings;
    document.title = appName;
    gasApi.setUrl(apiUrl);
    gasApi.setAuthToken(authToken);
  },
};

/**
 * Actions
 * 画面から呼ばれ、Mutation をコミットする
 */
const actions = {
  /** 指定年月の家計簿データを取得する */
  async fetchAbData({ commit }, { yearMonth }) {
    const type = "fetch";
    // 取得の前にローディングを true にする
    commit("setLoading", { type, v: true });
    try {
      // API にリクエスト送信
      const res = await gasApi.fetch(yearMonth);
      // 取得できたら abDataにセットする
      commit("setAbData", { yearMonth, list: res.data });
    } catch (e) {
      // エラーが起きたらメッセージをセットする
      commit("setErrorMessage", { message: e });
      // 空の配列を abData にセットする
      commit("setAbData", { yearMonth, list: [] });
    } finally {
      // 最後に成功/失敗にかかわらず、ローディングを false にする
      commit("setLoading", { type, v: false });
    }
  },

  /** データを追加する */
  async addAbData({ commit }, { item }) {
    const type = "add";
    commit("setLoading", { type, v: true });
    try {
      const res = await gasApi.add(item);
      commit("addAbData", { item: res.data });
    } catch (e) {
      commit("setErrorMessage", { message: e });
    } finally {
      commit("setLoading", { type, v: false });
    }
  },

  /** データを更新する */
  async updateAbData({ commit }, { beforeYM, item }) {
    const type = "update";
    const yearMonth = item.date.slice(0, 7);
    commit("setLoading", { type, v: true });
    try {
      const res = await gasApi.update(beforeYM, item);
      // 更新前後で年月の変更が無ければそのまま値を更新
      if (yearMonth === beforeYM) {
        commit("updateAbData", { yearMonth, item });
        return;
      }
      const id = item.id;
      commit("deleteAbData", { yearMonth: beforeYM, id });
      commit("addAbData", { item: res.data });
    } catch (e) {
      commit("setErrorMessage", { message: e });
    } finally {
      commit("setLoading", { type, v: false });
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
