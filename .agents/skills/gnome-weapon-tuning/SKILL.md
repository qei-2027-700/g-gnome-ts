---
name: gnome-weapon-tuning
description: G-Nomeの武器の威力、射程、充填、弾速、弾の形・色、銃口と着弾、発射音を変える。レーザーが強い、武器の見た目や音をそろえる、/gnome-weapon-tuning のときに使う。機体の外観モデルや操作・乗降の変更には使わない。
---

# 武器の威力と弾の表現を変える

このスキルの配置先から `../../..` がG-Nomeのルート。[AGENTS.md](../../../AGENTS.md) に従う。性能の正本は [武器仕様](../../../docs/gameplay/weapons-and-missile-camera.md) と `src/game/content/weapons.ts`。数値をこのスキルへ複製しない。

## 変える場所

| 依頼 | 編集する場所 |
| --- | --- |
| 威力・射程・最小射程・充填・発射間隔・エネルギー・弾速 | `src/game/content/weapons.ts` の `LASERS`・`MACHINE_GUNS`・`MISSILES` |
| どの機体が持つか、砲門数 | `src/game/content/vehicles.ts` と `weaponMountCount` |
| 任務だけの性能差 | その任務の `weaponOverrides`。共通定義の初期値は維持する |
| 弾の形・色・銃口・着弾 | `src/game/presentation/renderer.ts` |
| 発射音 | `src/game/presentation/audio.ts` |

`simulation.ts` の `fireLaser` は武器定義の `damage` を弾へ写すだけである。威力の調整で、そこへ倍率や武器別の分岐を足さない。

## 共有している表現

見た目・音・速さを共有する組は、仕様とコードの定数を読んでから片方だけを変えない。色だけ分かれる組は、色の定数だけを分ける。現在の組と定数名は武器仕様の共通レーザー表現に従う。

共有定数を変えるときは、その定数を使う武器がすべて変わることを確認する。威力・射程・充填・発射間隔は、見た目を共有していても武器ごとに残す。見た目だけの依頼で威力を変えず、威力だけの依頼で形や音を変えない。

## 検証

変更した武器の既存テストを更新して実行する。速さや命中タイミングを変えたときは、飛翔後に当たるテストの待ち時間も合わせる。描画の共有寸法を変えたときは `renderer.test.ts` の当該武器も実行する。

実ブラウザの色・音は未確認なら、その旨を報告する。仕様の変更は `docs/gameplay/weapons-and-missile-camera.md` へ反映する。
