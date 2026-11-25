# 4-5「Sheridan's Lair」原作動画の音声確認箇所

- 原作動画：[G-NOME [Win95 PC] Walkthrough: Mission 4-5 "Sheridan's Lair"](https://www.youtube.com/watch?v=_XcvTyyTxyw&list=PLE530E2293252B429&index=24)（j-box、英語版、13分48秒）。動画IDは[任務動画索引](../../mission-video-index.json)にも登録済み
- 記録日：2026-11-25
- 確認方法：動画を一時領域に取得し、映像フレームで場面と時刻を照合した。音声は取得できたが、この作業環境では試聴できていない。以下の音色はユーザーの聴感であり、映像だけから確認したものではない
- 音声の切り出し：`.artifacts/mission-4-5-original-audio/`に、下表の各時刻を含む5～6秒のWAVを保存した。原動画の混合音声を時間で切ったもので、SEだけを分離した素材ではない。`.artifacts/`はGit対象外
- ローカル再生用：同じフォルダの`game/`に、短く再切り出しした6つのWAVを保持する。ユーザーの試聴でVISOMには男性の声が入り、P2MECとTCREAPも狙った音を拾えていないと分かったため、この3つは再生処理から外した。HAWC破壊音は採用し、音量を上げた。TCROCKとGAUS着弾は引き続き仮の切り出しを使う
- 再調査用：全編の`full-video-audio.mp3`と、VISOM・P2MEC・TCREAPの前後をずらした3秒の候補を`review/`へ保存した。いずれも原動画の混合音声

| 動画時刻 | 映像で確認した出来事 | 音声として確認・採集する対象 | 現在の確度 |
| --- | --- | --- | --- |
| [1:39–1:55](https://www.youtube.com/watch?v=_XcvTyyTxyw&t=99s) | Union Assault HAWCの機内画面から約1:42でVISOM誘導画面へ切り替わり、飛翔中の視点が続く | 発射直後の音、飛翔中の音、視点復帰前後の着弾音を分けて聴く。ユーザーは発射付近を「PPPバーウィー！」と聞き取った。`visom-1m42s.wav`（1:40.5–1:45.5） | 武器と画面切り替えは映像で確認。擬音と音の開始・終了はユーザー申告。ほかのSEとの分離は未確認 |
| [2:24](https://www.youtube.com/watch?v=_XcvTyyTxyw&t=144s) | Union Assault HAWCの機内HUDにTCROCKが表示され、前方で交戦が続く | ユーザーが「バーウィーgogogo...」と聞き取ったミサイル音。`tcrock-2m24s.wav`（2:22–2:27） | 武器名の表示は映像で確認。該当音がTCROCKの発射音か、着弾音などとの重なりは未確認 |
| [2:27](https://www.youtube.com/watch?v=_XcvTyyTxyw&t=147s) | 同じ機内HUDの1番にP2MECが表示され、赤い光が前方に見える | ユーザーが「djon」と聞き取った赤いレーザー音。`p2mec-2m27s.wav`（2:25.5–2:30.5） | 装備名と赤い光は映像で確認。発射音と命中音の区別は未確認 |
| [2:35](https://www.youtube.com/watch?v=_XcvTyyTxyw&t=155s) | 前方の機体周辺に爆発が映る | ユーザーによるとUnion Sentry HAWCの破壊音。`sentry-destroy-2m35s.wav`（2:33–2:38） | 爆発は映像で確認。破壊された機種、爆発音の単独性は未確認 |
| [3:13](https://www.youtube.com/watch?v=_XcvTyyTxyw&t=193s) | Union Assault HAWCの機内から、青い光線が通る交戦場面 | ユーザーによると敵Union Meson Guard TowerのGAUSが自機に命中した音。`gaus-hit-3m13s.wav`（3:11–3:16） | 青い光線は映像で確認。塔の所属、GAUSの型番、命中音の単独性は未確認 |
| [5:48](https://www.youtube.com/watch?v=_XcvTyyTxyw&t=348s) | Union Assault HAWCの機内HUDの2番にTCREAPが表示される | ユーザーが「てぃるるるん、てぃるるるん...」と聞き取ったマシンガン音。`tcreap-5m48s.wav`（5:46–5:52） | 2番の装備名は映像で確認。発射音の範囲とほかの音との重なりは未確認 |
| [6:05–6:19](https://www.youtube.com/watch?v=_XcvTyyTxyw&t=365s) | 機内HUDにP2MECが表示され、照準先の機体に光と爆発が繰り返し出る | P2MECの発射音、対象への命中音、機体破壊の爆発音を個別に聴き分ける候補 | 画面上の装備と着弾・爆発は確認。各音の発生元と音色は未確認 |

この動画はBGM、機体音、複数の武器音が重なる。切り出したWAVは聴き直しと再切り出しに使えるが、同じ区間を繰り返し再生すると背景音も繰り返す。原作SEの単独素材として扱う前に、発射・飛翔・命中・爆発の開始時刻と重なりを確認し、背景音を分けられるか検証する。現行の[合成発射音](../../../audio/mission-controls-and-audio.md#聴感ごとの発射音2026-11-10)と原作が一致したとは、まだ判断しない。原作音声ファイルの配布は、音源の権利と配布条件を確認してから決める。
