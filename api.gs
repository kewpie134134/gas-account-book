/** 
 * 紐づいているスプレッドシートを取得する getActive() を利用する
 */
const ss = SpreadsheetApp.getActive()

/**
 * API作成
 * API成功時には何かしらの結果を返し、エラー時は {error: "メッセージ"} を返す仕様とする。
 */

/**
 * データの追加（onPost）と、
 * 入力データのバリデーションチェックを行う isValid を作成する。
 */
function test(){
  onPost({
    item: {
      date: "2020-07-01",
      title: "支出サンプル",
      category: "食費",
      tags: "タグ1, タグ2",
      income: null,
      outgo: 3000,
      memo: "メモメモ"
    }
  })
}

/** --- API --- */

/** 
 * データを追加する
 * @param {Object} params
 * @param {Object} params.item 家計簿データ
 * @returns {Object} 追加したデータ
 */
function onPost ({ item }) {
  if (!isValid(item)) {
    return {
      error: '正しい形式で入力してください'
    }
  }
  const { date, title, category, tags, income, outgo, memo } = item

  // 指定年月のシートを取得する、なかったらテンプレートシートを取得する
  const yearMonth = date.slice(0, 7)
  const sheet = ss.getSheetByName(yearMonth) || insertTemplate(yearMonth)

  // IDは Utilities の getUuid を利用して、UUID の先頭8文字だけ切り取るという謎のプログラムで生成している
  const id = Utilities.getUuid().slice(0, 8)
  // 収支以外は文字列として扱ってほしいため、値の前にシングルクォートを付与してからシートに追加する（ポイント）
  const row = ["'" + id, "'" + date, "'" + title, "'" + category, "'" + tags, income, outgo, "'" + memo]
  sheet.appendRow(row)  // シートには appendRow というメソッドがあり、引数に配列を渡すだけでデータの追加が可能

  return { id, date, title, category, tags, income, outgo, memo }
}

/** --- common --- */
 
/** 
 * 指定年月のテンプレートシートを作成する
 * @param {String} yearMonth
 * @returns {Sheet} sheet
 */
function insertTemplate (yearMonth) {
  const { SOLID_MEDIUM, DOUBLE } = SpreadsheetApp.BorderStyle
  
  /** 
   * insertSheet メソッドは新規シートを作成する。
   * 引数にはシート名とインデックスを指定する。
   * インデックスが 0 ならば、一番左に追加される。
   */
  const sheet = ss.insertSheet(yearMonth, 0)
  const [year, month] = yearMonth.split('-')
  
  /** 
   * セルの操作の流れは、範囲（Range）を取得してから各操作を実行する。
   * シートの getRange メソッドで範囲指定が可能。
   * メソッドチェーンを利用しているため、"."で繰り返し処理を実行できる。
   * 
   * setValue, setValues で、セルに値をセットすることができる。
   * setFormula, setFormulas で、"=" から始まる数式をセットすることができる。
   */
  // 収支確認エリア
  sheet.getRange('A1:B1')
    .merge()
    .setValue(`${year}年 ${parseInt(month)}月`)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBorder(null, null, true, null, null, null, 'black', SOLID_MEDIUM)

  sheet.getRange('A2:A4')
    .setValues([['収入：'], ['支出：'], ['収支差：']])
    .setFontWeight('bold')
    .setHorizontalAlignment('right')

  sheet.getRange('B2:B4')
    .setFormulas([['=SUM(F7:F)'], ['=SUM(G7:G)'], ['=B2-B3']])
    .setNumberFormat('#,##0')

  sheet.getRange('A4:B4')
    .setBorder(true, null, null, null, null, null, 'black', DOUBLE)

  // テーブルヘッダー
  sheet.getRange('A6:H6')
    .setValues([['id', '日付', 'タイトル', 'カテゴリ', 'タグ', '収入', '支出', 'メモ']])
    .setFontWeight('bold')
    .setBorder(null, null, true, null, null, null, 'black', SOLID_MEDIUM)

  sheet.getRange('F7:G')
    .setNumberFormat('#,##0')

  // カテゴリ別支出
  sheet.getRange('J1')
    .setFormula('=QUERY(B7:H, "select D, sum(G), sum(G) / "&B3&"  where G > 0 group by D order by sum(G) desc label D \'カテゴリ\', sum(G) \'支出\'")')
  
  sheet.getRange('J1:L1')
    .setFontWeight('bold')
    .setBorder(null, null, true, null, null, null, 'black', SOLID_MEDIUM)

  sheet.getRange('L1')
    .setFontColor('white')

  sheet.getRange('K2:K')
    .setNumberFormat('#,##0')

  sheet.getRange('L2:L')
    .setNumberFormat('0.0%')

  sheet.setColumnWidth(9, 21)

  return sheet
}

/**
 * データが正しい形式か検証する
 * @param {Object} item
 * @returns {Boolean} isValid
 */
function isValid (item = {}) {
  const strKeys = ["date", "title", "category", "tags", "memo"]
  const keys = [...strKeys, "income", "outgo"]
          
  // すべてのキーが存在するか
  for (const key of keys) {
    if (item[key] === undefined) return false
  }
          
  // 収支以外が文字列であるか
  for (const key of strKeys) {
    if (typeof item[key] !== 'string') return false
  }

  // 日付が正しい形式であるか
  const dateReg = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
  if (!dateReg.test(item.date)) return false

  // 収支のどちらかが入力されているか
  const { income: i, outgo: o } = item
  if ((i === null && o === null) || (i !== null && o !== null)) return false

  // 入力された収支が数字であるか
  if (i !== null && typeof i !== 'number') return false
  if (o !== null && typeof o !== 'number') return false

  return true
}