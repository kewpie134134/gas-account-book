/**
 * 次のリクエストを送れるようにする
 * {
 *   method: "GET or POST or PUT or DELETE",
 *   authToken: "認証情報",
 *   params: {
 *     // 任意の処理の引数となるデータ
 *   }
 * }
 */

import axios from "axios";

// 最初に、共通のヘッダーを設定した axios のインスタンス作成
// インスタンス作成後は、get, post, put, delete などのメソッドが利用可能となる
const gasApi = axios.create({
  headers: { "content-type": "application/x-www-form-urlencode" },
});

/** response 共通処理 */
// response の内容に error が含まれていたら reject する
// "interceptors" を利用するとリクエスト時、レスポンス時の共通処理を設定することができる（ポイント）
gasApi.interceptors.response.use(
  (res) => {
    if (res.data.error) {
      return Promise.reject(res.data.error);
    }
    return Promise.resolve(res);
  },
  (err) => {
    return Promise.reject(err);
  }
);

/**
 * API の URL を設定する
 * @param {String} url
 */
const setUrl = (url) => {
  gasApi.defaults.baseURL = url;
};

/**
 * authToken を設定する
 * @param {String} token
 */
let authToken = "";
const setAuthToken = (token) => {
  authToken = token;
};

/**
 * 指定年月のデータを取得する
 * @param {String} yearMonth
 * @returns {Promise}
 */
const fetch = (yearMonth) => {
  return gasApi.post("", {
    method: "GET",
    authToken,
    params: {
      yearMonth,
    },
  });
};

/**
 * データを追加する
 * @param {Object} item
 * @returns {Promise}
 */
const add = (item) => {
  return gasApi.post("", {
    method: "POST",
    authToken,
    params: {
      item,
    },
  });
};

/**
 * 指定年月 & id のデータを削除する
 * @param {String} yearMonth
 * @param {String} id
 * @returns {Promise}
 */
const $delete = (yearMonth, id) => {
  return gasApi.post("", {
    method: "DELETE",
    authToken,
    params: {
      yearMonth,
      id,
    },
  });
};

/**
 * データを更新する
 * @param {String} beforeYM
 * @param {Object} item
 * @returns {Promise}
 */
const update = (beforeYM, item) => {
  return gasApi.post("", {
    method: "PUT",
    authToken,
    params: {
      beforeYM,
      item,
    },
  });
};

export default {
  setUrl,
  setAuthToken,
  fetch,
  add,
  delete: $delete,
  update,
};
