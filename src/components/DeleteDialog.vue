<template>
  <!-- 削除ダイアログ -->
  <v-dialog v-model="show" persistent max-width="290px">
    <v-card>
      <v-card-title />
      <v-card-text class="black--text">
        「{{ item.title }}」を削除しますか？
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" text :disabled="loading" @click="onClickClose"
          >キャンセル</v-btn
        >
        <v-btn color="red" text :loading="loading" @click="onClickDelete"
          >削除</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  name: "DeleteDialog",

  data() {
    return {
      /** ダイアログの表示状態 */
      show: false,
      /** 受け取ったデータ */
      item: {},
    };
  },

  computed: mapState({
    /** ローディング状態 */
    loading: (state) => state.loading.delete,
  }),

  methods: {
    ...mapActions(["deleteAbData"]),

    /**
     * ダイアログを表示する。
     * このメソッドは親から呼び出される。
     */
    open(item) {
      this.show = true;
      this.item = item;
    },
    /** キャンセルがクリックされた時 */
    onClickClose() {
      this.show = false;
    },
    /** 削除がクリックされた時 */
    async onClickDelete() {
      await this.deleteAbData({ item: this.item });
      this.show = false;
    },
  },
};
</script>
