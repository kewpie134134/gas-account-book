module.exports = {
  transpileDependencies: ["vuetify"],
  // GitHubPages で画面が真っ白にならないように修正
  publicPath: "./",
  // GitHubPages に公開する際は、"docs/"ディレクトリを指定する
  // Firebase に公開する際は、"dist/"ディレクトリを指定する
  outputDir: "dist/",
};
