# 開発環境

## 必須

### OS

* Windows (10以降)/maxOS (Sierra 以降) で可能。
  * iOS 用のビルド、デプロイを行うときには、macOS が必要。
  * インターネットに認証なしでアクセスできる環境。(社内からは、[インターネットダイレクト接続](https://portal.staff.jp.ricoh.com/rfg/it/manual/index.php/DIRECTCONNECTION)を参照のこと)

### アプリケーション・ツール等

* Android Studio, Xcode(macOSのみ)
* [Git](https://git-scm.com/)
* [Putty](https://www.putty.org/)(windows のみ)
* [node.js](https://nodejs.org/ja/)
  * nvm 等 node バージョン管理ツールを導入することが望ましいです。
* [yarn](https://yarnpkg.com/lang/ja/)(node.js の後に)
* react-native-cli(yarn の後に)
  * コマンドプロンプト等シェルから、下記コマンドでインストールします。  
  ```
  yarn global add react-native-cli
  ```

## 推奨
* 高性能PC (Core i7(第7世代以上), Memory 16GB以上, SSD)
  * HDD ではデバッグ等が遅く、開発効率に大きな影響がある。
* コードエディタ: Visual Studio Code
* Android, iPhone 実機
