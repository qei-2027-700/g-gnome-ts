# 設計文書：データ駆動型リファクタリング

## 概要

本設計は、G-Nomeの機体・ミッションを「最小ファイル追記で完結させる体制」を確立するための変更をまとめたものです。コードベースはすでにデータ駆動型の設計になっているため、本設計の主な目的は次の3点です。

1. **追記差分の集約** — 性能・形状・歩行・駆動音を機体単位で一元定義し、`VehicleKind` をそのキーから導出する
2. **機能追加** — `MissionDefinition` に `audioPath` フィールドを追加し、`GameAudio.playGuidance()` を実装する
3. **規約の文書化** — `docs/technical/codex-rules.md` に追記テンプレートを整備する

---

## アーキテクチャ

### 変更ファイルと新規ファイルの一覧

| ファイル | 変更種別 | 目的 |
|---|---|---|
| `src/game/content/vehicles.ts` | 変更 | `VEHICLES` の各エントリに性能・形状・歩行・駆動音を集約し、`VehicleKind` をキーから導出 |
| `src/game/content/vehicle-shapes.ts` | 変更 | 中央定義から形状データを再exportする互換窓口 |
| `src/game/presentation/locomotion.ts` | 変更 | 歩行プロファイルを中央定義から参照 |
| `src/game/presentation/audio.ts` | 変更 | 駆動音プロファイルを中央定義から参照 |
| `src/game/content/missions/types.ts` | 変更 | `MissionDefinition` に `audioPath?: string` フィールドを追加 |
| `src/game/presentation/audio.ts` | 変更 | `playGuidance(phase: string): void` メソッドを `GameAudio` に追加 |
| `docs/technical/codex-rules.md` | 新規 | 日本語によるAIエージェント向け追記規約とプロンプトテンプレート |

> `simulation.ts`・`renderer.ts`・`movement.ts`・`locomotion.ts` は本設計で変更しません。

### 責務レイヤーの確認

```
src/game/content/          ← データ定義・型検証（型システムで整合性保証）
src/game/simulation/       ← 物理・AI・任務進行（DOM/WebGL依存なし）
src/game/presentation/     ← 描画・音声・演出（game state → 表現への変換）
docs/technical/            ← 規約・仕様文書
```

`movement.ts` は `presentation/` のいかなるモジュールもインポートしません。この分離はTypeScriptのimportグラフで検証可能であり、本設計で変更を加えません。

---

## コンポーネントとインターフェース

### 1. 機体定義の集約と型検証

`vehicles.ts` の `VEHICLES` を標準機体データの唯一の編集元とする。各機体エントリは `VehicleSpec` の性能データに加え、`shape`・`gait`・`drive` を必須で持つ `VehicleDefinition` として型検証する。`VehicleKind` は `keyof typeof VEHICLES` から導出するため、種別追加時に識別子のunionや別の機体キー表を更新しない。

```typescript
export const VEHICLES = {
  'union-sentry': {
    // 性能・武装・AI
    shape: { ... },
    gait: { ... },
    drive: { ... },
  },
} as const satisfies Record<string, VehicleDefinition>;
export type VehicleKind = keyof typeof VEHICLES;
```

`VEHICLE_SHAPES`、`GAITS`、`DRIVE_PROFILES` はこの定義から派生する互換参照で、新機体追加時に別ファイルへキーを重複登録しない。`resolveVehicle` は `shape`・`gait`・`drive` を除外してシミュレーション用の `VehicleSpec` を返す。

### 2. MissionDefinition.audioPath

`missions/types.ts` の `MissionDefinition` 型に省略可能フィールドを1つ追加します。

```typescript
export type MissionDefinition = {
  // ...既存フィールド...
  bgm?: { ... };           // BGM（変更なし）
  audioPath?: string;      // ミッション固有の案内音声ファイルパス（新規）
  // ...
};
```

- `audioPath` は `bgm` と独立しており、BGMトラックの管理とは無関係です
- 値は `assets/audio/guidance/` 以下のパスを想定しますが、型は `string` のみで制約しません
- `validateMissions` に追加バリデーションは不要です（パスの存在確認は音声再生時に行います）

### 3. GameAudio.playGuidance()

`audio.ts` の `GameAudio` クラスに以下のメソッドを追加します。

```typescript
playGuidance(audioPath: string): void
```

**設計方針**:

