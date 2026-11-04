# G-Nome 再現プロジェクト

1997年のPCゲーム「G-Nome」を、Babylon.js・TypeScript・Viteでブラウザ向けに再現するプロジェクトです。ゲーム本編の挙動や表示を調査しながら、シングルプレイの試作を開発しています。再現範囲と未確認事項は[起動・実装範囲](docs/technical/playable-1-1.md)を参照してください。

## プレイ

[ブラウザ版を開く](https://g-gnome-ts.pages.dev/)

## ローカルで起動

Node.js 22.18以降と[pnpm](https://pnpm.io/)を使用します。

```sh
pnpm install
pnpm dev
```

開発サーバーが表示するURL（通常は <http://127.0.0.1:5173>）をブラウザで開いてください。操作方法は[キー操作ガイド](docs/technical/keybindings.md)を参照してください。

## 開発コマンド

```sh
pnpm test   # 全テスト
pnpm build  # 型チェックと本番ビルド
```

CIでは全体テストと型チェックを実行します。実装作業では影響範囲のテストを選んで実行し、詳細は[開発方針](AGENTS.md#検証)を参照してください。

## ドキュメント

[制作資料の目次](docs/README.md)から、ミッション仕様、ゲームプレイ、音声、技術資料、原作調査資料を参照できます。個別ミッションの説明や進行状況は、それぞれのミッション資料にまとめています。

## 技術概要

- **描画:** Babylon.js
- **言語:** TypeScript
- **開発・ビルド:** Vite
- **構成:** `src/game/simulation/`にゲーム処理、`src/game/presentation/`に描画・音声、`src/game/content/`に機体・武器・ミッション定義を配置
