# Radio voice clips

Generated project dialogue, not original G-Nome recordings. Dialogue text is maintained in `src/game/content/radio-dialogue.ts`.

The clips were synthesized locally in a browser with [Kokoro.js](https://github.com/hexgrad/kokoro/tree/main/kokoro.js) and the [Kokoro ONNX model](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX). Upstream model: [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), Apache-2.0. Voice metadata and attribution: [official voice table](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md).

| Character | Japanese source | English source | Pitch | Rate |
| --- | --- | --- | --- | --- |
| Kylie | jm_kumo (male) | am_puck (male) | 0.94 | 1.04 |
| Sheridan | jm_kumo (male) | am_fenrir (male) | 0.78 | 0.88 |
| Thane | jf_alpha | af_heart | 1.2 | 1 |
| Wilkins | jf_alpha | af_heart | 1.2 | 1 |

Japanese readings are manually supplied in `tools/radio-voice-readings.json`; pronunciation and delivery remain provisional. Separate pitch and rate settings preserve the character profiles. Browser synthesis produces WAV data, then ffmpeg converts it to mono 22,050 Hz PCM16 and normalizes peaks to 0.45. The runtime mixes separate Web Audio sources, starting them 0.18 seconds apart.

## Regeneration

1. Run `node --experimental-transform-types tools/generate-radio-voices.mjs` with Node.js 22.18 or newer. It prepares `.artifacts/parallel-radio/tasks.json` and the browser generator page.
2. Open `http://127.0.0.1:5173/.artifacts/parallel-radio/tts.html` with the development server running, then select Generate radio voices. The model runs in the browser; no inference service receives the dialogue.
3. Save each generated textarea's base64 WAV under `.artifacts/parallel-radio/raw/<data-id>.wav`. Large base64 values must be transferred in chunks; validate the RIFF byte count before accepting a file.
4. Run the generation command with `--finalize`. It requires ffmpeg and rejects empty, truncated or silent source audio before generating `radio-voice-assets.ts`.
5. Run `src/game/presentation/audio.test.ts` to check coverage and overlap scheduling.

Model files and temporary raw speech remain outside the shipped assets. Only these WAV clips and their URL manifest are shipped.
