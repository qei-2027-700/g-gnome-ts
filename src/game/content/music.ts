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
};
