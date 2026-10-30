# Union Tactical Defense HAWCの画像資料

- 作品：G-Nome再現／媒体：ブラウザゲームの原作資料
- 対象：Union Tactical Defense HAWC（Rampage）の機内表示
- 状態：機内画像の適用先はユーザー指定。機体諸元は[マニュアルp.22](../../manuals/manual-p22.png)下段を参照

[1-3-darken軍-sentry-hawk.png](1-3-darken軍-sentry-hawk.png)は、ユーザーがUnion Tacticalの機内再現に指定した画像。元のファイル名を保存しているが、その名前だけでDarken Sentryの資料と判定しない。Union Sentry（Prowler）とは[別の機体](../union-sentry/README.md)として扱う。

機内表示への反映と未確認箇所は[コックピット仕様](../../../gameplay/cockpit-hud.md)を参照する。機体の基本仕様は[機体・武器資料](../../vehicles-and-weapons.md)で管理する。

## 脚の細さと長さ（2026-10-24）

ユーザー指定により、脚を従来より細く、長くした。今回の試作では脚全体の横幅を18％、前後の厚みを10％減らし、長さを10％伸ばす。腰の位置を上げ、太もも・膝下・足先を同じ比率で調整する。上部の胴体・コックピット・武装と公称全高7.5m、機体性能は維持する。

主要な比率・腰の位置・脚の命中領域は`vehicle-shapes.ts`で共有する。歩行時は伸ばした脚の長さと足先の厚みに合わせて接地を計算し、ホログラムにも細長い脚を反映する。Merc・ScorpのTactical Defense HAWCにはこの比率を適用しない。正確な寸法は原作の計測値ではなく、マニュアル下段の機種識別と今回の指定に基づく試作値とする。
