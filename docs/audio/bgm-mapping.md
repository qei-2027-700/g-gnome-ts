# BGMと場面の対応表

- 作品：G-Nome再現
- 媒体：PC向けブラウザゲーム
- 対象：曲目、ミッション内の複数曲、切り替わる場面と再生条件
- 状態：ユーザー指定のMerc領域・Scorp領域・3-3・1-1の開始曲と戦闘開始曲を登録。1-1は開始時と敵Sentry HAWCとの戦闘開始時の曲を区別する。3-3開始曲とUnion MarchのMP3を配置し、自動再生と搭乗時の切り替えを実装。他の音源ファイル、正式曲名、その他の再生・切り替え条件は未確認
- 記録日：2026-10-22
- 更新日：2026-10-24
- 関連：[1-1](../missions/mission-1-1.md)、[音の制作方針](mission-controls-and-audio.md)、[設定](../gameplay/settings.md)、[原作資料](../reference/sources-and-macos.md)

## 1ミッションに複数曲を対応させる

ユーザーから、1つのミッションでも複数のBGMが使われることが多く、各場面との対応を作りたいとの指定があった。ミッションIDから1曲だけを選ぶ設計にはしない。

曲そのものの一覧、動画・実機で聞こえた再生区間、ゲーム内で再生を決める条件を別々に管理する。マニュアルのCD Musicという説明だけで、場面ごとの切り替え条件や曲順を確定しない。

## 曲の台帳

曲には安定した内部IDを付け、正式曲名やCDトラック番号が分かったら追記する。動画の投稿者が付けた曲名・番号を公式のものとは扱わない。正式名が不明なら仮の識別名と明記し、同じ曲を別場面で聞いた場合に照合できるようにする。