- `AudioContext` または `fetch` を使って音声ファイルを取得・再生します
- ファイルが取得できない場合（HTTP 404、ネットワークエラー等）は `console.warn` を出力して処理を終了します。例外は送出しません
- 既存の BGM・ラジオ・エンジン音とは独立した `GainNode` を使います
- `settings.voice` の音量設定に従います
- 同じ `audioPath` のバッファはキャッシュします（`radioBuffers` と同様のパターン）

**状態管理**:

```typescript
private guidanceBuffer: Map<string, Promise<AudioBuffer | null>> = new Map();
private guidanceSource: AudioBufferSourceNode | null = null;
```

**エラー報告**:

```typescript
// 呼び出し元はエラーの存在を知る必要がある場合に参照する（optional）
guidanceError: string | null = null;
```

**実装スケッチ**:

```typescript
async playGuidance(audioPath: string): Promise<void> {
  const ctx = this.ctx;
  if (!ctx || this.settings.voice === 0) return;

  // 既再生中の案内音声を停止
  this.guidanceSource?.stop();
  this.guidanceSource = null;

  let loading = this.guidanceBuffer.get(audioPath);
  if (!loading) {
    loading = fetch(audioPath)
      .then(res => { if (!res.ok) throw new Error('guidance unavailable'); return res.arrayBuffer(); })
      .then(bytes => ctx.decodeAudioData(bytes))
      .catch(() => {
        this.guidanceBuffer.delete(audioPath);
        console.warn(`[GameAudio] guidance audio not found: ${audioPath}`);
        return null;
      });
    this.guidanceBuffer.set(audioPath, loading);
  }

  const buffer = await loading;
  if (!buffer || ctx.state !== 'running') return;

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.value = this.settings.voice * 0.8;
  source.connect(gain);
  gain.connect(ctx.destination);
  this.guidanceSource = source;
  source.onended = () => {
    if (this.guidanceSource === source) this.guidanceSource = null;
    source.disconnect();
    gain.disconnect();
  };
  source.start();
}
```

`pause()` 呼び出し時は `guidanceSource?.stop()` も実行します。

---

## データモデル

### MissionDefinition の変更（差分）

```typescript
// types.ts — 追加する1フィールド
export type MissionDefinition = {
  // ...（既存フィールド、変更なし）
  audioPath?: string;   // 案内音声ファイルのURL/パス（省略可）
  // ...
};
```

### VehicleSpec（変更なし）

`vehicles.ts` の `VehicleSpec` は変更しません。必須フィールドは要件3の規約文書に列挙します。

### 互換プロファイルの派生

`VEHICLE_SHAPES`・`GAITS`・`DRIVE_PROFILES` は `VEHICLES` の必須フィールドから生成し、従来のimport先では互換APIを維持します。新しい機種の定義漏れは `VehicleDefinition` に対する型検査で検出し、別マップ間のキー同期を不要にします。

### codex-rules.md のアウトライン

`docs/technical/codex-rules.md` に以下のセクションを含めます（詳細は実装時に展開）：

1. **このファイルの目的** — AIエージェントが参照する追記規約の概要
2. **機体追加（新規 VehicleKind）** — 変更対象ファイル一覧・最小必須フィールド・コンパイル検証手順
3. **ミッション追加（新規 MissionDefinition）** — 最小構成テンプレート・`index.ts` への登録方法
4. **既存ミッションのマップ拡張** — `terrain`・`units`・`waypoints` の変更方法・validate.ts の自動検証
5. **変更禁止ファイル** — `simulation.ts`・`renderer.ts` への直接埋め込み禁止の明記
6. **プロンプトテンプレート** — 各追記タスク用のAI向け命令文（日本語）

---

## 正当性プロパティ

*プロパティとは、システムのあらゆる有効な実行において成立すべき特性・振る舞いのことです。人間が読める仕様と機械によって検証可能な正当性保証の橋渡しとなる形式的な記述です。*

### Property 1: 中央機体定義の完全性

*すべての* 機体定義に `shape`・`gait`・`drive` が存在し、派生マップがその値を保持しなければならない。

必須フィールドは `VehicleDefinition` によりコンパイル時に保証する。テストでは全機体の派生マップが中央定義と一致し、シミュレーション用 `VehicleSpec` に表示データが混入しないことを確認する。

**Validates: Requirements 1.2**

---

### Property 2: validateMissions は壊れた参照を検出する

