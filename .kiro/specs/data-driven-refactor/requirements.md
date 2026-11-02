# 要件文書：データ駆動型リファクタリング

## はじめに

### 背景と現状の評価

本依頼はG-Nome再現プロジェクトの「データ駆動型設計への移行」を求めるものです。
ただし、**コードベースの調査の結果、現在の実装はすでにデータ駆動型の設計を採用しています。**

現状の構造：

| 関心事 | 現在の実装場所 | 状態 |
|---|---|---|
| HAWC機体性能（速度・旋回など） | `src/game/content/vehicles.ts` の `VEHICLES` | 実装済み・型安全 |
| HAWC3D形状パラメータ | `src/game/content/vehicle-shapes.ts` の `VEHICLE_SHAPES` | 実装済み・型安全 |
| コクピット画像パス | `assets/cockpits/` + 各 `*-cockpit.ts` | 実装済み |
| ミッション1-1, 2-6, 3-3, 4-2の定義 | `src/game/content/missions/` の各ファイル | 実装済み・型検証あり |
| 移動・物理計算ロジック | `src/game/simulation/movement.ts` | 3D描画から分離済み |
| 3D歩行演出 | `src/game/presentation/locomotion.ts` | シミュレーションから分離済み |
| 汎用ミッションローダー | `src/game/simulation/simulation.ts` + `presentation/renderer.ts` | 実装済み（ミッション定義を受け取り動的構築） |

このため、依頼内容の「`src/config/gameData.js`への集約」「`src/managers/missionManager.js`の新設」という手法は、以下の理由で**既存設計と競合します**：

1. TypeScript型システムによる整合性検証（`validate.ts`）が失われる
2. `missions/types.ts` の型定義が `any` 相当のJSオブジェクトに後退する
3. 既存の `src/game/content/` という責務配置との重複が生じる

---

### 依頼の本質的な目的

依頼文を読み直すと、本質的な目的は「**少ないトークン追記で機体やミッションを追加できる体制**」の確立です。
これは現在の構造を壊すことなく、以下の形で実現できます：

- 機体追加 → `vehicles.ts` と `vehicle-shapes.ts` へデータオブジェクト1件追記
- ミッション追加 → `missions/` へファイル1つ追加、`index.ts` へ1行追記
- 案内音声パス → 各ミッション定義の `bgm` フィールドで完結

不足・改善できる点は以下です：

- ミッション定義から「案内音声ファイルパス」（`audioPath`）を直接指定する仕組みが未整備
- ミッション追加の手順ガイドとテンプレートが文書化されていない
- 開発者向けの「Codex専用追記ルール」が存在しない

---

## 用語集

- **HAWC**: G-Nomeに登場する二足歩行戦闘機械（High Attitude War Craft）
- **VehicleKind**: 機体種別を識別するTypeScriptの文字列リテラル型
- **MissionDefinition**: `missions/types.ts` で定義されたミッション全情報を持つ型
- **Simulation**: `src/game/simulation/simulation.ts` の状態管理クラス
- **Renderer**: `src/game/presentation/renderer.ts` の3D描画クラス
- **Codexルール**: 今後のAIエージェントによる機体・ミッション追加を最小トークンで完結させるための記述規約

---

## 要件

### 要件1：機体データの追記規約の明文化

**ユーザーストーリー**: 開発者として、新しいHAWCを追加したいので、どのファイルの何を変えれば完結するかを1つの手順書で確認したい。

#### 受入条件

1. THE System SHALL define a process where adding a new HAWC vehicle requires modifications to at most 3 files: `vehicles.ts`（性能）、`vehicle-shapes.ts`（形状）、および対象ミッションの定義ファイル（配置）
2. WHEN a new `VehicleKind` entry is added to `VEHICLES`, THE System SHALL surface a TypeScript compile error if the corresponding shape entry is absent from `VEHICLE_SHAPES`
3. THE System SHALL document the minimum required fields for a new vehicle entry: `name`、`jp`、`faction`、`speed`、`shield`、`energy`、`armor`、`height`、`passengerCapacity`、`color`、`weapons`、`torsoLimit`、`voice`、`initialAmmo`、`ai`
4. WHERE a cockpit image is needed for a new vehicle, THE System SHALL specify the image must be placed in `assets/cockpits/` with a consistent naming convention

### 要件2：ミッション定義の追記規約の明文化

**ユーザーストーリー**: 開発者として、新しいミッションを追加したいので、最小限の追記作業で登録・起動できるようにしたい。

#### 受入条件

