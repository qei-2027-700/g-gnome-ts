# G-Nome再現プロジェクトの作業方針

ゲーム開発のプログラマー・デザイナーとして、目的達成に必要な設計・実装・検証を自律的に進める。提案だけで止めず、依頼された動作を実装して確認する。関連する改善案は、今回の変更と区別して伝える。

親の [AGENTS.md](../AGENTS.md) を継承し、このファイルにはG-Nome固有の方針を置く。ユーザーの最新の指定を、既存の資料・実装より優先する。

## 作業の入口

- 対象は1997年のPCゲーム『G-Nome』の再現。Babylon.js・TypeScript・Viteを使うブラウザゲームで、最初の対象は製品版1-1。全編への拡張を見据える。
- 起動と構成は [README.md](README.md)、仕様の入口は [制作資料の目次](docs/README.md)、実装順序は [実装計画](docs/technical/implementation-plan.md) を参照する。
- Mission・Vehicle・Facilityの追加・変更では[コンテンツ拡張手順](docs/technical/content-extension.md)を参照する。
- 実装済み・未実装・検証範囲は [起動・実装範囲](docs/technical/playable-1-1.md) と対象コードを照合する。資料に記述があるだけで実装済みと判断しない。

## 作業別スキル

- 新規ミッションの作成、既存ミッションの配置・地形・目標の変更は [gnome-mission-authoring](.agents/skills/gnome-mission-authoring/SKILL.md) を使う。
- 既存任務の地図を原作の地図と突き合わせて、残っているずれだけを直すときは [gnome-mission-map-match](.agents/skills/gnome-mission-map-match/SKILL.md) を使う。
- 操作・乗降・無人化・接触・経路探索・操作音声の変更は [gnome-gameplay-change](.agents/skills/gnome-gameplay-change/SKILL.md) を使う。
- 武器の威力・射程・充填・弾速・弾の形と色・発射音の変更は [gnome-weapon-tuning](.agents/skills/gnome-weapon-tuning/SKILL.md) を使う。
- BGMの取得・MP3変換・配置・任務への接続は [gnome-bgm-import](.agents/skills/gnome-bgm-import/SKILL.md) を使う。
- 既存の3Dモデルを原作画像と突き合わせて、見えた外観の差だけを直すときは [gnome-model-match](.agents/skills/gnome-model-match/SKILL.md) を使う。
- 機内ビュー・HUDの再現は [gnome-cockpit](.agents/skills/gnome-cockpit/SKILL.md) を使う。
- 新規の外観素材と動きの再現は [gnome-vehicle-visuals](.agents/skills/gnome-vehicle-visuals/SKILL.md) を使う。

今回の作業に関係するスキルだけを読む。詳細仕様の正本は `docs/` とし、スキルへ性能値や会話履歴を複製しない。

## 原作再現と仕様判断

- 原作資料で確認した事実、ユーザーの指定、試作上の仮値を区別する。性能値は確認済みの原作値に合わせ、操作感の調整で機体性能や攻撃威力へ無断の倍率を加えない。
- 未確認値は仮値と明記し、出典と確認箇所を対応する資料に残す。設定値だけでなく、補正や更新処理を含む実際の速度・威力も確認する。
- 操作感・見た目・音の依頼は、自然文から該当する処理へ反映する。声種・台詞・操作キーなど、会話で確定した条件を保持する。不明な点は既存資料を調べ、結果を左右する点だけ確認する。
- 仕様変更は関連する `docs/gameplay/`・`docs/technical/`・`docs/audio/` へ反映する。共通仕様や会話履歴をこのファイルへ複製しない。

## 実装の責務

| 配置 | 責務 |
| --- | --- |
| `src/game/simulation/` | 移動・戦闘・乗降・損傷・AI・任務進行。DOM・描画・音声APIに依存させない |
| `src/game/presentation/` | 3D描画・歩行演出・カメラ・ホログラム・音。ゲーム状態とイベントを表現へ変換する |
| `src/game/content/` | 機体・武器・任務の定義。性能や配置は対応する定義で管理する |
| `src/game/settings.ts`・`input.ts`・`session.ts` | 設定の検証・入力変換・停止と時間進行 |
| `src/main.ts`・`src/style.css` | 起動・イベント接続・HUD・メニュー・設定保存・画面スタイル |

- 既存の責務と配置を保ち、機能追加のたびに分類や抽象化を増やさない。任務ごとの配置・目標・調整値を共通のゲーム処理へ直接埋め込まない。

## 検証

**全体テスト（`pnpm test`）と型チェック（`tsc --noEmit`）はCIが担う。Agentはローカルで全テストを実行しない。**

全体テストと型チェックは GitHub Actions（`.github/workflows/ci.yml`）がpush・PRごとに実行する。Agentはコストと時間を抑えるため、ローカルでは影響する範囲のテストのみ実行してコミットし、回帰の検出はCIに任せる。

| 変更・タイミング | 検証する範囲 |
| --- | --- |
| 個別機能の実装・調整中 | 変更した処理と、その呼び出し元・利用先に関係するテスト |
| CSS・配色などの見た目 | 描画構造・共有寸法を変えた場合のみ描画・当たり判定の関連テストも実行 |
| 共通型・イベント体系・更新順など、複数機能に影響する処理 | ローカルで影響が絞れない場合はその旨を伝え、CIでの確認を優先する |
| 文章・作業ルールだけの変更 | 内容・参照リンク・日本語を検査。ゲームのテスト・ビルドは不要 |

- テストの選択はファイル名だけで決めず、変更した処理の依存先と影響先を確認する。選んだ範囲と結果を報告する。
- 関連テストだけを実行する例：`node --experimental-transform-types --test src/game/simulation/laser.test.ts src/game/simulation/parts.test.ts`
- 回帰テストは既存の責務別テストへ追加・更新することを基本とし、変更のたびに新しいテストファイルを作らない。
- 現在のテストコマンドは `src/game/` 直下と1階層下を対象とする。さらに深い場所へテストを置く場合は、実行対象も更新する。
- 詳細ログはGit対象外の `.artifacts/` に保存する。対象コードと設定に変更がなく、成功済みであれば再実行しない。
- 自動テストやNullEngineでの成功と、実ブラウザの表示・操作・GPU描画・音声確認を区別して報告する。

## Gitと並行作業

- このフォルダは独立したGitリポジトリ。変更・コミットの前に差分を確認し、他の作業による未コミット変更を巻き戻さない。
- 作業中に対象ファイルが更新されたら、該当箇所を読み直して変更を組み合わせる。古いファイル全体で上書きしない。
- コミット依頼では対象と検証結果を確認し、関連する実装・テスト・資料をまとめる。ログ・ビルド生成物・依存ディレクトリを追加しない。
