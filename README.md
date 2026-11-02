# G-Nome再現プロジェクト

1997年のPCゲーム「G-Nome」を、Babylon.js・TypeScript・Viteでブラウザ上に再現するプロジェクト。最初の対象は製品版1-1。全編への拡張を見据える。

## 公開URL

https://g-gnome-ts.pages.dev/

Cloudflare Pagesで自動デプロイ。mainへのpushで更新される。

## 試作版を起動する

Node.js 22.18以降を使用する。

```sh
pnpm install
pnpm dev
```

`http://127.0.0.1:5173` を開き、「任務開始」を選ぶ。Wで近くのUnion Sentryへ進むと搭乗できる。Eで敵を選び、Tで追尾照準、1/2で射撃、Bで任務地図。

[2-4 Merc編の雪原](docs/missions/mission-2-4.md)も任務選択から開始できる。Merc Tactical Defense HAWCに搭乗し、雪原・雪山と専用の機内表示を確認できる。敵配置・クリア条件は未確認。

[2-6 Battle of Clouds](docs/missions/mission-2-6.md)を任務選択から開始できる。徒歩からミーゾン・ガードタワーへ搭乗し、キリーとともに四方のMerc AIPを迎撃して、要塞から出たターンを回収する。敵数・必要撃破数・配置は試作の仮設定。

[4-2 Scorp Defense](docs/missions/mission-4-2.md)も任務選択から開始できる。草原と夕焼けの中、キリー・ターン・Scorp守備隊と協力し、Union AIP2機による電力プラント攻撃にも対処して基地を守る。原作クレジット曲を使用。配置・性能・地上編成・勝敗条件には試作値を含む。

[起動手順・操作・実装範囲](docs/technical/playable-1-1.md)に、仮設定と未実装の仕様、検証の限界を記録している。完全再現の前段階となる試作版。

## コード構成

`src/game/` は `simulation/`（ゲーム状態とルール）、`presentation/`（画面・音）、`content/`（機体・武器・任務データ）に分ける。設定・入力変換・セッション制御は直下に置き、テストは実装の隣に置く。使用素材は`assets/`、原作の調査資料は`docs/reference/`へ分ける。[構成と検証](docs/technical/playable-1-1.md#構成と検証)を参照。

## 制作資料

[制作資料の目次](docs/README.md)を入口にする。ミッション、登場人物、ゲーム仕様、音・音声、技術設計、参考資料に分類している。

最初の再現対象は[製品版1-1](docs/missions/mission-1-1.md)。作業順序と採用技術は[実装計画](docs/technical/implementation-plan.md)を参照。

## 採用する構成

Babylon.js・TypeScript・Viteで、コードとデータファイルを中心に制作する。シングルプレイはフロントエンド内で動かす案とする。操縦・戦闘・AI・乗降・ミッション進行は独自に実装する。詳細は[実装計画](docs/technical/implementation-plan.md)を参照。

| 要素 | 実装案 |
| --- | --- |
| 地形・機体・建物 | Babylon.jsで描画し、低ポリゴンと低解像度テクスチャで当時の表現を目指す |
| コックピット・照準・レーダー | 3D描画にHTML/CSSや画像を重ねる |
| 徒歩移動・機体操縦・乗降 | 搭乗状態に応じて操作とカメラを切り替える |
| 射撃・敵AI・ミッション | ゲーム独自の処理として実装する |

設定画面を初回から用意する。難易度は3段階で初期値はEasy。BGMも重要な再現項目として、曲と場面の対応、再生・音量・消音を調査する。

## 参考ページ

- [G-NOMEのページ](https://ameblo.jp/g-nome/)：機体・武器・攻略・操作の日本語専門ブログ。記事別リンクと出典の扱いは[参考資料一覧](docs/reference/sources-and-macos.md)参照。
- [英語マニュアルPDF](docs/reference/manuals/G-Nome_Manual_Win_EN.pdf)：取得元・確認範囲は同一覧に記録。
- [The Collection Chamber: G-NOME](https://collectionchamber.blogspot.com/p/g-nome.html)：原作紹介・画面写真・操作・ゲームシステムの解説。
