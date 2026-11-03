# Background music

| File                 | Plays on                                |
| -------------------- | --------------------------------------- |
| `home.wav`           | Every page except a case being played   |
| `interrogation.wav`  | `/game/<case>` (interrogating suspects) |

The admin area never plays music. If a file is missing, that part of the site is silent.

## Where this music comes from

Both loops are original: `scripts/make-music.py` synthesises them from scratch
(no samples, no third-party audio), so there is no licence to worry about.
Edit the notes in the script and run `python3 scripts/make-music.py` to remake them.
Each is a 48-second seamless loop.

## Swapping in different music

Put your own file here and change the path in `lib/sound/tracks.ts` (`TRACK_FILES`).
MP3 at 128-192 kbps is about 2-4 MB for 3 minutes. Make sure the track loops cleanly.
Only use music you have the right to put in a game other people can play: tracks on
streaming services (e.g. Apple Music) are licensed for listening, not for games, so
get permission from the rights holder first.
