---
name: gnome-bgm-import
description: G-Nomeの参照YouTube音源をHomebrewのyt-dlpとFFmpegでMP3にし、用途別に配置して任務のBGMへ接続する。曲のURL・再生場面の記録だけの場合は音源を取得しない。
---

# G-NomeのBGM取り込み

このフォルダから `../../..` がリポジトリのルート。曲と場面の正本は [BGM対応表](../../../docs/audio/bgm-mapping.md)。ユーザー指定のURL・用途を確認し、開始曲・戦闘曲・領域曲を混同しない。正式曲名や切り替え条件を動画の曲順から推定しない。

## MP3の取得と配置

[yt-dlp公式のHomebrew手順](https://github.com/yt-dlp/yt-dlp/wiki/Installation#homebrew)と[音声抽出オプション](https://github.com/yt-dlp/yt-dlp#post-processing-options)に基づく。まず `command -v yt-dlp ffmpeg ffprobe deno` で確認し、不足していれば `brew install yt-dlp ffmpeg deno` を使う。既存ツールの更新は必要になった場合に行う。

リポジトリのルートで、次の補助スクリプトへ対象URLと保存先を渡す。

```sh
python3 .agents/skills/gnome-bgm-import/scripts/import_mp3.py \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  'assets/audio/bgm/mission-N-N-start.mp3'
```

内部では `yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 0` を使う。URLは引用符で囲み、再生リスト全体を取得しない。品質0は変換品質の指定であり、元音源より高音質になる指定ではない。既存MP3を上書きせず、ffprobeで形式・尺を、FFmpegで全体のデコードを確認する。出力JSONには尺・形式・バイト数・SHA-256が含まれる。

音源をデスクトップへ取得済みなら、対象の曲か確認したうえで `assets/audio/bgm/` へコピーし、元ファイルとハッシュを照合する。参照画像や任務資料のフォルダに音源を混ぜない。失敗した取得を成功として記録せず、ネットワーク制限などで取得できない場合は、再実行コマンドと未配置の状態を残す。別の曲や無音ファイルで代用しない。

## 任務への接続

- `src/game/content/music.ts` に曲IDと音源URLを登録する。未配置の音源と実際に使える音源を区別する。
- `src/game/content/missions/` の対象任務にBGMの開始条件を設定する。共通処理へ任務IDの分岐を追加しない。
- `src/game/presentation/audio.ts` の共通BGM処理を使い、音量・消音、ポーズ、再開、再挑戦、中断、手動選曲との関係を保つ。原作未確認のループや遅延を使う場合は仮設定と記録する。
- 音源の出典と検査値をBGM対応表へ、配置先を `assets/README.md` へ反映する。

## 検証

補助スクリプトは既存MP3の検査でも実行確認できる。再生開始・停止・重複防止の関連テストを行い、共通処理を変更した場合は全体テストと型チェックを含むビルドを行う。実ブラウザで対象任務を開始し、音源の読み込みと再生時間の進行を確認する。メディアの再生成功と、実際に耳で聞いた確認を区別する。ログは `.artifacts/` に保存する。
