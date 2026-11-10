# assets ディレクトリ整理計画

状態：実施済み（2026-11-10、#59）。原作スクリーンショットは `assets/reference/` にある。以下は移動前の配置と、そのとき使った手順である。

実施で手順と違えた点：

- `assets/cockpits/scope-sentry-hawk.png` は Scorp Sentry の機内が読むので、`assets/cockpits/` に残した。
- `assets/cockpits/scope-assault-hawk.png` と `assets/hawk-building/scope/scope-assault-hawk.png` は同じ内容だったので、`assets/reference/scope-assault/scope-assault-hawk.png` の1枚にした。
- `assets/cockpits/union-td-hawk.png` は機内、`assets/hawk-building/union/union-td-hawk.png` は性能カードで、ファイル名が同じだった。カードは `assets/reference/union-tactical/union-td-hawk.png`、機内は `assets/reference/union-tactical/cockpit.png` にした。
- 一つの機体や施設に定められない任務中の風景は、ファイル名を変えず `assets/reference/missions/` に置いた。
- `assets/ui-system/ui-system-end.png` は追跡される `assets/ui/ui-system-end.png` へ移した。

原作の参照画像を、視点別・勢力別のフォルダではなく、機体または施設ごとに1ディレクトリへまとめる。ゲームが読み込む素材と、原作スクリーンショットは分ける。

## 分ける場所

| 種類 | 置き場所 | Git |
| --- | --- | --- |
| ゲームが読み込む機内フレーム | `assets/cockpits/` | 追跡する |
| ゲームが読み込むUI | `assets/ui/` | 追跡する |
| 音声 | `assets/audio/` | 追跡する。動かさない |
| 原作スクリーンショット | `assets/reference/` | `.gitignore` でビルドに含めない |
| 用途と対応 | `assets/README.md` | 追跡する |

実行時コードは `assets/reference/` を import しない。参照画像をゲームの描画へ使うときは、これまでどおり `assets/cockpits/` または `assets/ui/` に実行用のコピーを置く。

## 参照画像のディレクトリ

`assets/reference/` の直下は、機体または施設ごとに1ディレクトリとする。視点ごとの `cockpit/` や `side/`、勢力ごとの `darken/` は作らない。コクピット、正面、側面、背面、黒い性能カードは、そのディレクトリへ平らに置く。視点はファイル名に書く。

フォルダ名は [機体画像の保存先](../reference/vehicles/README.md) の既存名に合わせる。コードの kind が `scorp-*` でも、資料が `scope-*` のものは資料名を使う。`scope-sentry` と `scorp-meson-tower` のように資料側の表記が揃っていないので、移動のときに資料名を新しく揃えない。

同じ勢力でも機体が違えば分ける。Darken Sentry と Darken Tactical は、今の `assets/hawk-building/darken/` ではなく `darken-sentry/` と `darken-tactical/` にする。Sentry、Tactical、Assault、ASV、AIP、ミーゾンタワー、ロケットタワー、橋制御棟も同じ形にする。

画像は主題が一つになる場所にだけ置く。峡谷や川や塔が写っていても、主題が搭乗中の Darken Tactical なら `darken-tactical/` に置き、任務資料からはリンクする。徒歩視点の塔の外観は、その塔のディレクトリに置く。

出撃前の地図コンソールと、難易度・通信のメニューは機体ではない。`assets/reference/missions/` と `assets/reference/ui/` に置く。

`asdf` や `1-5-.png` のような名前は、中身を見るまで変えない。中身から視点が分かるものだけ `front`、`rear`、`side`、`cockpit` に変える。場所だけ移す。

## 実行用コピーは残す

次のファイルはコードが import している。参照側へ移すときは、import とテストのパスを同時に変える。参照用の原本だけを移し、実行用コピーを残す場合は import を変えない。

