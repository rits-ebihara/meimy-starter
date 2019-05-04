# トラブルシューティング

## ビルド時

* [Android]ビルド時に、"Failed to create directory" や "operation not permitted" が出る。
  * プロジェクトフォルダの"android"フォルダで ```gradlew clean``` を実行する。

    ```
    cd android && gradlew clean
    ```