1. THE System SHALL define a process where adding a new mission requires: (a) `missions/` に新ファイル1つ作成、(b) `missions/index.ts` に `import` 1行と `MISSIONS` 配列への1要素追加、という合計2ファイルの変更で完結すること
2. WHEN a new `MissionDefinition` is registered in `MISSIONS`, THE `validateMissions` function SHALL verify all referenced unit IDs, waypoint IDs, companion person IDs, and building IDs exist within that definition
3. THE System SHALL provide a minimum viable mission template that includes: `id`、`title`、`subtitle`、`briefing`、`startHint`、`success`、`radio`、`player`、`playerFaction`、`initialIff`、`factionCodes`、`assignedUnitId`、`units`（最低1機）、`waypoints`、`objectives`（最低1つ）、`terrain`、`rocks`、`tuning`
4. WHEN `completionEnabled` is omitted, THE System SHALL treat the mission as having completion enabled by default
5. IF a mission references a `bgm.start.trackId` that is absent from `BGM_ASSETS`, THEN THE `GameAudio` SHALL report a `musicError` value of `'missing-start'` without throwing an exception

### 要件3：移動・操作ロジックの責務境界の明文化

**ユーザーストーリー**: 開発者として、移動計算と3D描写が分離されていることを確認したいので、どのレイヤーに何を書くかの明確な指針がほしい。

#### 受入条件

1. THE `movement.ts` module SHALL remain free of any imports from `presentation/` or DOM/WebGL APIs, verifiable by TypeScript import graph
2. THE `locomotion.ts` module SHALL remain responsible only for computing leg joint angles from vehicle phase and speed, with no direct mutation of simulation state
3. WHEN adding new vehicle movement behavior, THE System SHALL require that physics/state changes are placed in `simulation/movement.ts` and visual interpolation is placed in `presentation/locomotion.ts`
4. THE `MANUAL_AIM` and `MOVEMENT_RESPONSE` constants in `movement.ts` SHALL be the single source of truth for player input sensitivity and acceleration tuning across all vehicle kinds

### 要件4：案内音声パスの統合（audioPath）

**ユーザーストーリー**: 開発者として、ミッション定義から案内音声ファイルパスを直接指定できるようにしたいので、音声と任務の対応がデータ1か所で完結するようにしたい。

#### 受入条件

1. THE `MissionDefinition` type SHALL support an optional `audioPath` field of type `string` pointing to a mission-specific guidance audio file
2. WHEN `audioPath` is defined in a mission, THE `GameAudio` class SHALL expose a method to play the audio at a specified mission phase
3. IF the audio file at `audioPath` is unavailable, THEN THE `GameAudio` SHALL log a warning and continue without throwing an exception
4. THE existing `bgm` field in `MissionDefinition` SHALL remain unchanged; `audioPath` handles mission-specific spoken guidance only, not background music

### 要件5：Codex向け追記ルールの文書化

**ユーザーストーリー**: AIエージェント（Codex）として、機体やミッションの追加依頼を受けたとき、既存コードを壊さずに最小トークンで実装したいので、プロジェクト固有のルールを1ファイルで参照したい。

#### 受入条件

1. THE System SHALL provide a single markdown document at `docs/technical/codex-rules.md` that specifies the exact file paths and data structures required for each addition type
2. THE `codex-rules.md` document SHALL include a prompt template for: (a) 新機体の追加、(b) 新ミッションの追加、(c) 既存ミッションのマップ拡張（地形・配置の変更）
3. THE `codex-rules.md` document SHALL explicitly list which files must NOT be modified when adding a new vehicle or mission (e.g., `simulation.ts`、`renderer.ts` への任務固有データの直接埋め込み禁止)
4. WHEN following the `codex-rules.md` prompt templates, THE resulting code changes SHALL pass `validateMissions` and TypeScript type checking without additional manual corrections
5. THE `codex-rules.md` SHALL be written in Japanese, matching the project's primary documentation language

---

## 補足：提案しないリファクタリング

以下は依頼文に含まれていたが、既存設計との競合またはリスクのため本要件から除外する：

| 除外項目 | 理由 |
|---|---|
| `src/config/gameData.js` の作成（JavaScript） | TypeScript型検証の喪失、既存 `content/` との二重管理 |
| `src/managers/missionManager.js` の新設 | 汎用ローダーは `simulation.ts` + `renderer.ts` として既に実装済み |
| `src/entities/hawcSystem.js` の新設 | 移動計算は `movement.ts`、3D演出は `locomotion.ts` として分離済み |

これらの代わりに、**既存の型安全なTypeScript構造を活かしつつ、追記規約と文書化によって同等の目標を達成する**アプローチを採用する。
