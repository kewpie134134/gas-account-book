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
      <v-text-field
        label="収入カテゴリ"
        v-model="settings.strIncomeItems"
        :counter="150"
        :rules="[stringRule, ...categoryRules]"
      />
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
        <v-btn color="primary" :disabled="!valid" @click="onClickSave"
          >保存</v-btn
        >
      </v-row>
    </v-form>
  </div>
</template>

<script>
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

  methods: {
    /** 保存ボタンがクリックされた時 */
    onClickSave() {
      /**
       * Actions は dispatch メソッドで実行可能。
       * （例）
       * dispatch("Action名", ペイロード)
       */
      this.$store.dispatch("saveSettings", { settings: this.settings });
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
