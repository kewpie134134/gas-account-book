<template>
  <div class="form-wrapper">
    <p>設定はこのデバイスのみに保存されます。</p>
    <v-form v-model="valid">
      <h3>アプリ設定</h3>
      <!-- アプリ名 -->
      <v-text-field
        label="アプリ名"
        v-model="settings.appName"
        :counter="30"
        :rules="[appNameRule]"
      />
      <!-- API URL -->
      <v-text-field
        label="API URL"
        v-model="settings.apiUrl"
        :counter="150"
        :rules="[stringRule]"
      />
      <!-- Auth Token -->
      <v-text-field
        label="Auth Token"
        v-model="settings.authToken"
        :counter="150"
        :rules="[stringRule]"
      />
      <h3>カテゴリ/タグ設定</h3>
      <p>カンマ（ &#44; ）区切りで入力してください。</p>
      <!-- 収入カテゴリ -->
      <!-- スプレッド構文 (...) を使用 -->
      <!-- 収入カテゴリは不要なため、v-if で非表示とする -->
      <template v-if="showIncomeCategory">
        <v-text-field
          label="収入カテゴリ"
          v-model="settings.strIncomeItems"
          :counter="150"
          :rules="[stringRule, ...categoryRules]"
        />
      </template>
      <!-- 支出カテゴリ -->
      <v-text-field
        label="支出カテゴリ"
        v-model="settings.strOutgoItems"
        :counter="150"
        :rules="[stringRule, ...categoryRules]"
      />
      <!-- タグ -->
      <v-text-field
        label="タグ"
        v-model="settings.strTagItems"
        :counter="150"
        :rules="[stringRule, tagRule]"
      />
      <v-row class="mt-4">
        <v-spacer />
        <v-btn
          color="primary"
          :disabled="!valid || !changedSettings"
          @click="onClickSave"
          >保存</v-btn
        >
      </v-row>
      <v-card-text>{{ verName }}</v-card-text>
    </v-form>

    <!-- 設定保存時のスナックバー -->
    <v-snackbar v-model="snackbar" color="success" timeout="3000"
      >設定を保存しました</v-snackbar
    >
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Settings",

  data() {
    const createItems = (v) =>
      v
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length !== 0);
    const itemMaxLength = (v) =>
      createItems(v).reduce((a, c) => Math.max(a, c.length), 0);

    return {
      /** 入力したデータが有効かどうか */
      valid: false,

      /** 設定保存時のスナックバーの表示フラグ */
      snackbar: false,

      /** 設定内容が変わったかどうか */
      changedSettings: false,

      /** 収入項目を表示するかどうか */
      showIncomeCategory: false,

      /**
       * 設定（Vuexのstateから値を取得）
       * 各コンポーネントでストアには $store でアクセス可能。
       * $store から state や getters にアクセス可能。
       *
       * [注意]
       * フォームの内容を書き換えるのと同時に State も書き換わると困るので、
       * 一度 settings の内容をコピーして使用している。
       */
      settings: { ...this.$store.state.settings },

      /** バリデーションルール */
      appNameRule: (v) => v.length <= 30 || "30文字以内で入力してください",
      stringRule: (v) => v.length <= 150 || "150文字以内で入力してください",
      categoryRules: [
        (v) => createItems(v).length !== 0 || "カテゴリは1つ以上必要です",
        (v) =>
          itemMaxLength(v) <= 4 || "各カテゴリは4文字以内で入力してください",
      ],
      tagRule: (v) =>
        itemMaxLength(v) <= 4 || "各タグは4文字以内で入力してください",
    };
  },

  computed: mapState({
    verName: (state) => state.version.verName,
  }),

  methods: {
    /** 保存ボタンがクリックされた時 */
    onClickSave() {
      /**
       * Actions は dispatch メソッドで実行可能。
       * （例）
       * dispatch("Action名", ペイロード)
       */
      this.$store.dispatch("saveSettings", { settings: this.settings });
      /** 設定が保存されたらスナックバーを表示させる */
      this.snackbar = true;
    },
  },

  watch: {
    /**
     * settings のオブジェクトを監視する
     * オプション "deep" を使用することで、オブジェクト内の要素に変更があったことを watch できる
     */
    settings: {
      handler() {
        // オブジェクトを文字列に変換し、オブジェクト内の要素を比較する
        if (
          JSON.stringify(this.settings) ===
          JSON.stringify({ ...this.$store.state.settings })
        ) {
          this.changedSettings = false;
          return;
        }
        this.changedSettings = true;
      },
      deep: true,
    },
  },
};
</script>

<style>
.form-wrapper {
  max-width: 500px;
  margin: auto;
}
</style>
