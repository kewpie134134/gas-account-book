/** 
 * 紐づいているスプレッドシートを取得する getActive() を利用する
 */
const ss = SpreadsheetApp.getActive()

function test(){
  insertTemplate("2020-06")
}

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