*すべての* `MissionDefinition` に対して、参照されている `unitId`・`waypointId`・`personId`・`facilityId` のいずれかが定義内に存在しない場合、`validateMissions` はエラー文字列を1件以上返さなければならない。

逆に、すべての参照が正しく解決できる定義ではエラーが返ってはならない。

**Validates: Requirements 2.2**

---

### Property 3: legPose は純粋関数である

*すべての* `VehicleKind`、`phase`、`run`、`hipHeight` の組み合わせに対して、`legPose` を同じ引数で2回呼び出した結果は完全に一致しなければならない（副作用なし・決定論的）。

**Validates: Requirements 3.2**

---

### Property 4: playGuidance はファイル欠落で例外を投げない

*すべての* 無効な（取得不能な）`audioPath` に対して、`GameAudio.playGuidance()` は例外を送出してはならない。代わりに `console.warn` を呼び出して正常に終了しなければならない。

**Validates: Requirements 4.3**

---

## エラー処理

### audioPath ファイル欠落

| 状況 | 振る舞い |
|---|---|
| `fetch` が 4xx/5xx を返す | `console.warn` を出力し、`guidanceBuffer` のキャッシュエントリを削除して終了 |
| `fetch` がネットワークエラー | 同上 |
| `AudioContext` が `suspended` | `ctx.resume()` を試みる。失敗した場合は何もしない |
| `settings.voice === 0` | 即時リターン（ファイル取得も行わない） |

### bgm.start.trackId 欠落（既存動作）

`updateMissionMusic` が `BGM_ASSETS[trackId]` を参照したとき、値が `null` または存在しない場合は `musicError = 'missing-start'` をセットして例外を送出しません。この動作は変更しません。

### validateMissions のエラー収集

`validateMissions` はすべてのエラーを配列に蓄積してから返します（first-fail ではない）。これにより開発者は1回の実行で全問題を把握できます。この動作は変更しません。

---

## テスト戦略

### デュアルテストアプローチ

- **ユニットテスト** — 具体的な例・エッジケース・エラー条件を検証する
- **プロパティテスト** — ランダム入力による普遍的プロパティを検証する

### ユニットテスト対象

| テスト対象 | 確認内容 |
|---|---|
| `completionEnabled` 省略時の `validateMissions` | 目標あり→エラーなし、目標なし→エラーあり（要件 2.4） |
| `bgm.start.trackId` 欠落時の `updateMissionMusic` | `musicError === 'missing-start'`、例外なし（要件 2.5） |
| `movement.ts` のimportグラフ | `presentation/` または DOM API を import していないことを確認（要件 3.1） |
| `playGuidance` の正常ケース | モックされた `AudioContext` で `AudioBufferSourceNode` が `start()` されること（要件 4.2） |
| `codex-rules.md` の存在と内容 | ファイルが存在し、3つのプロンプトテンプレートセクションを含むこと（要件 5.1–5.5） |

### プロパティテスト対象

プロパティテストには [fast-check](https://github.com/dubzzz/fast-check) を使用します。各テストは最低 100 イテレーション実行します。

| プロパティ | テスト内容 | タグ |
|---|---|---|
| Property 1: 中央機体定義の完全性 | shape・gait・driveと派生マップが一致し、resolve後のVehicleSpecに表示データがない | `Feature: data-driven-refactor, Property 1: Vehicle registry completeness` |
| Property 2: validateMissions 参照検証 | ランダムな壊れた参照を持つ定義でエラーが返る | `Feature: data-driven-refactor, Property 2: validateMissions detects broken references` |
| Property 3: legPose 純粋関数 | 同じ引数で2回呼び出した結果が一致する | `Feature: data-driven-refactor, Property 3: legPose is a pure function` |
| Property 4: playGuidance 安全性 | 無効なパスで例外が送出されない | `Feature: data-driven-refactor, Property 4: playGuidance does not throw on missing file` |

### 既存テストへの統合方針

新しいテストはできる限り既存のテストファイルに追記します。新しいテストファイルを作成するのは、既存ファイルの責務と明らかに異なる場合のみとします。

- `validate.ts` 関連テスト → 既存ミッション系テストファイルへ追記
- `legPose` プロパティテスト → 既存 `locomotion.test.ts`（あれば）へ追記
- `GameAudio` テスト → 既存 `audio.test.ts`（あれば）へ追記
