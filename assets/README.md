# ゲームで使用する素材

ゲームから読み込む画像・音声を置く。原作調査用の画像と観察記録は`docs/reference/`へ残し、実行時コードから直接読み込まない。

| 使用素材 | 元の資料 |
| --- | --- |
| [4-2-scope.png](4-2-scope.png) | 4-2 Scorp Defenseの開始画面。地図・防衛とタワー搭乗の項目・Scorpミーゾンタワーの外観。[実装準備](../docs/missions/mission-4-2.md) |
| [4-2-開始時-右手にscopeロケットタワー.png](4-2-開始時-右手にscopeロケットタワー.png) | 4-2出撃直後の徒歩一人称。右手はScorpロケットタワー。迎撃時に搭乗するScorpミーゾンタワーとは区別。[開始状態の仕様](../docs/missions/mission-4-2.md#出撃直後の視点と迎撃任務ユーザー指定2026-10-30) |
| [merc-mison.png](merc-mison.png) | Mercミーゾン・ガードタワーの外観基準。濃紺の先広がりの頭部、灰色の台座、赤い塗装片。[専用外観](../docs/reference/vehicles/merc-meson-tower/README.md#merc-misonpngに基づく専用外観2026-10-30) |
| [merc-assult-hawk-yoko.png](merc-assult-hawk-yoko.png) | ユーザー提供のMerc Assault横向き画像。[4本脚と配色の参照](../docs/reference/vehicles/merc-assault/README.md)。ゲーム画面の背景には使用しない |
| `cockpits/union-sentry-reference.png` | [Union Sentryの提供画像](../docs/reference/vehicles/union-sentry/user-sentry-identification-2026-10-23.png) |
| `cockpits/union-tactical-reference.png` | [Union Tacticalの機内参照](../docs/reference/vehicles/union-tactical/1-3-darken軍-sentry-hawk.png)。適用先はユーザー指定 |
| `cockpits/merc-tactical-reference.png` | [Merc Tacticalの機内](../docs/reference/vehicles/merc-tactical/2-4-merc軍-タクティカルディフェンスhawk内view.png) |
| [cockpits/merc-assault.png](cockpits/merc-assault.png) | ユーザー指定のMerc Assault HAWCの機内。窓と固定計器を除いて使用。[専用コックピット](../docs/gameplay/cockpit-hud.md#merc-assault-hawcの操縦席2026-10-29) |
| [cockpits/merc-mison-guard-tower.png](cockpits/merc-mison-guard-tower.png) | ユーザー提供のミーゾン・ガードタワーの機内とMerc AIP。窓・固定計器を除いたフレームに使用。[専用機内表示](../docs/gameplay/cockpit-hud.md#mercミーゾンガードタワーの機内2026-10-29) |
| [cockpits/merc-mison-guard-tower3.png](cockpits/merc-mison-guard-tower3.png) | 徒歩視点から見たMercミーゾンタワーの外観と周辺配置の追加資料。塔の機内画像とは区別。[外観の観察記録](../docs/reference/vehicles/merc-meson-tower/README.md#徒歩視点からの外観追加資料2026-10-30) |
| [cockpits/merc-mison-guard-tower4.png](cockpits/merc-mison-guard-tower4.png) | Mercミーゾンタワーの機内。緑の斜め四方向照準・中央十字・目盛り・充填表示の参照。[HUD](../docs/gameplay/cockpit-hud.md#ミーゾンタワーの緑色照準追加画像42026-10-30) |
| `cockpits/union-asv-reference.png` | [Union ASVの機内](../docs/reference/vehicles/union-asv/3-3-union-ASV内.png) |
| `cockpits/scorp-reference.png` | [Scorp ASVの機内と基地](../docs/reference/vehicles/scope-asv/3-3-司令部左側-ul-urit基地突入.png) |
| `cockpits/visom-reference.png` | [VISOMの画面枠](../docs/reference/vehicles/scope-asv/3-3-VISOM-view-and-scope-ASV.png) |
| [audio/bgm/mission-1-1-start.mp3](audio/bgm/mission-1-1-start.mp3) | ユーザー指定の1-1開始曲。LAUNCH後に自動再生。[出典と検査値](../docs/audio/bgm-mapping.md#配置済みの1-1開始曲2026-10-24) |
| [audio/bgm/mission-1-1-sentry-combat.mp3](audio/bgm/mission-1-1-sentry-combat.mp3) | Merc Sentry HAWKがプレイヤーを視認すると再生。[出典と検査値](../docs/audio/bgm-mapping.md#配置済みの1-1戦闘曲2026-10-24) |
| [audio/bgm/mission-3-3.mp3](audio/bgm/mission-3-3.mp3) | ユーザーが抽出・再生確認した3-3のBGM。[音源・参照URLの記録](../docs/audio/bgm-mapping.md#配置済みの3-3音源2026-10-24) |
| [audio/bgm/union-march.mp3](audio/bgm/union-march.mp3) | ユーザーが抽出したTrack 02: Union March。3-3で敵Scorp ASV搭乗後に再生。[音源の記録](../docs/audio/bgm-mapping.md#配置済みのunion-marchと3-3の再生処理2026-10-24) |
| [audio/bgm/fighting-on-the-tundra.mp3](audio/bgm/fighting-on-the-tundra.mp3) | 投稿動画表記はTrack 12: Fighting on the Tundra。2-6のミーゾンタワー防衛で、出撃直後からファイル全体をループ再生する。[出典と検査値](../docs/audio/bgm-mapping.md#配置済みのmerc最終戦用音源2026-10-29) |
| [audio/bgm/credits.mp3](audio/bgm/credits.mp3) | ユーザー指定の原作クレジット曲。4-2で再生。[出典・検査値](../docs/audio/bgm-mapping.md#原作クレジット曲と4-2への接続2026-10-30) |
| [audio/bgm/snow-maze-D0jKDtJPqLM.mp3](audio/bgm/snow-maze-D0jKDtJPqLM.mp3) | 指定YouTube動画D0jKDtJPqLMの15 Snow Maze。4-2のUnion部隊全滅後に再生。[出典・検査値](../docs/audio/bgm-mapping.md#4-2のunion部隊全滅後の切り替え2026-10-30) |
| `ui/mission-console.png` | [3-3の開始画面](../docs/reference/observations/mission-3-3/3-3-launch前.png)。開始画面の枠と3-3のプレビューに使用 |

現在の画像素材は元画像と同じ内容のコピーであり、描画側で窓・計器部分のマスクや切り出しを行う。元資料を更新しただけでは使用素材は変わらない。反映時は対応する素材を更新し、実画面も確認する。

`audio/`は効果音・通信音声などの使用素材。音声の生成元と再生成方法は[音声仕様](../docs/audio/mission-controls-and-audio.md)を参照する。

- `cockpits/bridge-control-building.png`: 橋制御棟の内側view。提供画像を参照し、窓と計器表示を動的に合成する。
