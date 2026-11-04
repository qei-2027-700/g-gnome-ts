# Codex向けコンテンツ追記ルール

## このファイルの目的

機体・ミッションの追加や既存マップの拡張を依頼されたAIエージェント向けの追記規約です。型付きコンテンツを正本とし、任務固有の配置や目標を共通のゲーム処理へ埋め込まないでください。原作で確認した内容、ユーザー指定、試作上の仮値を区別し、作業後は `validateMissions` と影響範囲のテストで確認してください。

共通手順の詳細は[Mission・Vehicle・Facilityの拡張手順](./content-extension.md)を参照してください。

## 機体追加のプロンプトテンプレート

```text
新しい機体 <VehicleKind> を追加してください。

- 性能と VehicleKind は src/game/content/vehicles.ts の VehicleSpec に従って定義する。
- 外形は src/game/content/vehicle-shapes.ts に登録し、命中領域や描画に使う形状と整合させる。
- 新しい VehicleKind の場合、src/game/presentation/locomotion.ts の GAITS と
  src/game/presentation/audio.ts の DRIVE_PROFILES にも必須エントリを追加する。
- 既存ミッションに配置する場合は、その mission-<番号>.ts の units に追加する。
  新規ミッションへの配置ならミッション追加手順も適用する。
- VehicleSpec の必須項目 name, jp, faction, speed, shield, energy, armor, height,
  passengerCapacity, color, weapons, torsoLimit, voice, initialAmmo, ai を埋める。
  ai には少なくとも detection, strafe, keepMoving, stopDistance, missileVolley を指定する。
- cockpit view用の画像が必要な場合は assets/cockpits/<vehicle-kind>-cockpit.png に置き、
  assets/README.md に用途と参照元を記録する。既存の画像形式・利用方法も確認する。
- 原作で未確認の性能値は仮値と明記し、対応する資料に確認状態と出典を記録する。
- 対応するテストを実行し、型チェックで全必須レジストリの登録を確認する。
```

`VEHICLES`・`VEHICLE_SHAPES`・`GAITS`・`DRIVE_PROFILES` は `VehicleKind` 全件との対応を型検査します。そのため、新しい機体種の追加は通常、これらの定義ファイルに加えて配置先ミッションも変更します。3ファイルだけで済むと決めつけず、実際の型エラーや機体固有の描画・挙動要件に従って必要箇所を更新してください。

## ミッション追加のプロンプトテンプレート

```text
ミッション <番号> を追加してください。

- src/game/content/missions/mission-<番号>.ts に MissionDefinition を定義する。
- src/game/content/missions/index.ts に import と MISSIONS 登録を追加する。
- 必須フィールドを満たし、参照する unit・waypoint・人物・施設IDを同じ定義内で解決する。
- 目標・配置・地形はミッション定義に置き、共通処理へミッション固有条件を追加しない。
- validateMissions(MISSIONS) が成功することを確認し、完了条件が成立する挙動テストを追加する。
- 原作未確認の値や進行は仮設定と記録する。
```

最小定義に必要なフィールドは `id`、`title`、`subtitle`、`briefing`、`startHint`、`success`、`radio`、`player`、`playerFaction`、`initialIff`、`factionCodes`、`assignedUnitId`、`units`（最低1機）、`waypoints`、`objectives`（最低1つ）、`terrain`、`rocks`、`tuning` です。`assignedUnitId`、目標の参照先などは実在するIDにしてください。`completionEnabled` を省略した場合は完了条件が有効です。

最小構造の例です。実際に追加するときは、最も近い既存ミッションの記述を参照して必要なフィールドを補ってください。

```ts
export const MISSION_X: MissionDefinition = {
  id: 'X',
  title: 'Mission title',
  subtitle: { ja: '任務', en: 'Mission' },
  briefing: { ja: '説明', en: 'Briefing' },
  startHint: { ja: '開始案内', en: 'Start hint' },
  success: { ja: '任務完了', en: 'Mission complete' },
  radio: { ja: '通信', en: 'Radio' },
  player: { x: 0, z: 0 },
  playerFaction: 'union',
  initialIff: '2620',
  factionCodes: { union: '2620' },
  assignedUnitId: 'player',
  units: [{ id: 'player', kind: 'union-sentry', x: 0, z: 0, pilot: false }],
  waypoints: [{ id: 1, x: 0, z: 100, radius: 10 }],
  objectives: [{ id: 'reach-exit', type: 'reach', waypointId: 1, label: { ja: '出口へ進む', en: 'Reach the exit' } }],
  terrain: { halfWidth: 200, minZ: -100, maxZ: 500, ridgeHeight: 40, ridgeVariation: 10, seed: 1 },
  rocks: [],
  tuning: { Easy: { interval: 2.6 }, Medium: { interval: 1.9 }, Hard: { interval: 1.35 } },
};
```

## 既存ミッションのマップ拡張テンプレート

```text
既存ミッション <番号> のマップを <変更内容> に合わせて拡張してください。

- src/game/content/missions/mission-<番号>.ts の terrain, units, waypoints を中心に更新する。
- 配置する機体・建物・人物と、目標や他の参照IDの整合性を保つ。
- 地形の境界、河川・橋、施設寸法、進入位置、到達可能性を確認する。
- validateMissions に加えて、地形通過や目標達成を扱う既存simulationテストを更新・実行する。
- 任務固有の数値や配置を simulation または presentation の共通処理へ埋め込まない。
- 原作で未確認の配置・進行は仮設定と記録する。
```

## 変更禁止ファイル一覧

コンテンツの追加・配置変更だけを目的とする作業では、次の共通処理へ任務固有データを直接埋め込まないでください。

- `src/game/simulation/simulation.ts`（または `src/game/simulation/` の共通処理）
- `src/game/presentation/renderer.ts`

ミッションID・個別の敵ID・固有配置・目標条件を共通処理内の分岐に追加せず、MissionDefinition のデータとして表現してください。全ミッションに適用する新しい挙動が必要な場合に限り共通処理を変更し、既存データへの影響と状態遷移テストを確認してください。
