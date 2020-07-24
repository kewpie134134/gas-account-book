<template>
  <div>
    <v-card>
      <v-card-title>
        <!-- 月選択 -->
        <v-col cols="8" sm="3">
          <v-menu
            ref="menu"
            v-model="menu"
            :close-on-content-click="false"
            :return-value.sync="yearMonth"
            transition="scale-transition"
            offset-y
            max-width="290px"
            min-width="290px"
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                v-model="yearMonth"
                prepend-icon="mdi-calendar"
                readonly
                v-on="on"
                hide-details
              />
            </template>
            <v-date-picker
              v-model="yearMonth"
              type="month"
              color="green"
              locale="ja-jp"
              no-title
              scrollable
            >
              <v-spacer />
              <v-btn text color="grey" @click="menu = false">キャンセル</v-btn>
              <v-btn text color="primary" @click="onSelectMonth">選択</v-btn>
            </v-date-picker>
          </v-menu>
        </v-col>
        <v-spacer />
        <!-- 追加ボタン -->
        <v-col class="text-right" cols="4">
          <v-btn dark color="green" @click="onClickAdd">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </v-col>

        <!-- 収支総計 -->
        <v-col class="overflow-x-auto" cols="12" sm="8">
          <div class="summary">
            <div class="mr-4">
              <table class="text-right">
                <template v-if="showIncomeData">
                  <tr>
                    <td>収入：</td>
                    <td>{{ separate(sum.income) }}</td>
                  </tr>
                </template>
                <tr>
                  <td>支出：</td>
                  <td>{{ separate(sum.outgo) }}</td>
                </tr>
                <template v-if="showIncomeData">
                  <tr>
                    <td>収支差：</td>
                    <td>{{ separate(sum.income - sum.outgo) }}</td>
                  </tr>
                </template>
              </table>
            </div>
            <div v-for="category in sum.categories" :key="category[0]">
              <v-progress-circular
                class="mr-2"
                :rotate="-90"
                :size="60"
                :width="5"
                :value="category[1]"
                color="teal"
              >
                {{ category[0] }}
              </v-progress-circular>
            </div>
          </div>
        </v-col>

        <!-- 検索フォーム -->
        <!-- v-model で入力したデータを this.search と同期する -->
        <!-- append-iconは検索アイコン、single-line は1行のみ記入可能 -->
        <!-- hide-details は文字カウントなどを非表示にする -->
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
          />
        </v-col>
      </v-card-title>
      <!-- テーブル -->
      <!-- class="text-no-wrap" は文字を折り返さないようにするクラス -->
      <!-- :header はヘッダー設定 -->
      <!-- :items はテーブルに表示するデータ -->
      <!-- :search は検索する文字列 -->
      <!-- :footer-props はフッター設定 -->
      <!-- :loading はローディング状態 -->
      <!-- :sord-by はソート初期設定（列名） -->
      <!-- :sord-desc はソート初期設定（昇順） -->
      <!-- :items-per-page はテーブルに最大何件表示させるか -->
      <!-- mobile-breakpoint はモバイル表示にさせる画面サイズ（今回はモバイル表示させたくないので、0 を設定） -->
      <v-data-table
        class="text-no-wrap"
        :headers="tableHeaders"
        :items="tableData"
        :search="search"
        :footer-props="footerProps"
        :loading="loading"
        :sort-by="'date'"
        :sort-desc="false"
        :items-per-page="30"
        mobile-breakpoint="0"
      >
        <!-- Vuetify の決まり事で、v-data-table 内の template で v-slot:item.列名="{ item }" -->
        <!-- とすると、その列のデータを加工することができる -->

        <!-- 日付列 -->
        <template v-slot:item.date="{ item }">
          <!-- この中で、日付は item.date でアクセスできる -->
          <!-- "2020-06-01" ⇒ "1日" に加工 -->
          {{ parseInt(item.date.slice(-2)) + "日" }}
        </template>
        <!-- タグ列 -->
        <template v-slot:item.tags="{ item }">
          <div v-if="item.tags">
            <v-chip
              class="mr-2"
              v-for="(tag, i) in item.tags.split(',')"
              :key="i"
            >
              {{ tag }}
            </v-chip>
          </div>
        </template>
        <!-- 収入列 -->
        <template v-slot:item.income="{ item }">
          {{ separate(item.income) }}
        </template>
        <!-- 支出列 -->
        <template v-slot:item.outgo="{ item }">
          {{ separate(item.outgo) }}
        </template>
        <!-- 操作列 -->
        <template v-slot:item.actions="{ item }">
          <v-icon class="mr-2" @click="onClickEdit(item)">mdi-pencil</v-icon>
          <v-icon @click="onClickDelete(item)">mdi-delete</v-icon>
        </template>
      </v-data-table>
    </v-card>
    <!-- 追加/編集ダイアログ -->
    <!-- コンポーネントの子要素には "ref" 属性をつけると、 -->
    <!-- this.$refs.名前 でアクセスすることが可能 -->
    <ItemDialog ref="itemDialog" />
    <!-- 削除ダイアログ -->
    <DeleteDialog ref="deleteDialog" />
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";

