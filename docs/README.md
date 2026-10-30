# G-Nome 制作資料

[プロジェクト概要](../README.md)／[実装計画](technical/implementation-plan.md)／[最初の再現対象：製品版1-1](missions/mission-1-1.md)

## 資料の分類

| ディレクトリ | 保存する内容 |
| --- | --- |
| [missions/](missions/) | ミッションごとの目標、配置、進行、実装範囲 |
| [story/](story/) | 登場人物、本編・会話への出演、ミッションとの対応 |
| [gameplay/](gameplay/) | 歩兵、武器、カメラ、難易度などのゲーム仕様 |
| [audio/](audio/) | BGM・SE・音声案内と、音に関係する操作の仕様 |
| [technical/](technical/) | 実装計画、Windows・macOSへの対応、入力設計 |
| [reference/](reference/) | 原作調査、出典、マニュアル、原作の動作環境 |

仕様の状態、原作での確認状況、ユーザー指定は各文書を参照する。

## ミッション

- [原作キャンペーンの全ミッション調査](missions/campaign-catalog.md)：本編22任務・訓練3種の名称、目的・進行の概要、攻略動画24本と未確認事項
- [製品版1-1](missions/mission-1-1.md)：最初の再現対象。Union Sentry対Merc軍、開始から終了までの流れ
- [2-4 Merc編の雪原](missions/mission-2-4.md)：Merc Tactical Defense搭乗開始、雪原・雪山・右側の岩壁と機内表示、キリーへの個別指示。敵配置・クリア条件は未確認
- [2-6 Battle of Clouds](missions/mission-2-6.md)：2基のミーゾンタワーで四方のMerc AIPを迎撃し、要塞から出たターンを回収。敵数・必要撃破数・配置は仮設定
- [3-3 ウル・ウリット侵攻](missions/mission-3-3.md)：VISOM手動誘導・敵ASV誘引・基地と地雷原・仲間のScorp機搭乗を実装。仲間3人全員の搭乗でクリア。EGGERによる奪取は未実装

- [4-2 Scorp防衛戦](missions/mission-4-2.md)：徒歩開始、キリー・ターンとScorp守備隊による防衛、Union AIP2機の対プラント攻撃、草原と夕焼け、原作クレジット曲を試作実装

## ゲーム仕様

- [歩兵状態](gameplay/infantry.md)：徒歩、姿勢、携行武器、搭乗・降機、施設、死亡
- [設定画面・難易度](gameplay/settings.md)：Easy・Medium・Hard、初期値Easy、パラメータと設定保存
- [カメラとコックピット](gameplay/cameras-and-cockpits.md)：機体別の機内表示、外部斜め・真後ろビュー
- [コックピット内の表示](gameplay/cockpit-hud.md)：武器・照準・Holo・レーダー・指令速度と実速度、機体別画面の確認範囲
- [任務地図とウェイポイント](gameplay/mission-map-and-waypoints.md)：Bの任務表示、Sの選択、現在位置、目標と到達
- [IFF・通信・仲間への命令](gameplay/iff-and-communications.md)：識別と敵行動・レーダー、Fキーの宛先・命令選択、任務進行
- [敵の行動と追加調査](gameplay/enemy-behavior.md)：1-1の敵AI、攻略資料の観察、未確定の索敵・移動・射撃・難易度差
- [機体・上半身・砲塔の旋回](gameplay/vehicle-articulation.md)：360度回転・角度制限・固定、車体・武器・視点の分離
- [武器の分類とミサイルカメラ](gameplay/weapons-and-missile-camera.md)：武器の表示・誘導、VISOM専用ビュー

## 登場人物

- [人物と登場時期](story/characters.md)：ガンツ、キリー、ターン博士、シェリダン、ウィルキンス。本編登場と音声出演を区別

## 音・音声

- [中断確認と音の制作](audio/mission-controls-and-audio.md)：女性声2種類、機体・施設名の案内、損傷警告、中断、自作SE、BGM、後日の英語対応
- [BGMと場面の対応表](audio/bgm-mapping.md)：Merc・Scorp領域・3-3・1-1開始曲と戦闘開始曲、Merc最終戦用Fighting on the Tundra（再生未接続）の参照URL・検査値、MP3抽出手順、複数曲と切り替え条件

## 技術設計

- [ミッションの追加と共通仕様](technical/mission-definitions.md)：任務定義、機体・武器の再利用、任務限定の例外、再挑戦
- [1-1試作版の起動と実装範囲](technical/playable-1-1.md)：起動・操作、仮設定、実装箇所、検証結果

- [実装計画](technical/implementation-plan.md)：採用技術、ゲーム基盤、段階と完了条件
- [Windows・macOSの操作](technical/keybindings.md)：原作キーと共通プリセット案、キー変更、全速出力の女性音声
- [ビルド・配布・プレイ環境](technical/build-and-distribution.md)：開発サーバー、配布用ビルド、静的配信、PCブラウザ

## 参考資料

- [機体画像の保存先](reference/vehicles/README.md)：機種別の画像、共通マニュアル、任務画面の分類

- [Union Sentryのデザイン資料](reference/vehicles/union-sentry/README.md)：原作マニュアル、提供画像によるUnion・Merc Sentryの識別、試作モデルへの反映
- [Merc Tactical Defense HAWCのデザイン資料](reference/vehicles/merc-tactical/README.md)：正面・左下の機体識別、白・水色・グレー・黒の配色、モデルとホログラムへの反映
- [Union ASV・Scorp ASV](reference/vehicles/scope-asv/README.md)：マニュアルの諸元、Scorp ASVの傾斜装甲・履帯・配色、Union・Scorpの操縦席とScorpの4枠残弾

- [製品版1-1の映像観察](reference/observations/mission-1-1/observations.md)：YouTubeの時刻、提供画像、敵の反応、未確認事項
- [3-3の調査・観察記録](reference/observations/mission-3-3/observations.md)：出典の確認範囲と、原作映像で確認する項目
- [機体性能・武器仕様の調査](reference/vehicles-and-weapons.md)：原作資料に掲載された値と未確認事項
- [参考資料とmacOSでの原作プレイ](reference/sources-and-macos.md)：参考ブログ、PDFの取得元、原作の動作環境
- [英語マニュアルPDF](reference/manuals/G-Nome_Manual_Win_EN.pdf)

新しい資料は内容に合うディレクトリへ置き、この目次へ追加する。原作の出典情報は`reference/`、実装する挙動は`gameplay/`などの仕様へ分け、調査結果を確認済みの実装と混同しない。
