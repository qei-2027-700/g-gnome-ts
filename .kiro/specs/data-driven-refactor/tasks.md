# 実装計画：データ駆動型リファクタリング

## 概要

既存のデータ駆動型設計を維持しながら、型安全性の強化・音声機能の追加・規約文書の整備を段階的に行う。
各タスクは独立して完結し、前タスクの成果物を積み上げる形で進める。

## Tasks

- [x] 1. 機体標準データを `vehicles.ts` の機体ごとの定義へ集約する
  - `VehicleKind` は `VEHICLES` のキーから導出する
  - 各機体の性能・形状・歩行・駆動音を1エントリにまとめ、必須項目の欠落は型エラーにする
  - `VEHICLE_SHAPES`・`GAITS`・`DRIVE_PROFILES` は互換性を保つ派生データとして公開する
  - `resolveVehicle` は表示用データを除いた `VehicleSpec` を返す
  - _Requirements: 1.2_

  - [x]* 1.1 Property 1: 中央機体定義と派生プロファイルの対応テスト
    - **Property 1: Vehicle registry completeness**
    - **Validates: Requirements 1.2**
    - 全機体の `shape`・`gait`・`drive` が派生マップと一致し、解決済み `VehicleSpec` に混入しないことを検証する
    - `src/game/presentation/locomotion.test.ts` の末尾に追記する

- [ ] 2. `MissionDefinition` に `audioPath` フィールドを追加する
  - `src/game/content/missions/types.ts` の `MissionDefinition` 型に `audioPath?: string;` を追加する
  - 既存の `bgm?` フィールドの直後に配置する
  - `validateMissions` に新たなバリデーションロジックは追加しない
  - _Requirements: 4.1, 4.4_

- [ ] 3. `GameAudio.playGuidance()` を `audio.ts` に実装する
  - `src/game/presentation/audio.ts` の `GameAudio` クラスに以下を追加する
  - プライベートフィールド: `guidanceBuffer: Map<string, Promise<AudioBuffer | null>> = new Map()`
  - プライベートフィールド: `guidanceSource: AudioBufferSourceNode | null = null`
  - パブリックフィールド: `guidanceError: string | null = null`
  - `async playGuidance(audioPath: string): Promise<void>` メソッドを実装する
    - `settings.voice === 0` の場合は即時 return
    - 既存の `guidanceSource` を停止してから新しい再生を開始する
    - `guidanceBuffer` でキャッシュする（`radioBuffers` と同様のパターン）
    - fetch 失敗・デコード失敗時は `console.warn` のみ、例外を投げない
    - `settings.voice * 0.8` を gain 値として使用する
    - `source.onended` でリソースを disconnect し `guidanceSource` を null に戻す
  - `pause()` メソッドに `this.guidanceSource?.stop(); this.guidanceSource = null;` を追加する
  - _Requirements: 4.2, 4.3_

  - [ ]* 3.1 Property 4: `playGuidance` が欠落ファイルで例外を投げないプロパティテストを `audio.test.ts` に追加する
    - **Property 4: playGuidance does not throw on missing file**
    - **Validates: Requirements 4.3**
    - fetch が失敗するモックを使い、任意の `audioPath` で例外が発生しないことを検証する
    - fast-check の `fc.string()` でランダムな audioPath を生成する
    - `src/game/presentation/audio.test.ts` の末尾に追記する

- [ ] 4. `docs/technical/codex-rules.md` を新規作成する
  - 日本語で記述する
  - 以下のセクションを含める:
    1. **このファイルの目的** — AIエージェント向け追記規約の概要
    2. **機体追加のプロンプトテンプレート** — `vehicles.ts` + `vehicle-shapes.ts` + ミッションファイルの変更手順
    3. **ミッション追加のプロンプトテンプレート** — 新規ミッションファイル + `index.ts` への登録手順
    4. **既存ミッションのマップ拡張テンプレート** — `terrain`・`units`・`waypoints` の変更手順
    5. **変更禁止ファイル一覧** — `simulation.ts`・`renderer.ts` への直接埋め込み禁止を明記する
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5. チェックポイント — 関連テストの通過確認
  - `node --experimental-transform-types --test src/game/presentation/locomotion.test.ts src/game/presentation/audio.test.ts src/game/content/missions/validate.test.ts` を実行し、全テストが通ることを確認する
  - 型エラーがあれば `tsc --noEmit` で特定して修正する
  - 疑問点があればユーザーに確認する

- [ ] 6. `validate.test.ts` にプロパティテストを追加する
  - `src/game/content/missions/validate.test.ts` の末尾に以下を追加する

  - [ ]* 6.1 Property 2: `validateMissions` が壊れた参照を検出するプロパティテストを追加する
    - **Property 2: validateMissions detects broken references**
    - **Validates: Requirements 2.2**
    - fast-check の `fc.record` で `assignedUnitId` を既存 unit ID と異なるランダム文字列にした `MissionDefinition` を生成する
    - `validateMissions([badMission])` の結果が空でないことを検証する
    - `src/game/content/missions/validate.test.ts` の末尾に追記する

- [ ] 7. `locomotion.test.ts` に `legPose` 純粋関数プロパティテストを追加する

  - [ ]* 7.1 Property 3: `legPose` が純粋関数であることのプロパティテストを追加する
    - **Property 3: legPose is a pure function**
    - **Validates: Requirements 3.2**
    - fast-check の `fc.constantFrom(...Object.keys(GAITS))` と `fc.float`・`fc.double` で任意の `(kind, phase, run, hipHeight)` を生成する
    - 同じ引数で2回呼んだ結果が `deepStrictEqual` で一致することを検証する
    - `src/game/presentation/locomotion.test.ts` の末尾に追記する

- [ ] 8. `codex-rules.md` の存在とセクション構成のユニットテストを追加する
  - `src/game/content/missions/validate.test.ts` の末尾に追記する（ファイルシステム確認テストは validate の責務外だが、ミッション関連コンテンツテストとして配置が近い）
  - あるいは `src/game/presentation/audio.test.ts` 末尾でも可
  - `node:fs/promises` の `readFile` で `docs/technical/codex-rules.md` を読み、3つのプロンプトテンプレートセクション（`##` 見出し）が存在することを `assert.ok` で検証する
  - _Requirements: 5.1, 5.2_

- [ ] 9. 最終チェックポイント — 全関連テストの通過確認
  - `node --experimental-transform-types --test src/game/presentation/locomotion.test.ts src/game/presentation/audio.test.ts src/game/content/missions/validate.test.ts` を実行し、全テストが通ることを確認する
  - 疑問点があればユーザーに確認する

## Notes

- `*` 付きのサブタスクはオプション（スキップ可）
- fast-check はこのプロジェクトの `devDependencies` に含まれていない。プロパティテストを実装する際は、`npm install --save-dev fast-check` の実行をユーザーに依頼するか、Node.js 標準の `node:test` のループベースで代用する
- `simulation.ts`・`renderer.ts`・`movement.ts` は本タスク群で変更しない
- テスト追加先はすべて既存ファイルの末尾追記とし、新規テストファイルを作成しない