| 曲ID | 正式名・仮名 | CD番号・版 | 長さ・ループ | 音源・確認元 |
| --- | --- | --- | --- | --- |
| `bgm-merc-region` | Merc領域のテーマ（用途による仮名） | 未確認 | 未確認 | [ユーザー指定動画](https://www.youtube.com/watch?v=8I_7gl0ar3M&list=PLCC2B142A186B59C9&index=4) |
| `bgm-scorp-region` | Scorp領域のテーマ（用途による仮名） | 未確認 | 未確認 | [ユーザー指定動画](https://www.youtube.com/watch?v=TYoTK2whgvw&list=PLCC2B142A186B59C9&index=5) |
| `bgm-mission-3-3` | 3-3のBGM（用途による仮名） | 未確認 | MP3全長163.016秒・ファイル全体をループ | [ユーザー指定動画](https://www.youtube.com/watch?v=WRgu6a3aclo&list=PLCC2B142A186B59C9&index=7) |
| `bgm-mission-1-1-start` | 1-1の開始曲（用途による仮名） | 未確認 | MP3全長136.149秒・原作のループ位置は未確認 | [ユーザー指定動画](https://www.youtube.com/watch?v=dHo6FxhftxM&list=PLCC2B142A186B59C9&index=16) |
| `bgm-union-march` | Track 02: Union March（投稿動画の表記） | 投稿動画ではTrack 02、原作CD番号は未照合 | MP3全長59.477秒・ファイル全体をループ | [ユーザー指定動画](https://www.youtube.com/watch?v=i352EcsT5Vg&list=PLCC2B142A186B59C9&index=1) |
| `bgm-mission-1-1-sentry-combat` | 1-1の敵Sentry HAWC戦闘開始曲（用途による仮名） | 未確認 | MP3全長49.609秒・ファイル全体をループ | [ユーザー指定動画](https://www.youtube.com/watch?v=6P2ZOLtGAXA&list=PLCC2B142A186B59C9&index=9) |
| `bgm-fighting-on-the-tundra` | Track 12: Fighting on the Tundra（投稿動画の表記） | 投稿動画ではTrack 12、原作CDの正式曲名・番号・版は未照合 | MP3全長84.160秒・2-6ではファイル全体をループ（原作条件は未確認） | [ユーザー指定動画](https://www.youtube.com/watch?v=4OuRkv-MxXE) |
| `bgm-credits` | Credits（配布ページの表記） | 原作CDの正式表記・番号は未照合 | 全長138秒・4-2では全長をループ | [G-Nome gameripのCredits](https://downloads.khinsider.com/game-soundtracks/album/gnome-windows-gamerip-1997/01.%2520Credits.mp3) |

同じ曲が日本語版・英語版で同じ位置に流れるかは未確認。曲データと再生ルールに版・言語の確認状況を持たせるが、BGMを言語だけで別曲へ変更する前提にはしない。

## ユーザー指定の参照先（2026-10-24）

最初に指定された[参照動画](https://www.youtube.com/watch?v=i352EcsT5Vg&list=PLCC2B142A186B59C9)と、共通の[再生リスト](https://www.youtube.com/playlist?list=PLCC2B142A186B59C9)を記録する。最初の動画は、追加指定によりTrack 02: Union Marchとして3-3の敵Scorp ASV搭乗後へ割り当てる。投稿者の説明では曲名は投稿者が付けた名称であり、公式曲名とは区別する。

各曲の用途と、1-1の開始時および敵Sentry HAWCとの戦闘開始時に再生する条件は、ユーザー指定の確定情報とする。Scorpはユーザーの「scope領域」に対応する。正式曲名、投稿者、動画の尺、原作CDの番号、ループ位置、使用する版は未確認。曲の用途はユーザー指定による。Union Marchについてはブラウザで動画の題名と説明を確認した。その他の動画はページ内容を取得できず、曲の内容の独立した照合は未実施。3-3開始曲はユーザーが抽出・再生確認したMP3を`assets/audio/bgm/mission-3-3.mp3`へ配置済み。追加のUnion Marchも、ユーザーが抽出したMP3を`assets/audio/bgm/union-march.mp3`へ配置済み。1-1開始曲とUnion Marchも配置済み。Merc・Scorp領域曲と1-1戦闘曲は未取得。

## 動画・実機の観察表

動画を見る際は、YouTubeのURLと動画内の開始・終了時刻、ゲーム内の出来事、聞こえた曲を記録する。動画の時刻をそのままゲーム開始からの経過秒数として使わない。

| 観察ID | ミッション・難易度・版 | 場面と動画内区間 | 曲ID・聞こえた特徴 | 出典・確度 |
| --- | --- | --- | --- | --- |
| `user-2026-10-24-1-1-start` | 1-1・難易度と版は未確認 | ミッション開始時の最初のBGM。動画内時刻は未指定 | `bgm-mission-1-1-start` | ユーザー指定。独立した映像・音声の確認は未実施 |
| `user-2026-10-24-1-1-sentry-combat` | 1-1・難易度と版は未確認 | 敵Sentry HAWCとの戦闘開始。動画内時刻は未指定 | `bgm-mission-1-1-sentry-combat` | ユーザー指定。独立した映像・音声の確認は未実施 |

観察する場面の候補は、ミッション前会話、出撃・徒歩開始、搭乗、移動、敵発見・交戦、ウェイポイント到達、勝利・失敗、結果表示。これは調査用の観点であり、それぞれに別曲があるという確定情報ではない。

編集・カット・倍速・後付けBGM・実況の有無を確認する。可能なら複数の動画や実機で同じ曲を照合する。無音区間、会話中の音量変化、曲の途中から再開した場合も記録する。

## 再生条件の対応表

| ミッション・場面 | 開始条件 | 曲・曲順 | 終了・次の曲への条件 | 切り替え方法・確認状況 |
| --- | --- | --- | --- | --- |
| 1-1・開始 | ミッション開始時 | `bgm-mission-1-1-start` | 未確認 | 曲と開始場面はユーザー指定。フェード・ループ・戦闘曲への切り替え方法は未確認 |
| 1-1・敵Sentry HAWCとの戦闘 | Merc Sentry HAWCがプレイヤーを初めて視認したとき | `bgm-mission-1-1-sentry-combat` | 未確認 | 切替条件と音源を配置済み。フェード・ループ・終了条件は未確認 |
| Merc領域 | 未確認 | `bgm-merc-region` | 未確認 | 曲の対応はユーザー指定。切り替え条件は未観察 |
| Scorp領域 | 未確認 | `bgm-scorp-region` | 未確認 | 曲の対応はユーザー指定。3-3専用曲との関係は未確認 |
| 3-3・任務開始 | 任務の進行時間が3秒に達したとき | `bgm-mission-3-3` | 敵Scorp ASVへ操縦者として搭乗したときにUnion Marchへ切り替え | ユーザー指定。ファイル全体をループし、切り替え時は前曲を止めて新曲を先頭から再生 |
| 3-3・敵Scorp ASV搭乗後 | 対象機`scorp-asv`へプレイヤーが操縦者として搭乗 | `bgm-union-march` | 任務の中断・終了で停止 | ユーザー指定の曲。ファイル全体をループし、再搭乗では再生位置を維持 |
| 2-6・ミーゾンタワー防衛 | 出撃直後 | `bgm-fighting-on-the-tundra` | 任務の中断・終了で停止 | 2-6にもBGMを流すという追加指定により接続。開始直後からファイル全体をループする設定は実装上の仮設定。原作条件は未照合 |

切り替え条件は、ミッション開始、任務イベント、領域への進入、戦闘状態、会話、曲の再生終了、経過時間などを候補として調べる。交戦開始と同時に曲が変わった1回の観察だけで、戦闘開始が原因と決めない。

単にCDの曲が順番に再生されている、ランダムに選ばれる、プレイヤーが選曲している可能性も調べる。時間による再生と場面イベントによる切り替えを区別し、原作にない動的な戦闘BGMシステムを加えない。

フェード、即時切り替え、前の曲の終了待ち、ループ、停止・再開位置は実際の観察に従う。原作と異なる滑らかなつなぎ方を、確認なしに再現仕様へ入れない。

## 実装と検証

音楽管理は現在の曲・再生位置・選曲ルール・音量を持ち、ミッションの再生条件から更新する。曲の切り替えと、台詞を聞きやすくするための音量変更は別に扱う。対応表の変更だけで曲順や場面対応を修正できる構造にする。

場面の重複通知で曲が最初から再開しないこと、再挑戦・中断で前の音楽が残らないこと、ポーズ・任務表示・通信中の再生が原作の確認結果に合うことを検証する。途中セーブを実装する場合は、音楽の再生状態も復元するかを決める。

最初は1-1の音楽を開始から終了まで観察し、分かる区間から表を埋める。音源を取得できていなくても対応の記録は進められる。原曲の利用方法と配布物への同梱は別途決める。

## MacでMP3を用意する手順

取得・検査・配置・任務への接続は、プロジェクト内の[gnome-bgm-importスキル](../../.agents/skills/gnome-bgm-import/SKILL.md)にまとめた。補助スクリプトは既存MP3を上書きせず、形式・全体のデコード・SHA-256を確認する。

[yt-dlpの公式インストール手順](https://github.com/yt-dlp/yt-dlp/wiki/Installation#homebrew)と[公式のオプション説明](https://github.com/yt-dlp/yt-dlp#usage-and-options)を参照する。音声変換にはFFmpeg・ffprobeを使い、現在のYouTube対応にはJavaScript実行環境も必要になる。ここでは既定で対応するDenoを使う。Homebrewが使えるMacのターミナルで、次を実行する。

```sh
brew install yt-dlp ffmpeg deno
```

保存先を作り、用途別の名前で各動画を抽出する。以下はG-Nomeリポジトリ内で実行するコマンド。3-3についてはユーザーが抽出・再生確認したファイルを配置済み。以下は再取得する場合にも使える手順。

```sh
cd /Users/km/dev/_github/z-sousaku/g_nome
mkdir -p assets/audio/bgm

yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 0 \
  -o 'assets/audio/bgm/merc-region.%(ext)s' \
  'https://www.youtube.com/watch?v=8I_7gl0ar3M&list=PLCC2B142A186B59C9&index=4'

yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 0 \
  -o 'assets/audio/bgm/scorp-region.%(ext)s' \
  'https://www.youtube.com/watch?v=TYoTK2whgvw&list=PLCC2B142A186B59C9&index=5'

yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 0 \
  -o 'assets/audio/bgm/mission-3-3.%(ext)s' \
  'https://www.youtube.com/watch?v=WRgu6a3aclo&list=PLCC2B142A186B59C9&index=7'
```

`--no-playlist`は指定された動画だけを対象にし、再生リスト全体の取得を防ぐ。`-x`で音声を抽出し、`--audio-format mp3`でMP3へ変換する。`--audio-quality 0`はMP3変換のVBR品質を指定する値で、元の動画より音質が良くなる指定ではない。

作成するファイルは`merc-region.mp3`、`scorp-region.mp3`、`mission-3-3.mp3`。抽出後に内容と音量、曲頭・曲末を確認し、ループ位置やゲーム内の再生条件を決める。ファイルを配置することと、ミッション開始時に自動再生する処理の実装は別の作業とする。現在のファイル選択式BGM再生でも、作成したMP3を選択できる。

## 配置済みの3-3音源（2026-10-24）

- 曲ID：`bgm-mission-3-3`
- 配置先：[assets/audio/bgm/mission-3-3.mp3](../../assets/audio/bgm/mission-3-3.mp3)
- 元ファイル：ユーザーがデスクトップへ抽出した`gnome-3-3.mp3`。再生できたことをユーザーが確認
- 確認値：MP3、48kHz、ステレオ、全長163.016秒、2,845,052バイト
- SHA-256：`be80d64ff18e8ec68f80d40cef98854a02e18fd1ca115e742137f88d540912e3`

元ファイルと配置先のハッシュが一致することを確認した。デスクトップ側はこの作業環境の書き込み対象外のため、元ファイルを残してコピーした。任務開始3秒後の自動再生とファイル全体のループ、敵Scorp ASV搭乗時のUnion Marchへの切り替えを実装済み。

## 配置済みのUnion Marchと3-3の再生処理（2026-10-24）

Union Marchの曲IDは`bgm-union-march`、配置先は[assets/audio/bgm/union-march.mp3](../../assets/audio/bgm/union-march.mp3)。ユーザーが指定動画から抽出し、素材ディレクトリへ直接保存した。MP3、48kHz、ステレオ、全長59.477秒、1,917,956バイト。SHA-256は`2cd81d5dd89505aff0ae90e6bc8e02f7b440bf38b5565c3507e54e03c7096c7e`。全体をデコードできることを確認した。

3-3の開始曲は任務の進行時間を基準に3秒後に再生する。開始画面・一時停止・設定中の時間は数えず、曲の途中で一時停止した場合は、再開時に同じ位置から続ける。再挑戦では前の曲を止め、3秒の待機と曲の先頭からやり直す。別の任務へ持ち越さない。音量とミュートは既存のBGM設定に従う。

プレイヤーが敵Scorp ASVへ操縦者として搭乗するとUnion Marchへ切り替える。仲間の搭乗や、別機体への搭乗・同乗では切り替えない。最初の切り替え後は、降機・再搭乗で曲を巻き戻さない。開始から3秒より前に奪取できた場合はUnion Marchを優先し、後から開始曲で上書きしない。設定画面で利用者が音源ファイルを選んだ場合は、その任務中は選択した音源を優先する。

再生・読み込みに失敗した場合は画面へ通知し、毎フレームの再生再試行を避ける。切り替え先が未配置なら開始曲を継続する。曲のファイル対応は`src/game/content/music.ts`、任務の開始条件と搭乗条件は`mission-3-3.ts`の`bgm`、再生の管理は`GameAudio`へ分ける。

## 配置済みの1-1開始曲（2026-10-24）

- 曲ID：`bgm-mission-1-1-start`
- 配置先：[assets/audio/bgm/mission-1-1-start.mp3](../../assets/audio/bgm/mission-1-1-start.mp3)
- 出典：[ユーザー指定動画](https://www.youtube.com/watch?v=dHo6FxhftxM&list=PLCC2B142A186B59C9&index=16)。作成した補助スクリプトをユーザーがMacのターミナルで実行し、保存した
- 検査値：MP3、48kHz、ステレオ、全長136.149秒、4,230,164バイト。FFmpegで全体をデコードできることを確認
- SHA-256：`5628c642eee2b32e2c04d4aa07c1e6958f986da8984fc5243b2c109ca1a81c47`

1-1のLAUNCH後に待機時間なしで再生する。開始画面では再生せず、一時停止・設定中は曲も止め、再開時は同じ位置から続ける。再挑戦では曲の先頭へ戻し、中断・別任務への切り替えでは前の曲を止める。搭乗だけでは曲を切り替えない。BGMの音量・消音と手動選曲は共通の処理に従う。

ファイル全体をループする設定は試作。原作のループ位置・フェードは未確認。敵Sentry HAWC戦闘曲は別ファイルに分けて管理する。

## 配置済みの1-1戦闘曲（2026-10-24）

- 曲ID：`bgm-mission-1-1-sentry-combat`
- 配置先：[assets/audio/bgm/mission-1-1-sentry-combat.mp3](../../assets/audio/bgm/mission-1-1-sentry-combat.mp3)
- 出典：[ユーザー指定動画](https://www.youtube.com/watch?v=6P2ZOLtGAXA&list=PLCC2B142A186B59C9&index=9)。ユーザーがMacのターミナルで補助スクリプトを実行し保存
- 検査値：MP3、48kHz、ステレオ、全長49.609秒、1,520,060バイト
- SHA-256：`2ad1cf4d4c397fd6261ea691aa08bed8ed231b1de4fb4f452daf3271991e771c`

Merc Sentry HAWKがプレイヤーを初めて視認した時点で開始曲から切り替える。全体ループとし、一時停止中は音楽も停止、再開は同じ位置から続ける。原作のループ位置・フェードは未確認。

## 配置済みのMerc最終戦用音源（2026-10-29）

- 作品・媒体：G-Nome再現プロジェクト・ブラウザゲーム
- 対象・状態：Merc軍との最後の戦い。ミーゾンガードタワーから敵航空機を倒す任務への用途はユーザー指定で確定。音源配置・曲登録済み。2026-10-30の追加指定により2-6へ接続済み
- 曲ID：`bgm-fighting-on-the-tundra`
- 配置先：[assets/audio/bgm/fighting-on-the-tundra.mp3](../../assets/audio/bgm/fighting-on-the-tundra.mp3)
- 出典：[Track 12: Fighting on the Tundra](https://www.youtube.com/watch?v=4OuRkv-MxXE)。曲名とTrack 12はユーザーが指定した投稿動画の表記であり、原作CDの正式情報とは未照合
- 取得方法：既存の[取り込みスキル](../../.agents/skills/gnome-bgm-import/SKILL.md)の補助スクリプトで指定動画の音声をMP3へ変換
- 検査値：MP3、48kHz、ステレオ、全長84.160秒、2,709,548バイト。FFmpegで全体のデコードに成功
- SHA-256：`62adda3a1a461563ace74af836631c2a5a866d72aded664eda92be79e2a1302e`

曲は[曲登録](../../src/game/content/music.ts)へ追加済み。2026-10-30の追加指定により、2-6へ出撃直後から再生する設定で接続した。追加の音量調整により、この任務ではBGM設定値の0.8倍で再生する。ファイル全体をループし、共通のBGM音量・一時停止・終了・再出撃の処理を使う。原作の開始時刻・ループ位置は未照合。既存の2-4を含む他任務のBGM設定は変更していない。取得・検査ログは`.artifacts/fighting-on-the-tundra-20261029/`へ、接続の検証ログは`.artifacts/mission-2-6-bgm-20261030/`へ保存する。

同日の[全ミッション調査](../missions/campaign-catalog.md#bgmと既存実装への反映)で、2-6「Battle in the Clouds」の動画説明にCitadelをMercのホバー機襲撃から守る内容を確認した。用途に対応する候補は2-6。ただし、指定されたタワーでの対空戦と曲の再生を原作映像で同時に照合していないため、原作での曲の割り当てと再生条件は未確認のままとする。今回の2-6への接続は、追加のBGM実装依頼に基づく。

## 原作クレジット曲と4-2への接続（2026-10-30）

ユーザーが4-2に原作エンディング・クレジットの曲を使うと指定した。[G-Nome（Windows／1997）のgamerip](https://downloads.khinsider.com/game-soundtracks/album/gnome-windows-gamerip-1997)に掲載された「Credits」を取得し、`bgm-credits`として[assets/audio/bgm/credits.mp3](../../assets/audio/bgm/credits.mp3)へ配置した。表示名は配布サイトの表記で、原作CDの正式表記とは区別する。原作クレジット映像との聴感照合は未実施。

- 取得元：[Creditsの個別ページ](https://downloads.khinsider.com/game-soundtracks/album/gnome-windows-gamerip-1997/01.%2520Credits.mp3)。公開MP3をそのまま保存し、再圧縮していない。
- 検査値：MP3、22050Hz、ステレオ、全長138.000秒、2,476,127バイト。FFmpegで全体のデコードに成功。
- SHA-256：`3ea368cc39553d407de84cf3aa565412415825a8959be7cad641de0bb398938b`
- 再生条件：4-2出撃直後から全長をループ。BGM設定の0.8倍。一時停止・設定で停止、再開で続きから、任務終了で停止し、再出撃では先頭から再生する。開始時刻とループ位置は未照合の試作設定。

検査・接続・ブラウザ確認の記録は`.artifacts/mission-4-2-20261030/`へ保存する。SEは既存の塔・武器・乗降・終了の共通処理を使う。


## 4-2のUnion部隊全滅後の切り替え（2026-10-30）

ユーザー指定により、Union側の敵部隊を全て倒した後にBGMを切り替える。共通選曲処理に`bgm.afterEliminate`を追加した。切り替え先はユーザー指定の「15 Snow Maze」。Union地上部隊8機とAIP2機のIDを任務に指定し、10部隊を撃破した後にCreditsから`bgm-snow-maze`へ一度だけ切り替える。撃破は任務側の判定と合わせ、機体破壊に加えて搭乗兵の死亡も数える。操縦兵を倒して空の機体だけ残った場合も切り替え、降機した兵が生きているだけでは撃破に数えない。橋の近くの敵Union Sentry（`bridge-union-sentry`）はカウント外とし、生き残っていても切り替える。橋を上げる目標は別に維持する。全長ループ・BGM設定の0.8倍を使い、停止・再開・再出撃は共通処理に従う。原作のループ点やフェードは未確認のため追加しない。


- 音源：[G-NOME 1996 PC Game Soundtrack - Track 15: Snow Maze](https://www.youtube.com/watch?v=D0jKDtJPqLM)。ユーザーが指定した動画1本から音声を抽出し、MP3へ変換して[audio/bgm/snow-maze-D0jKDtJPqLM.mp3](../../assets/audio/bgm/snow-maze-D0jKDtJPqLM.mp3)へ配置した。以前の別サイトのTrack 15は誤った音源だったため、採用を取り消した。ファイル名も変更し、旧音源のキャッシュを再利用しない。
- 検査値：MP3、48000Hz、ステレオ、110.485333秒、3,509,852バイト。FFmpegで全体のデコードに成功。
- SHA-256：`b78f13830baec1b0720954debb738ece16a4f7526bb02d05f4e82c6152362956`
- 検証ログ：`.artifacts/mission-4-2-bgm-elimination/`、音源差し替えの記録は`.artifacts/snow-maze-source-correction/`。再生APIの成功と聴感確認は分けて扱う。
