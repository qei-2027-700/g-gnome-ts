// Sources and user-confirmed cue assignments are recorded in docs/audio/bgm-mapping.md.
export const BGM_ASSETS:Readonly<Record<string,string|null>>={
 'bgm-snow-maze':new URL('../../../assets/audio/bgm/snow-maze-D0jKDtJPqLM.mp3',import.meta.url).href,
 'bgm-credits':new URL('../../../assets/audio/bgm/credits.mp3',import.meta.url).href,
 'bgm-mission-1-1-start':new URL('../../../assets/audio/bgm/mission-1-1-start.mp3',import.meta.url).href,
 'bgm-mission-1-1-sentry-combat':new URL('../../../assets/audio/bgm/mission-1-1-sentry-combat.mp3',import.meta.url).href,
 'bgm-mission-3-3':new URL('../../../assets/audio/bgm/mission-3-3.mp3',import.meta.url).href,
 // Track 02: Union March; user-provided extraction of the reference video.
 'bgm-union-march':new URL('../../../assets/audio/bgm/union-march.mp3',import.meta.url).href,
 // Track 12: Fighting on the Tundra; assigned to the 2-6 Meson tower defense.
 'bgm-fighting-on-the-tundra':new URL('../../../assets/audio/bgm/fighting-on-the-tundra.mp3',import.meta.url).href,
 // Merc region theme. A provisional 2-1 cue is memoed in docs/missions/mission-2-1.md and is not wired.
 'bgm-merc-region':new URL('../../../assets/audio/bgm/merc-region.mp3',import.meta.url).href,
 // User-assigned Scorp region theme. The upload title says Track 06: Credits. Not wired, and not the existing credits file.
 'bgm-scorp-region':new URL('../../../assets/audio/bgm/scorp-region.mp3',import.meta.url).href,
 // Upload titles only. Acquired 2026-11-18. Not wired, except Sheridan, the 3-5 launch cue.
 'bgm-barren-landscape':new URL('../../../assets/audio/bgm/barren-landscape-ZJb2W-SxDAo.mp3',import.meta.url).href,
 'bgm-infiltrating-darken-territory':new URL('../../../assets/audio/bgm/infiltrating-darken-territory-j_oylgkm3Fo.mp3',import.meta.url).href,
 'bgm-sneaking-in':new URL('../../../assets/audio/bgm/sneaking-in-mziZW_QQPJI.mp3',import.meta.url).href,
 'bgm-rescuing-kylie':new URL('../../../assets/audio/bgm/rescuing-kylie-FB664mAqM28.mp3',import.meta.url).href,
 // Track 11: Sheridan. Plays at the 3-5 launch. The upload title is not an official name.
 'bgm-sheridan':new URL('../../../assets/audio/bgm/sheridan-ckEY6gEo_2A.mp3',import.meta.url).href,
 'bgm-merc-ambush':new URL('../../../assets/audio/bgm/merc-ambush-1JM8Vrm8TX8.mp3',import.meta.url).href,
 // Upload titles only. Acquired 2026-11-18. Not wired, except Defeated (3-5 ion cue) and Crossing the War Zone (3-2 start).
 'bgm-undercover-operations':new URL('../../../assets/audio/bgm/undercover-operations-TxUlQ-EEK1o.mp3',import.meta.url).href,
 'bgm-betrayal':new URL('../../../assets/audio/bgm/betrayal-uWpTUXuLG_g.mp3',import.meta.url).href,
 // Track 18: Defeated. Plays two seconds before the 3-5 ion announcement. The upload title is not an official name.
 'bgm-defeated':new URL('../../../assets/audio/bgm/defeated-4XJIibD6gr8.mp3',import.meta.url).href,
 // Track 19: Crossing the War Zone. Plays at the 3-2 launch. The upload title is not an official name.
 'bgm-crossing-the-war-zone':new URL('../../../assets/audio/bgm/crossing-the-war-zone-BROWgPMUPDg.mp3',import.meta.url).href,
 'bgm-passenger':new URL('../../../assets/audio/bgm/passenger-icXcc3u4Po4.mp3',import.meta.url).href,
};
