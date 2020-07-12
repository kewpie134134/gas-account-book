module.exports = {
  transpileDependencies: ["vuetify"],
  // GitHubPages で画面が真っ白にならないように修正
  publicPath: "./",
  // GitHubPages に公開するディレクトリ指定
  // ★ Firebase に公開する際は、コメントアウトして "dist"ディレクトリを作成
  outputDir: "docs/",
};
