# Mission・Vehicle・Facilityの拡張手順

## 方針

既存のコンテンツは型付きTypeScript定義を正本にする。既存の機体・施設を使うミッションの追加と、新しい機体種・施設種の実装は別の作業として扱う。共通処理へミッション固有の配置・目標・数値を埋め込まず、形状や性能を見た目の都合で変更しない。

データを追加しただけで実装が完了するとは限らない。型と参照検証はIDや必須データの整合性を確認するが、地形を通過できるか、任務を完了できるか、表示・当たり判定が形状に合うかは挙動テストで確認する。

## Missionの追加・既存配置の変更

### 追加箇所

1. `src/game/content/missions/mission-<番号>.ts` に `MissionDefinition` を定義する。
2. `src/game/content/missions/index.ts` でimportし、`MISSIONS`へ登録する。読み込み時に `validateMissions` が参照を検査する。
3. 配置や目標を変えた場合は、既存の責務別シミュレーションテストへ任務の挙動を追加する。
4. 原作仕様を更新する場合は `docs/missions/` と必要な gameplay・technical 文書に、確認済み事実と仮設定を分けて記録する。

`units`、`base.buildings`、`terrain`、`waypoints`、`objectives`、`assaults`等は任務定義に置く。複数任務で同じ機体を使う場合、性能・形状は共通定義を再利用し、任務だけの例外は `vehicleOverrides` または配置の `overrides` に置く。これらの適用順は[ミッションの追加と共通仕様](./mission-definitions.md)を参照する。

最小テンプレートを機械的に複製するより、最も近い既存ミッションを参照し、不要な任意フィールドを省く。新規目標タイプや新規共通挙動が必要な場合は、データ追加だけで済ませずシミュレーション処理と操作から状態遷移までのテストを追加する。

### 配置変更時の確認

- すべてのunit・building・person・waypoint参照が実在し、重複IDがない。
- 橋の `bridgeZ` と河川の範囲（中心線`path`を使う場合はその曲がり方）、幅、施設の進入位置が噛み合っている。
- 敵の移動・射線・攻撃対象・武器射程を含めて、目標へ到達でき、任務が意図した状態で完了する。
- `validateMissions` は作者データと参照の整合性を検査するもので、地形を横断できるかなどのプレイ成立性までは保証しない。

## 新しいVehicle／HAWK

### 基本定義と必須登録

機体の標準定義は `src/game/content/vehicles.ts` の `VEHICLES` に集約する。キーから `VehicleKind` を導出し、各エントリに性能・武装・AIだけでなく外形 `shape`、歩行 `gait`、駆動音 `drive` も記述する。これらの表示用データは同ファイルの機体定義から生成され、従来の `vehicle-shapes.ts`・`locomotion.ts`・`audio.ts` は互換用の派生データや関数を提供する。新機体追加時に各ファイルへ別々の機体キーを登録する必要はない。

`VehicleSpec` はシミュレーションへ渡す性能データの型であり、`resolveVehicle` は中央定義から `shape`・`gait`・`drive` を除いて返す。任務のvehicle overrideに表示データが混入しない。

通常の新機体追加は `vehicles.ts` と、機体を登場させる既存ミッションの定義が主な変更箇所になる。新しいミッションも作る場合はミッション定義ファイルと `missions/index.ts` への登録が必要になり、基本は合計3ファイルとなる。機体固有の描画・挙動・素材を新設する場合は、その機能の実装とテストも必要な範囲で追加する。

`VehicleSpec` の基本項目は型で検査する。新機種に必要な値を既存機から流用する場合、確認済み原作値と試作仮値を区別して記録する。新しいweapon type、ミサイル挙動、砲口、部位や特殊移動が必要なら、次も調べる。

- 武器定義と搭載数：`src/game/content/weapons.ts`
- 命中領域・衝突外形・脚・砲口：`src/game/simulation/parts.ts` と必要に応じて `vehicle-shapes.ts`
- 描画と機種固有の外観・更新：`src/game/presentation/renderer.ts`
- コックピット、HUD、任務プレビュー：対応する `*-cockpit.ts`、CSS、`src/main.ts`。専用画像が要る場合は `assets/cockpits/` と `assets/README.md`