- `assets/cockpits/scorp-reference.png`
- `assets/cockpits/union-tactical-reference.png`
- `assets/cockpits/darken-sentry-hawk.png`
- `assets/cockpits/visom-reference.png`
- `assets/cockpits/merc-td-hawk.png`
- `assets/cockpits/union-asv-reference.png`
- `assets/cockpits/bridge-control-building.png`
- `assets/cockpits/merc-assault.png`
- `assets/cockpits/merc-mison-guard-tower.png`
- `assets/cockpits/union-sentry-reference.png`
- `assets/ui/mission-console.png`
- `assets/ui/mission-4-3-map.png`

`assets/cockpits/` にあり、コードが import していない参照画像は、対応する `assets/reference/` へ移せる。

- `merc-mison-guard-tower2.png`
- `merc-mison-guard-tower4.png`
- `merc-td-hawk2.png`
- `scope-assault-hawk.png`
- `scope-sentry-hawk.png`
- `scope-td-hawk.png`
- `union-td-hawk.png`

追跡済みでコードが使っていないルートの画像もある。`assets/4-2-開始時-右手にscopeロケットタワー.png` は参照画像。`assets/bridge-control-building.png` は、コードが読む `assets/cockpits/bridge-control-building.png` とは別のコピー。`assets/3-1-start.png` と `assets/union-.png` は作業ツリーにあり、Git の追跡対象ではない。

`assets/audio/**` は動かさない。

## 終了扉

`src/game/presentation/mission-completion.ts` は `assets/ui-system/ui-system-end.png` を読む。`src/game/session.test.ts` はそのファイル名を確認する。`assets/ui-system/` 全体は `.gitignore` にあるため、クローン直後には扉の画像が無い。

実施時は `ui-system-end.png` を追跡される `assets/ui/` へ移し、import、テスト、次の資料リンクを更新する。

- `docs/audio/mission-controls-and-audio.md`
- `docs/gameplay/mission-map-and-waypoints.md`
- `assets/README.md`

同じディレクトリの `difficulty.png` と `ui-通信.png` はメニューの参照画像であり、ゲームは読まない。`assets/reference/ui/` へ置く。

## いま無視している参照

`.gitignore` は `assets/hawk-building/`、`assets/mission-map/`、`assets/ui-system/`、`assets/*.png` を無視する。一度追跡したファイルは、無視ルールの後も追跡されたまま残る。

`assets/hawk-building/` と `assets/mission-map/` の中身は、上の規則で `assets/reference/` へ移す対象である。移し終えたあとに空になるディレクトリは消してよい。

## リンクが現物と違う箇所

実施時に、移動先へリンクを直す。

| 文書上のパス | 現物 |
| --- | --- |
| `assets/merc-mison.png` | `assets/hawk-building/merc/merc-mison.png` |
| `assets/merc-assult-hawk-yoko.png` | `assets/hawk-building/merc/merc-assult-hawk-yoko.png` |
| `assets/cockpits/merc-mison-guard-tower3.png` | `assets/hawk-building/merc/2-6-merc-mison-guard-tower3.png` |
| `assets/4-2-scope.png` という参照 | `assets/mission-map/4-2-scope.png` |

`assets/README.md` は、実行用素材だけを置くと書きながら、無視された参照画像も表に載せている。実施後は、実行用コピーと `assets/reference/` の原本を分けて書く。

## 実施時に更新する文書

- `.gitignore`：`assets/reference/` を無視する。`assets/ui/` に移した終了扉は無視しない。
- `assets/README.md`
- `docs/technical/content-extension.md`
- `docs/technical/mission-definitions.md`
- `docs/technical/codex-rules.md`
- 移動したパスを指している `docs/missions/`、`docs/reference/`、`docs/gameplay/`、`docs/audio/`
- 保存先を書いているスキルがあれば、その表。現在の `.agents/skills/` は `assets/` のパスを持っていない。

`docs/reference/vehicles/` の説明文書そのものは、画像の移動だけでは分割しない。Darken の説明は引き続き `docs/reference/vehicles/darken/README.md` に置き、画像リンクだけ新しい参照ディレクトリへ向ける。
