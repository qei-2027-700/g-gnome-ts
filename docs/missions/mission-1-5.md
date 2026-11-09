# Mission 1-5「Rescue!／救出！」

## 資料と確定範囲

- [原作の任務画面](../reference/mission-1-5-rescue-screen.png)。画面には「Cross bridge at Chambers Pass. Contact Kylie」「Defeat Meson Tower」「Defeat Security forces」「Set IFF to 0024」の4項目と、川・橋・山地の地図が表示される。
- ユーザー指定：Darken Tactical Defense HAWCに搭乗して開始する。左手のDarken Rocket Towerはしばらくして攻撃を始め、この任務のミサイルは追尾しない。直進先にDarken ASV、崖の先にBridge Control BuildingとDarken Sentry HAWC、その近くにShield Generatorがある。敵を倒してGeneratorを破壊し、施設に入って橋を下げる。橋へ向かう途中にDarken TD HAWC、橋の手前にDarken Power Plant、Meson Guard Tower、Darken Sentry HAWCがいる。左奥の川の橋を渡るとキリーから通信が入り、数秒後に成功する。
- ユーザー指定により、開始時のIFFは`0024`とする。原作画面にIFF設定目標が表示されるが、原作の開始IFF値は確認していない。
- ユーザー指定：川は東西方向に流れ、プレイヤーは東側から西側へ進む。Bridge Control Buildingは北西端にあり、空は夕焼けとする。地図の方位と相対配置を合わせる指定であり、正確な座標は未確認。
- [原作プレイ動画](https://www.youtube.com/watch?v=eYHjjhCqb1c)は索引済み。動画内の出撃位置、敵の正確な数、座標、攻撃時刻、通信の台詞、失敗条件は未確認。[EASY攻略記事](https://ameblo.jp/g-nome/entry-12450789427.html)の別経路は今回の成功条件へ採用していない。

## 実装

Mission選択から1-5を選ぶと、Darken TD HAWCに搭乗し、東側から西を向いて開始する。川は地図上で東西に延び、北西の橋付近にBridge Control Buildingを置く。空には夕焼けの色設定を使う。IFFは`0024`で開始し、BGMは既存の`bgm-mission-1-1-sentry-combat`を出撃時から再生する。4つの画面目標に加えて、シールドジェネレーターの破壊と橋の下降を進行条件にしている。ジェネレーターが稼働中は同じ軍の施設へ入れない共通処理を使う。

Meson Guard Towerと警備部隊を排除し、橋制御棟で橋を下げ、IFF `0024`のまま渡河地点へ到達すると、キリーの通信を再生する。3秒後に任務成功とする。主人公の死亡は失敗とする。

地形座標、敵の数と配置、Darken Rocket Towerの攻撃開始7秒、キリー通信後の3秒、敵IFF `6707`、施設の耐久値は試作の仮値。Darken Rocket TowerとMeson Guard Towerは既存のScorp／Mercの塔を任務内でDarken所属に上書きした暫定外観であり、原作のDarken塔の形状と装備は未照合。Rocket TowerのUNKPA誘導倍率はこの任務だけ0にしている。

Easy／Mediumの攻略可能性、山や施設の遮蔽、原作動画との配置照合、実ブラウザでの音声は継続確認が必要。
