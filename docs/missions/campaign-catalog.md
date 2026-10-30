# 原作キャンペーンの全ミッション調査

- 作品・媒体：G-Nome原作PCゲーム／ブラウザゲーム再現用の調査資料
- 対象：本編全22任務と訓練3種の参照情報
- 状態：2026-10-29に公開資料を収集。番号・英語名は攻略動画の表記、概要は投稿者説明・攻略記事による。今回、全編の原作画面・音声は検証していない
- 関連：[任務定義と実装範囲](../technical/mission-definitions.md)、[人物](../story/characters.md)、[BGM対応表](../audio/bgm-mapping.md)

## 収集範囲と出典

本編は1章5任務、2章6任務、3章5任務、4章6任務の計22任務。j-boxの番号付き攻略動画24本（2-2と4-3は各2分割）を照合した。各行のリンク先の動画タイトルと投稿者の説明文を確認したもので、画面内の正式タイトル・任務目標の全文転記ではない。

取得したURL・投稿者・動画タイトル・尺・投稿日は[動画索引JSON](../reference/mission-video-index.json)に保存した。取得時のメタデータとログはGit対象外の`.artifacts/mission-research-20261029/`にある。動画本体は取得していない。

日本語名は[G-NOME エリア攻略基本アドバイス（EASY）](https://ameblo.jp/g-nome/entry-12450789427.html)の見出しを参照した。この記事は2-4で工事中となる。後半の日本語名をこの資料から推定しない。[Locke130のFAQ](https://gamefaqs.gamespot.com/pc/197456-g-nome/faqs/14087)は訓練3種と1-1〜1-3の攻略、1-4の目標までであり、全任務の攻略資料ではない。

## 第1章：Darken領域

以下の日本語名は上記EASY攻略記事の表記。概要は各動画の説明と、1-1〜1-3についてはFAQも参照した。

| 番号 | 英語名（動画表記）／日本語の参照名 | 目的・進行の概要 | 参照動画 | 再現側の資料 |
| --- | --- | --- | --- | --- |
| 1-1 | Renegade Mercs／出撃 | 徒歩で始まり、HAWCへ搭乗。指定地点へ進み、Mercの襲撃部隊を排除する | [1-1](https://www.youtube.com/watch?v=ouTQ_oUpzWA) | [実装仕様](mission-1-1.md) |
| 1-2 | Drawbridge／渡河 | Darkenの機体を奪取し、橋制御施設で橋を下ろしてAngada川を渡る。対岸の防衛部隊への対処が続く | [1-2](https://www.youtube.com/watch?v=wg9YCQxUqSE) | 原作の達成分岐は未検証 |
| 1-3 | Convoy／輸送部隊 | 駐機場でIFFを取得し、Darkenの輸送部隊へ識別信号を送って合流。Chansk司令部へ潜入し、キリーの情報を回収する | [1-3](https://www.youtube.com/watch?v=y0q9DCsQBw8) | 原作のIFF変更条件は要画面照合 |
| 1-4 | LATLON／ラットロン通信基地 | Darkenの通信施設を無力化し、後続のキリーとの合流に備える。FAQの目標には防衛部隊・シールドジェネレーターの排除、施設破壊と退避がある | [1-4](https://www.youtube.com/watch?v=0OiVKh6pmJM) | 潜入後の破壊判定は未検証 |
| 1-5 | Rescue!／救出！ | Darken領域の最後の任務。Merc領域との境界付近で待つキリーとの合流へ向かう | [1-5](https://www.youtube.com/watch?v=eYHjjhCqb1c) | 橋・IFF・合流判定の詳細は未検証 |

## 第2章：Merc領域

2-1〜2-4の日本語名は上記EASY攻略記事の表記。概要は各動画の投稿者説明による。

| 番号 | 英語名（動画表記）／日本語の参照名 | 目的・進行の概要 | 参照動画 | 確認を残す内容 |
| --- | --- | --- | --- | --- |
| 2-1 | Dropship Rendezvous／輸送船との合流 | ガントとキリーがMerc領域で合流。移動手段を確保してターン博士の捜索を進める | [2-1](https://www.youtube.com/watch?v=vNgoatLZvms) | 武器庫襲撃・護衛・輸送船到着のイベント条件 |
| 2-2 | River Race／河岸の戦い | ターンの所在地が判明するが、先にMercのLATLON通信施設を無力化する | [前半](https://www.youtube.com/watch?v=GJZ4i0cU9c0)・[後半](https://www.youtube.com/watch?v=GmWoM0gYZz8) | 橋の破壊・昇降、増援の停止条件 |
| 2-3 | Canyon Maze／峡谷の迷宮 | Mercのフォースフィールドを解除しながら氷の峡谷を通り、ターンを救出する。通信施設破壊による通信断が背景にある | [2-3](https://www.youtube.com/watch?v=CCP3cgzaxgw) | 電源施設とフェンスの対応、ターンの生存・接近判定 |
| 2-4 | Egger／エッガー | ターンの移動と偽装に使うため、敵修理基地付近のMerc巡回HAWCを奪取する | [2-4](https://www.youtube.com/watch?v=jJkqkfm4Zuo) | 誘引・EGGER・ターン搭乗の原作判定。[現在の試作](mission-2-4.md)は移動確認用 |
| 2-5 | The Citadel Approach | Mesa Caraconの頂上にあるCitadelを目指し、昇降設備へ向かう。ターンはG-Nome対策に使えるMercの技術を探している | [2-5](https://www.youtube.com/watch?v=sjOlerNQx2Y) | 昇降設備の操作・味方集合・完了条件 |
| 2-6 | Battle in the Clouds | Citadelでターンが装備を回収する間、ガントとキリーがMercのホバー機による襲撃から基地を守る。完了後はScorp領域へ進む | [2-6](https://www.youtube.com/watch?v=DH8Jxj-_sUs) | タワー搭乗、敵機の種別・数、時間制限と防衛失敗条件、BGM |

2-4についてEASY攻略記事は、ターンを敵Tactical Defense HAWCへ搭乗させる攻略を記載している。これは原作の参考情報であり、ユーザー指定のMerc Tactical Defense搭乗開始を取り消す根拠にはしない。現在の試作へ敵や勝利判定を追加する場合は、原作画面と照合してから任務仕様へ反映する。

## 第3章：Scorp領域

以下は各動画の投稿者説明の要約。英語の地名は動画表記を保持し、既存の日本語表記と自動で統一しない。

| 番号 | 英語名（動画表記） | 目的・進行の概要 | 参照動画 | 確認を残す内容 |
| --- | --- | --- | --- | --- |
| 3-1 | Scorp Crossing | Scorp戦車を奪い、IFFで偽装して輸送部隊へ合流し国境を越える。その先でシェリダンと合流する | [3-1](https://www.youtube.com/watch?v=YpUF8RLP7EA) | 奪取対象・合流地点・識別信号と国境通過条件 |
| 3-2 | CommArray at Ur-Kinsk | シェリダンが同行。さらにScorp領域へ進むため、LATLON通信施設を無力化する | [3-2](https://www.youtube.com/watch?v=EOdqH0-weos) | 施設への潜入・破壊・退避の順序 |
| 3-3 | Raid on Ur-Ulit | Ur-Alrを守る地雷原を通るため、Ur-Ulit基地から地雷検知装置付きのScorp機を奪取する | [3-3](https://www.youtube.com/watch?v=m0IIJf0hlMw) | [既存仕様](mission-3-3.md)。原作の人数・搭乗・通過判定は別途照合 |
| 3-4 | Ur-Alr | ガントとターンがErreskat川を渡ってキリー・シェリダンと合流。Ur-Alr司令部へ侵入し、研究所の座標を取得する | [3-4](https://www.youtube.com/watch?v=SBcPVtIrUFs) | 渡河と味方集合、シェリダンの侵入・情報取得判定 |
| 3-5 | Ion-Strike | G-Nome研究所を発見して破壊へ進む。シェリダンがイオン攻撃の要請を引き受けるが、次章の裏切りにつながる | [3-5](https://www.youtube.com/watch?v=10mSGF0ZZ5c) | 照準装置・攻撃要請・退避・章終了の条件 |

3-3の動画表記はUr-Ulit、既存資料の呼称は「ウル・ウリット」。3-4のUr-Alrと別の基地として記録する。動画説明だけで既存のシーン・施設IDを改名しない。

## 第4章：シェリダン追跡

以下は各動画の投稿者説明の要約。日本語版の正式任務名は未照合。

| 番号 | 英語名（動画表記） | 目的・進行の概要 | 参照動画 | 確認を残す内容 |
| --- | --- | --- | --- | --- |
| 4-1 | Captured! | シェリダンの裏切りでキリーが捕虜となる。ウィルキンスが釈放を交渉するScorp司令部へ、残った部隊が進む | [4-1](https://www.youtube.com/watch?v=pVLsZtKq0po) | 司令部への到達・捕虜救出の成立条件 |
| 4-2 | Scorp Defense | キリーが釈放され、Scorpと協力する。ユーザー指定では徒歩開始後にScorpミーゾンタワーへ搭乗し、シェリダン率いるUnion軍を迎撃する | [4-2](https://www.youtube.com/watch?v=dKik04jCwCg) | [試作実装](mission-4-2.md)。キリー・ターンと防衛。Union AIP2機はプラントを攻撃。地上編成・数値・勝敗判定は仮設定 |
| 4-3 | War Zone | Scorpの輸送支援でShalton Frontierへ。DarkenとMercが交戦する地域を突破してシェリダンを追う | [前半](https://www.youtube.com/watch?v=dlIy0zh8vVk)・[後半](https://www.youtube.com/watch?v=0k85E049niI) | 両軍の敵味方判定・通過経路・終了地点 |
| 4-4 | General Delivery | 溶岩の川に架かる橋を下ろし、ウィルキンスと仲間を対岸へ渡して研究所攻撃に備える | [4-4](https://www.youtube.com/watch?v=8sXUAZLF9Tw) | 橋操作・護衛・全員通過の判定 |
| 4-5 | Sheridan's Lair | 宇宙輸送船が到着する前にシェリダンの防衛部隊を突破し、クローン研究所を破壊する。終盤にキリーを失い、シェリダンが逃走する | [4-5](https://www.youtube.com/watch?v=_XcvTyyTxyw) | 輸送船到着の時間条件・研究所破壊・キリーのイベント |
| 4-6 | Mano-a-Mano | 研究所から逃げたシェリダンを、輸送手段の待つ橋へ追い詰めて決着をつける | [4-6](https://www.youtube.com/watch?v=4jdJl-1hZ78) | 最終戦・G-Nomeへの対処・エンディングの操作条件 |

## 訓練

[Locke130のFAQ](https://gamefaqs.gamespot.com/pc/197456-g-nome/faqs/14087)に記載された訓練は以下の3種。本編の22任務とは別枠で、訓練番号や日本語版の名称は未確認。

| 名称（FAQ表記） | 内容の概要 |
| --- | --- |
| HAWC Refresher | 基本走行、建物への攻撃、機体からの脱出 |
| Advanced HAWC | 視点・ウェイポイント操作とタワーへの射撃 |
| G-Nome Tactics | 兵員として同乗・降車し、ガス兵器でタワーを奪取。仲間への攻撃命令も練習する |

## BGMと既存実装への反映

「Fighting on the Tundra」のユーザー指定用途はMerc最終戦でのタワーによる対空戦。[2-6の動画説明](https://www.youtube.com/watch?v=DH8Jxj-_sUs)は、Merc編の最終任務でCitadelをホバー機襲撃から守る点が一致する。このため2-6を対応候補とする。ただし、ミーゾンガードタワーで敵航空機を倒す場面と曲の再生を原作映像で同時に確認したわけではない。番号の確定割り当て・再生開始・ループ設定は保留する。

今回の取得は資料整備。新しい任務をゲームの選択欄へ登録しておらず、1-1・2-4・3-3の実装・BGM・ユーザー指定も変更していない。各任務の全目標文、開始位置、配置座標、全機体・武器・初期弾数、会話全文、難易度差、正確な勝敗フラグ、BGMの時刻・条件は、この資料だけで確定できない。実装時には該当動画の原作画面・音声または実機で確認する。

動画3-4・3-5・4-3には投稿者による同期ずれ・編集の注記がある。BGMの切替時刻や通信イベントの順序を調べる際は、動画の再生秒数をそのままゲーム内時間にしない。
