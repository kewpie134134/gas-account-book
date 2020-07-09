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
  </v-app>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "App",

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
  }),

  // App インスタンス生成前に一度だけ実行される
  beforeCreate() {
    this.$store.dispatch("localSettings");
  },
};
</script>
