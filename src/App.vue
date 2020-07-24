<template>
  <v-app>
    <!-- ツールバー -->
    <v-app-bar app color="green" dark>
      <!-- タイトル -->
      <v-toolbar-title>{{ appName }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- テーブルのアイコンのボタン -->
      <v-btn icon to="/">
        <!-- クリックで "/" へ移動する -->
        <v-icon>mdi-file-table-outline</v-icon>
      </v-btn>
      <!-- 年次カレンダーのボタン -->
      <v-btn icon to="/summary">
        <v-icon>mdi-calendar-month</v-icon>
      </v-btn>
      <!-- 歯車アイコンのボタン -->
      <v-btn icon to="/settings">
        <!-- クリックで "/settings" へ移動する -->
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- メインコンテンツ -->
    <v-main>
      <v-container fluid>
        <!-- router-view の中身がパスによって切り替わる -->
        <router-view></router-view>
      </v-container>
    </v-main>
    <!-- スナックバー -->
    <!-- 通信でエラーが起きたときにメッセージを表示させる -->
    <v-snackbar v-model="snackbar" color="error">{{ errorMessage }}</v-snackbar>
  </v-app>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "App",

  data() {
    return {
      snackbar: false,
    };
  },

  /**
   * mapState を使うとStateのアクセスを簡潔にできる
   *
   * （例）
   * // mapState を使わないと…
   * this.$store.state.settings.appName // 長い

   * // mapState を使うと…
   * this.appName // 短い
   */
  computed: mapState({
    appName: (state) => state.settings.appName,
    errorMessage: (state) => state.errorMessage,
  }),

  /**
   * watch で errorMessage を監視して、変更の合ったタイミングでスナックバーを表示させる
   * スナックバーは一定時間経過すると自動で消える
   */
  watch: {
    // errorMessage に変更があったら
    errorMessage() {
      // スナックバーを表示
      this.snackbar = true;
    },
  },

  // App インスタンス生成前に一度だけ実行される
  beforeCreate() {
    this.$store.dispatch("loadSettings");
  },
};
</script>
