# Pomodoro Flow

依存なしで動くシンプルなポモドーロタイマーです。

## 使い方

1. `index.html` をブラウザで開く
2. 作業時間と休憩時間をプリセットまたは任意の分数で設定する
3. `スタート` を押す
4. `終了` を押すまで、作業と休憩が自動で交互に続く

## 機能

- 作業時間と休憩時間をそれぞれプリセットから選択可能
- 作業時間と休憩時間を1〜180分の範囲で自由入力可能
- 一時停止と再開に対応
- `終了` でタイマーを停止し、作業フェーズの初期状態に戻る

## GitHub Pages で公開する

このリポジトリには、`main` ブランチへ push すると GitHub Pages にデプロイする
ワークフローが入っています。

### 最初の公開手順

1. GitHub で新しいリポジトリを作成する
2. このフォルダをそのリポジトリに push する
3. GitHub の `Settings` から `Pages` を開く
4. `Build and deployment` の `Source` で `GitHub Actions` を選ぶ
5. `Actions` タブで `Deploy to GitHub Pages` が成功するのを待つ
6. 発行された URL にアクセスする

### 例

```bash
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git add .
git commit -m "Add pomodoro timer app"
git push -u origin main
```

公開後の URL は通常、次の形式になります。

`https://<GitHubユーザー名>.github.io/<リポジトリ名>/`
