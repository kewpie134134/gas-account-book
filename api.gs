/** 
 * 紐づいているスプレッドシートを取得する getActive() を利用する
 */
const ss = SpreadsheetApp.getActive()

/**
 * 認証情報トークンを設定する
 * 誰でもアクセス可能な URL を発行するので、認証情報 authToken を持っている人しかアクセスできないようにする
 * 認証情報はソースコードに書きたくないため、PropertiesService を利用して、スクリプトのプロパティから取得する
 * 
 * （GUIで取得する場合）
 * 「ファイル」タブ -> 「プロジェクトのプロパティ」 -> 「スクリプトのプロパティ」から設定できる。
 */
const authToken = PropertiesService.getScriptProperties().getProperty('authToken') || ''

/**
 * レスポンスを作成して返す
 * @param {*} content
 * @returns {TextOutput}
 */
function response (content) {
  // GAS でレスポンスを返す時は、 ContentService を利用する
  const res = ContentService.createTextOutput()
  // レスポンスの Content-Type ヘッダーに "application/json" を設定する
  // また、作成した API では JSON しか返さないので、mime type には MimeType.JSON を指定する
  res.setMimeType(ContentService.MimeType.JSON)
  // オブジェクトを文字列にしてから、レスポンスに詰め込む
  res.setContent(JSON.stringify(content))
  return res
}

/**
 * アプリに POST リクエストが送信された時に実行される
 * @param {Event} e
 * @returns {TextOutput}
 * 
 * 送られてきたリクエストは e.postData.contents で取得できる
 * 文字列のため、JSON にパースする（一応 try-catch で囲んでおく）。
 */
function doPost (e) {
  let contents
  try {
    contents = JSON.parse(e.postData.contents)
  } catch (e) {
    log('warn', '[doPost] JSONのパースに失敗しました')
    return response({ error: 'JSONの形式が正しくありません' })
  }

  if (contents.authToken !== authToken) {
    log('warn', '[doPost] 認証に失敗しました')
    return response({ error: '認証に失敗しました' })
  }

  const { method = '', params = {} } = contents
  log('info', `[doPost] "${method}" リクエストを受け取りました`)

  let result
  try {
    switch (method) {
      case 'POST':
        result = onPost(params)
        break
      case 'GET':
        result = onGet(params)
        break
      case 'PUT':
        result = onPut(params)
        break
      case 'DELETE':
        result = onDelete(params)
        break
      default:
        result = { error: 'methodを指定してください' }
    }
  } catch (e) {
    log('error', '[doPost] ' + e)
    result = { error: e }
  }

  return response(result)
}

/**
 * API作成
 * API成功時には何かしらの結果を返し、エラー時は {error: "メッセージ"} を返す仕様とする。
 */

/** --- API --- */

/**
 * 指定年月のデータ一覧を取得する
 * @param {Object} params
 * @param {String} params.yearMonth 年月
 * @returns {Object[]} 家計簿データ
 */
function onGet ({ yearMonth }) {
  const ymReg = /^[0-9]{4}-(0[1-9]|1[0-2])$/
  
  if (!ymReg.test(yearMonth)) {
    return {
      error: '正しい形式で入力してください'
    }
  }
  
  const sheet = ss.getSheetByName(yearMonth)
  const lastRow = sheet ? sheet.getLastRow() : 0

  if (lastRow < 7) {
    return []
  }

  /** 
   * テーブルヘッダーが A6:H6 にあるので、A7:H{最終行} のデータを取得する。
   * データの最終行は getLastRow で取得できる。
   * 指定年月のシートが存在しない場合も考慮し、最終行が7未満の場合は空の配列を返す。
   * 
   * データを返すときはオブジェクトにして返したいので、
   * getValues で受け取った2次元配列を map でオブジェクトに加工する。
   * 空白セルは ("") として取得されるので、収支だけ注意する必要がある（ポイント）
   */
  const list = sheet.getRange('A7:H' + lastRow).getValues().map(row => {
    const [id, date, title, category, tags, income, outgo, memo] = row
    return {
      id,
      date,
      title,
      category,
      tags,
      income: (income === '') ? null : income,
      outgo: (outgo === '') ? null : outgo,
      memo
    }
  })

  return list
}

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
  // シートには appendRow というメソッドがあり、引数に配列を渡すだけでデータの追加が可能
  sheet.appendRow(row)

  log('info', `[onPost] データを追加しました シート名: ${yearMonth} id: ${id}`)

  return { id, date, title, category, tags, income, outgo, memo }
}

