# 開発環境

## OS

* Windows (10以降)/maxOS (Sierra 以降) で可能。
  * iOS 用のビルド、デプロイを行うときには、macOS が必要。
  * インターネットに認証なしでアクセスできる環境。(社内からは、[インターネットダイレクト接続](https://portal.staff.jp.ricoh.com/rfg/it/manual/index.php/DIRECTCONNECTION)を参照のこと)

### 推奨環境
* 高性能PC (Core i7(第7世代以上), Memory 16GB以上, SSD)
  * HDD ではデバッグ等が遅く、開発効率に大きな影響がある。
* コードエディタ: Visual Studio Code
* Android, iPhone 実機

## アプリケーション・ツール等

* Android Studio, Xcode(macOSのみ)
* [Git](https://git-scm.com/)
* [Putty](https://www.putty.org/)(windows のみ, SSHで BitBucket への接続で必要)
* [node.js](https://nodejs.org/ja/)
  * nvm 等 node バージョン管理ツールを導入することが望ましいです。
* [yarn](https://yarnpkg.com/lang/ja/)(node.js の後に)
* react-native-cli(yarn の後に)
  * コマンドプロンプト等シェルから、下記コマンドでインストールします。  
  ```
  yarn global add react-native-cli
  ```

## Gitで SSH の設定

Meimyのライブラリは、RITS 共通開発環境のGitリポジトリ (BitBucket) を利用します。

yarn で、そのリポジトリを指定してインストールすることから、Gitクライアントで、SSHの秘密鍵／公開鍵でノンパスーワードで認証できるようにする必要があります。

1. 環境変数に、下記項目を追加します。(ユーザー、システムどちらでも構いません)
   
   | 変数名          | 変数値                              |
   | --------------- | ----------------------------------- |
   | GIT_SSH_VARIANT | ssh                                 |
   | GIT_SSH         | (TortoiseGitPlink.exeのフルパス *1) |

   *1: 例: C:\Program Files\TortoiseGit\bin\TortoiseGitPlink.exe

2. スタートメニューから PuTTYgen を起動し、秘密鍵、公開鍵を作成します。

    > 参考: https://qiita.com/sugar_15678/items/55cb79d427b9ec21bac2#%E7%A7%98%E5%AF%86%E9%8D%B5%E3%81%A8%E5%85%AC%E9%96%8B%E9%8D%B5%E3%81%AE%E4%BD%9C%E6%88%90

3. PuTTYgen の画面で表示された、"Public key for ..." の値（ランダムな英数の羅列、公開鍵）をコピーします。
4.  BitBucket にログインし、自分のアカウント管理画面を開きます。  
SSH のメニューを開きます。  
https://developer.jrits.ricoh.com/bitbucket/plugins/servlet/ssh/account/keys

1. "キーを追加" のボタンを押し、上でコピーした公開鍵のテキストを貼り付けて保存します。
1. スタートメニューから Pageant を起動します。

    > ウィンドウが表示されない場合は、タスクトレイにあります。  
    > タスクトレイのアイコンをダブルクリックすると、ウィンドウが開きます。

2. "AddKey" ボタンを押し、上で作成した 秘密鍵のファイルを開きます。
3. "Close" ボタンを押して閉じます。タスクトレイで起動し続けます。
4. 下記コマンドで、クローンが成功すればOKです。(作成されたフォルダは削除してください。)

    ```bash
     git clone ssh://git@developer-ssh.jrits.ricoh.com:7999/eimmobile/meimy-utils.git
    ```
