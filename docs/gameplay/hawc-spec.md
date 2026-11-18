# HAWCの機種別仕様

HAWCの可動方式は機種ごとに決める。実装値は `src/game/content/vehicles.ts` の `torsoLimit` に置き、`0` は上半身が車体に対して独立して横旋回しないことを表す。車体全体の方向転換と上下照準は別の操作である。可動方式の共通規則は[機体・上半身・砲塔の旋回](vehicle-articulation.md)を参照する。

| 機種 | 上半身の独立した横旋回 | 根拠 |
| --- | --- | --- |
| Scorp Tactical Defense HAWC | なし。`torsoLimit: 0` | 2026-11-12のユーザー指定。[外観資料](../reference/vehicles/scorp-tactical/README.md) |
| Scorp Sentry HAWC | なし。`torsoLimit: 0` | 2026-11-12のユーザー指定。[機体資料](../reference/vehicles/scope-sentry/README.md) |
| Union Sentry HAWC | なし。`torsoLimit: 0` | 2026-10-24のユーザー指定。[機体資料](../reference/vehicles/union-sentry/README.md) |

上記3機種では、左右キーとマウスの横操作は機体全体を向ける。敵AIも目標へ機体を向け、上半身だけを横へ向けない。Scorp Tactical Defense HAWCの青い胸部と曲がった脚は[外観資料](../reference/vehicles/scorp-tactical/README.md)に記録し、旋回の設定値とは分ける。ほかの機種の可動範囲を、この3機種から推定しない。