/**
 * 指定年月 & id のデータを削除する
 * @param {Object} params
 * @param {String} params.yearMonth 年月
 * @param {String} params.id id
 * @returns {Object} メッセージ
 */
function onDelete ({ yearMonth, id }) {
  const ymReg = /^[0-9]{4}-(0[1-9]|1[0-2])$/
  const sheet = ss.getSheetByName(yearMonth)

  if (!ymReg.test(yearMonth) || sheet === null) {
    return {
      error: '指定のシートは存在しません'
    }
  }

  /**
   * A7:A{最終行} で範囲の値を取得すると、2次元配列になっているので、フラットにしてから id を検索している。
   */
  const lastRow = sheet.getLastRow()
  const index = sheet.getRange('A7:A' + lastRow).getValues().flat().findIndex(v => v === id)

  if (index === -1) {
    return {
      error: '指定のデータは存在しません'
    }
  }

  /**
   * インデックスが見つかれば、インデックスに7行分足した行を削除する。
   */
  sheet.deleteRow(index + 7)
  log('info', `[onDelete] データを削除しました シート名: ${yearMonth} id: ${id}`)

  return {
    message: '削除完了しました'
  }
}

/**
 * 指定データを更新する
 * @param {Object} params
 * @param {String} params.beforeYM 更新前の年月
 * @param {Object} params.item 家計簿データ
 * @returns {Object} 更新後の家計簿データ
 */
function onPut ({ beforeYM, item }) {
  const ymReg = /^[0-9]{4}-(0[1-9]|1[0-2])$/
  if (!ymReg.test(beforeYM) || !isValid(item)) {
    return {
      error: '正しい形式で入力してください'
    }
  }

  /**
   * 更新前と後で年月が違う場合、データ削除と追加を実行（編集時のみ）
   * 削除と追加の処理は、onDelete と onPost に任せる。
   */
  const yearMonth = item.date.slice(0, 7)
  if (beforeYM !== yearMonth) {
    onDelete({ yearMonth: beforeYM, id: item.id })
    return onPost({ item })
  }

  const sheet = ss.getSheetByName(yearMonth)
  if (sheet === null) {
    return {
      error: '指定のシートは存在しません'
    }
  }

  const id = item.id
  const lastRow = sheet.getLastRow()
  const index = sheet.getRange('A7:A' + lastRow).getValues().flat().findIndex(v => v === id)

  if (index === -1) {
    return {
      error: '指定のデータは存在しません'
    }
  }

  const row = index + 7
  const { date, title, category, tags, income, outgo, memo } = item

  /**
   * 同じシートで完結できる場合は、id 列以外の B?:H? を setValues で更新する。
   * 編集する行はデータ削除時と同じように探す。
   */
  const values = [["'" + date, "'" + title, "'" + category, "'" + tags, income, outgo, "'" + memo]]
  sheet.getRange(`B${row}:H${row}`).setValues(values)

  log('info', `[onPut] データを更新しました シート名: ${yearMonth} id: ${id}`)

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

  log('info', '[insertTemplate] シートを作成しました シート名: ' + yearMonth)

  return sheet
}

/**
 * データが正しい形式か検証する
 * @param {Object} item
 * @returns {Boolean} isValid
 */
function isValid (item = {}) {
  const strKeys = ['date', 'title', 'category', 'tags', 'memo']
  const keys = [...strKeys, 'income', 'outgo']

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

/** --- Log --- */

const logMaxRow = 101  // ログは最大100件まで保存
const logSheet = ss.getSheetByName('log')

/**
 * ログをシートに記録する
 * @param {String} level
 * @param {String} message
 */
function log (level, message) {
  logSheet.appendRow([new Date(), level.toUpperCase(), message])

  if (logMaxRow < logSheet.getLastRow()) {
    logSheet.deleteRow(2)
  }
}