import ItemDialog from "../components/ItemDialog.vue";
import DeleteDialog from "../components/DeleteDialog.vue";

export default {
  name: "Home",
  components: {
    ItemDialog,
    DeleteDialog,
  },

  data() {
    const today = new Date();
    const year = today.getFullYear();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);

    return {
      /** 月選択メニューの状態 */
      menu: false,
      /** 検索文字 */
      search: "",
      /** 選択年月 */
      yearMonth: `${year}-${month}`,
      /** テーブルに表示させるデータ */
      tableData: [],
      /** 収入項目を表示するかどうか */
      showIncomeData: false,
    };
  },
  computed: {
    ...mapState({
      /** 家計簿データ */
      abData: (state) => state.abData,
      /** ローディング状態 */
      loading: (state) => state.loading.fetch,
    }),

    /** テーブルヘッダー設定
     * text には表示させる列名、value には表示させるデータ（data()）のキーを設定。
     * align でテキストの寄せる方向、sortable で疎とか日を設定可能。
     *
     * this.showIncomeData で、フラグ調整
     * true => 収入表示、false => 収入非表示(デフォルト)
     */
    tableHeaders() {
      let tableHeaderItems = [];
      if (!this.showIncomeData) {
        tableHeaderItems = [
          { text: "日付", value: "date", align: "end" },
          { text: "タイトル", value: "title", sortable: false },
          { text: "カテゴリ", value: "category", sortable: false },
          { text: "タグ", value: "tags", sortable: false },
          { text: "支出", value: "outgo", align: "end" },
          { text: "メモ", value: "memo", sortable: false },
          { text: "操作", value: "actions", sortable: false },
        ];
        return tableHeaderItems;
      } else {
        tableHeaderItems = [
          { text: "日付", value: "date", align: "end" },
          { text: "タイトル", value: "title", sortable: false },
          { text: "カテゴリ", value: "category", sortable: false },
          { text: "タグ", value: "tags", sortable: false },
          { text: "収入", value: "income", align: "end" },
          { text: "支出", value: "outgo", align: "end" },
          { text: "メモ", value: "memo", sortable: false },
          { text: "操作", value: "actions", sortable: false },
        ];
        return tableHeaderItems;
      }
    },

    /** テーブルのフッター設定 */
    footerProps() {
      return { itemsPerPageText: "", itemsPerPageOptions: [] };
    },

    /** 収支総計 */
    sum() {
      let income = 0;
      let outgo = 0;
      const categoryOutgo = {};
      const categories = [];
      // 収支の合計とカテゴリ別の支出を計算
      for (const row of this.tableData) {
        if (row.income !== null) {
          income += row.income;
        } else {
          outgo += row.outgo;
          if (categoryOutgo[row.category]) {
            categoryOutgo[row.category] += row.outgo;
          } else {
            categoryOutgo[row.category] = row.outgo;
          }
        }
      }
      // カテゴリ別の支出を降順にソート
      const sorted = Object.entries(categoryOutgo).sort((a, b) => b[1] - a[1]);
      for (const [category, value] of sorted) {
        const percent = parseInt((value / outgo) * 100);
        categories.push([category, percent]);
      }
      return {
        income,
        outgo,
        categories,
      };
    },
  },
  methods: {
    ...mapActions([
      /** 家計簿データを取得
       *
       * [スプレッド構文を使った意味]
       * this.$store.dispatch("fetchAbData")を、this.fetchAbData として使えるようにする。
       */
      "fetchAbData",
    ]),

    /** 表示させるデータを更新する */
    async updateTable() {
      const yearMonth = this.yearMonth;
      const list = this.abData[yearMonth];

      if (list) {
        this.tableData = list;
      } else {
        await this.fetchAbData({ yearMonth });
        this.tableData = this.abData[yearMonth];
      }
    },

    /** 月選択ボタンがクリックされた時 */
    onSelectMonth() {
      this.$refs.menu.save(this.yearMonth);
      this.updateTable();
    },

    /**
     * 数字を3桁区切りにして返す。
     * 受け取った数が null の場合は null を返す。
     */
    separate(num) {
      return num !== null
        ? num.toString().replace(/(\d)(?=(\d{3})+$)/g, "$1,")
        : null;
    },
    /** 追加ボタンがクリックされた時 */
    onClickAdd(item) {
      this.$refs.itemDialog.open("add", item);
    },
    /** 編集ボタンがクリックされた時 */
    onClickEdit(item) {
      this.$refs.itemDialog.open("edit", item);
    },
    /** 削除ボタンがクリックされた時 */
    onClickDelete(item) {
      this.$refs.deleteDialog.open(item);
    },
  },
  created() {
    this.updateTable();
  },
};
</script>

<style>
.summary {
  display: flex;
  font-size: 0.8rem;
  white-space: nowrap;
  line-height: 1.2rem;
}
</style>