`renderer.ts`と`parts.ts`の汎用形状で不足しない機体と、特殊な脚・砲塔・履帯・ホバー・照準などを持つ機体では必要な変更範囲が異なる。機体データは集約できるが、新しい振る舞いや描画まで定義データだけで表現できるとは限らない。

### 機体検証

- `locomotion.test.ts`で全VehicleKindの中央定義と形状・歩行・駆動音の派生データを確認する。
- 歩行姿勢を持つ機種では、脚の接地・遊脚を確認する。
- 形状・部位・共有寸法を変えた場合は `parts.test.ts`、`vehicle-collision.test.ts`、必要な描画テストを選んで実行する。
- 操作・性能・武器を変えた場合は、プレイヤー操作とAIの双方を該当するsimulationテストで検証する。

## Facility／建物

### 既存種の配置と新しい種の追加を分ける

既存の `Base.buildings[].kind` を任務に配置するだけなら、任務定義と配置・操作に関わるテストを更新する。建物種類そのものを増やす場合は、少なくとも以下を確認する。

| 責務 | 場所 | 追加時の確認 |
| --- | --- | --- |
| 種類と配置データ | `src/game/content/missions/types.ts` の `Base.buildings[].kind` | `FacilityType` はここから導出される |
| インスタンス生成・既定名・搭乗可否 | `src/game/simulation/facilities.ts` | `FACILITY_NAMES`は全FacilityTypeを型検査する |
| 建物モデル・見た目 | `src/game/presentation/base.ts` | 汎用形状で適切か、固有モデルや固有部品が要るか |
| 選択ホログラム | `src/game/presentation/facility-hologram.ts` | `FACILITY_HOLOGRAMS`は全FacilityTypeを型検査する |
| 操作・進行・損傷・破壊 | `src/game/simulation/simulation.ts` と関連シミュレーションモジュール | 新しい操作や状態遷移が必要な場合だけ共通処理を拡張する |
| 衝突・射線・施設内表示 | battlefield／parts／rendererと関連テスト | 建物の寸法や搭乗状態と一致させる |

新しい施設種では型付きの既定名とホログラム表示に加え、3Dモデル、当たり判定、選択、射撃、搭乗、損傷・破壊のうち、その施設が持つ機能を実装・検証する。既存の汎用形状を使う場合も、任務定義と表示・衝突の座標が一致することを確かめる。

## Mission固有と全体共通の判断

| 情報・挙動 | 原則 |
| --- | --- |
| 開始位置、配置、目標、ウェイポイント、地形、難易度別出現間隔 | Mission定義 |
| 機体の標準性能、形状、武器の標準性能 | Vehicle／weaponの共通定義 |
| Mission内だけの装備・性能・IFF差 | Missionまたはspawnのoverride |
| 全Missionで同じ入力・搭乗・攻撃・施設操作 | Simulationの共通処理と共通テスト |
| 描画、コックピット、HUD、アニメーション、音 | Presentationの共通処理。機種差は機種別データまたは明確な機種固有表示 |
| 原作未確認の数値や配置 | 仮設定と明記し、確認資料・確認状態を対応文書へ記録 |

Mission固有のIDや条件を `simulation.ts`・`renderer.ts` の分岐へ直接埋め込まない。真に全Mission共通の挙動を加える場合は共通処理を変更してよいが、Mission定義・既存テストを読み、操作から結果までの回帰を追加する。

## `.kiro/specs/data-driven-refactor/`案の扱い

- 性能・形状・歩行・駆動音を`vehicles.ts`の機体ごとの定義へ集約し、`VehicleKind`はそのキーから導出する。旧来の各モジュールは派生データや演算関数を提供する。
- Mission・Vehicle・Facilityを1つのローダーやJavaScript設定へ移す案は採用しない。既存の型付きデータ定義と責務分割を維持する。
- `audioPath`と案内音声再生APIは、この作業では採用しない。任務内のどのフェーズで再生するか、再生の重複・中断・言語差をどう扱うかが未定義で、パスだけを追加すると未使用データになるため。再生条件が決まった時点で音声仕様と一緒に設計する。
- `fast-check`は追加しない。現状のキー網羅や参照検証は型チェックと `node:test` の決定的テストで確認でき、ランダムプロパティテスト用依存を増やす効果が見合わない。
