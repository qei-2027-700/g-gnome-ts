# 参考資料とmacOSでの原作プレイ

- 作品：G-Nome再現
- 媒体：原作PCゲームの調査、ブラウザゲーム制作
- 対象：参考ブログ、原作マニュアル、macOSでの動作環境
- 状態：資料を保存済み。Macでのゲーム動作は未検証
- 確認日：2026-10-22
- 関連：[企画](../../README.md)、[機体・武器の調査](vehicles-and-weapons.md)

## 日本語の参考ブログ

[G-NOMEのページ](https://ameblo.jp/g-nome/)

ユーザーが有用な参考資料として指定したブログ。旧Geocitiesから移転したG-Nome専門の個人サイトで、機体・武器、攻略、操作の調査に使う。

| 参照先 | 用途 |
| --- | --- |
| [製品版登場ビークル詳細](https://ameblo.jp/g-nome/entry-12450788879.html) | 機体ごとの速度、防御、武装の確認 |
| [製品版登場兵器詳細](https://ameblo.jp/g-nome/entry-12450789266.html) | 武器の射程や威力の確認。記事は未完 |
| [プレイのコツ・ミニコラム](https://ameblo.jp/g-nome/entry-12450789611.html) | 操作・戦術・実プレイ上の挙動を調べる入口 |
| [デモ版の案内](https://ameblo.jp/g-nome/entry-12450790068.html) | デモ版の操作・仕様を確認。製品版とは区別する |

個人の解説・観察は、原作マニュアルの掲載仕様や実機での検証結果と区別する。古い入手先・価格・インストール手順が現在も有効とは扱わない。

## 全ミッションの参照情報（2026-10-29）

[全ミッション調査](../missions/campaign-catalog.md)に、本編22任務と訓練3種の概要・出典・未確認事項をまとめた。j-boxの攻略動画24本のタイトル・説明文を取得し、[動画索引](mission-video-index.json)へURL・尺・投稿日を保存した。動画全編の画面・音声の検証は未実施。

日本語の[EASY攻略記事](https://ameblo.jp/g-nome/entry-12450789427.html)は2-4まで、[Locke130のFAQ](https://gamefaqs.gamespot.com/pc/197456-g-nome/faqs/14087)は1-4の目標までを扱う。いずれも全任務の攻略としては使わない。後半の概要は任務ごとの動画説明を参照し、原作画面で確認済みの事実と区別する。

## 保存した英語マニュアル

[G-Nome英語マニュアルPDF](manuals/G-Nome_Manual_Win_EN.pdf)

| 項目 | 記録 |
| --- | --- |
| 入手ページ | [My Abandonware / G-Nome](https://www.myabandonware.com/game/g-nome-dqe) |
| ダウンロード入口 | `https://www.myabandonware.com/download/m31y-g-nome` |
| 今回の転送先 | `https://d3.xp.myabandonware.com/f/m31y/G-Nome_Manual_Win_EN.pdf` |
| 保存日 | 2026-10-22 |
| ページ数・容量 | 67ページ、1,593,515バイト |
| SHA-256 | `56968b06602d222798b5525270cc4678a242c570e88f60f87b1f6cb1a89431fe` |
| メタデータ | Title: `G-NOMEdocfinal.qxd`。作成年は1998年。1997年初版と同一内容かは未確認 |
| 内容確認 | 表紙とMerc Sentryのページを画像化して確認。目次と該当ページのテキストを抽出 |
| 基本検査 | `pdfinfo`でJavaScriptなし、暗号化なし。`pdfdetach -list`で埋め込みファイル0件。マルウェアの完全な検査・安全性の保証ではない |

配布元は権利元の公式サイトではないため、サイト全体を安全・正確と保証するものではない。今回はPDFとして読み取れること、G-Nomeのマニュアル本文であること、上記の基本検査結果を確認して資料用に保存した。ゲーム本体やインストーラーは取得・実行していない。

Merc Sentryの仕様は本文p.50（PDFの52ページ目）に掲載されており、最高速度85km/h、シールド22、エネルギー1100、RAIDレーザー2門、CHUMロケットラック1基・25発、自動脱出なしを目視で確認した。

その他の機体・武器表と既存調査表の全面照合は未完了。原作マニュアルを優先するが、実際の製品版との違いが判明した場合は両方の記録を残す。

## 現在のmacOSでプレイできるか

Windows向けの原作をmacOSで直接起動することはできない。ただし、エミュレーター内に当時のWindows環境を用意すれば動かせる可能性がある。「現在のMacではプレイ不可能」とは判断しない。

第一候補は次の構成。

```text
macOS（Intel / Apple Silicon）
  → DOSBox-X
    → Windows 95 または Windows 98 SE
      → G-Nome
```

[DOSBox-X公式サイト](https://dosbox-x.com/)にはIntel Mac・ARM Mac向けの配布があり、Windows 9xのゲスト実行をサポートしている。[Windows 95の導入ガイド](https://dosbox-x.com/wiki/Guide:Installing-Windows-95)も公開されている。通常のDOS環境でG-Nomeの実行ファイルだけを起動する構成ではなく、Windows環境を用意する。

[The Collection ChamberのG-Nome記事](https://collectionchamber.blogspot.com/p/g-nome.html)には、DOSBox-X内のWindows 95を使った動作例がある。ただし記事のテスト環境はWindows 10で、Macでの確認報告ではない。公式のMac対応とこの動作例を根拠に、Macでも検証する価値があると判断する。ユーザーのMacでの起動・速度・音・入力は未検証。

検証時は利用できるWindows・ゲームの媒体を確認し、DOSBox-XのCPU・映像・音の設定を調整する。まず起動、ミッション開始、移動・射撃、音、セーブを確認し、再現開発の比較環境として使えるか判断する。エミュレーターやWindows環境のインストールは今回行っていない。
