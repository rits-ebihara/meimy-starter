# スターターを使ったプロジェクトの開始の方法

## 概要

Meimy-Starter を利用すると、Meimy ライブラリを導入したテンプレートを活用して、素早い開発環境の整備が行なえます。

## 前提条件

こちらの [開発環境](developmentEnv.md) が必要です。

## 使い方

1. yarn で global に Meimy-Starter をインストールします。

    ```bash
    > yarn global add ssh://git@developer-ssh.jrits.ricoh.com:7999/eimmobile/meimy-starter.git
    ```

1. 任意のフォルダで、下記コマンドを実行します。アプリ名のフォルダが作成され、その中にプロジェクトファイルが展開されます。

    ```bash
    > yarn create-meimy.cmd init [app name]
    ```

    > ここで指定したアプリ名で、Google Play や App Stroe でのアプリIDが決まります。  
    > アプリIDはそれぞれのストア内で一意である必要があります。  
    > アプリIDは下記のようになります。  
    > ```jp.co.ricoh.jrits.eim.[app name]```

1. そのフォルダに cd して、Visual Studio Code を起動します。

    ```bash
    > cd [app name]
    > code .
    ```

1. Android Studio を起動し、AVD Manager から 仮想端末 を起動します。

    > Android Studio を起動しなくても、コマンドラインから起動できます。  
    > https://developer.android.com/studio/run/emulator-commandline

1. Visual Studio Code で、デバッグ'Android Debug'を開始します。

## 動作確認

仮想端末上で、アプリが起動したら、下記
