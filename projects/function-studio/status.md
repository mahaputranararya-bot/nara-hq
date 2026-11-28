# Function Studio (Mr. Darwin, Grade 10 Math, Term 3) — status

**CEO:** School CEO (built directly by Azalea, because building and testing a game needs shell access)
**AI use:** Full (the teacher allows AI to build the work). Nara, Kayyira and Uno should still understand how it works so they can present it.
**Group 5:** Nara (Code / Play-Test Engineer & Crew Lead), Kayyira (Creative & UX Designer), Uno (Math Anchor & Showcase Host)
**Parts:** (1) the f(x)plained YouTube Shorts channel, (2) the story game **Functionia**

## Functionia — DONE (v1.0), ready for the peer play-test
- Folder: `projects/function-studio/functionia/` → double-click `index.html` (works offline, Chrome/Edge).
- Built from `FUNCTIONIA_MASTER_PROMPT.md` (all 13 milestones, M0–M12).
- Tests: `node --test` (70 pass, including 15,000 generated puzzles); browser tests in `tests/e2e/` all pass.
- **v1.2 (27 Nov):** puzzle panel redesigned (no overlapping text), richer characters and scenes, new music and sound engine.
- **v1.3 preview (27 Nov):** Mirrorvale showcase: painted scene with mirror lake and aurora, new Mirror Queen, new Ori, GPU glow (Settings → Glow & lighting), new "Mirror Waltz" music. Uploaded as functionia-v1.3-preview.zip; the group liked it (asked for a taller Queen).
- **v1.4 (27 Nov):** taller Queen, painted title screen + main theme, the opening as a short film, painted Realm Map, frosted-glass GUI. All tests pass. Uploaded to Google Drive as functionia-v1.4.zip.
- **v1.5 (28 Nov):** crew credits (Nara, Uno, Kayyira), slower 49-second film, Skip fixed, cool transitions, island dioramas, all six kingdoms painted with brush strokes (painterly), five rulers redrawn. All tests pass. Uploaded to Google Drive as functionia-v1.5.zip.
- **v1.6 (28 Nov):** "Click to begin" screen so the music plays from the start, shorter credits, hold-to-skip (no accidental skips), smooth dissolves in the film montage, a new flowing Cubrion waterfall, characters lit by their kingdom's light (rim light, brush texture, shadows), a better glitch effect, and more depth in every kingdom. All tests pass. Uploaded to Google Drive as functionia-v1.6.zip.
- **v1.7 (28 Nov):** Nara finished the game and asked for better credits, Story Replay with visuals, and a much better ending. Done: The Glitch redrawn in the painted style (angry, hurt, lonely, friendly), the ending as a short film (the lonely Glitch at x = 0, its new home, the Grand Graph rebuilding, everyone at sunrise), Story Replay that plays every scene on its own set (and never changes the save), movie-style credits with the cast, and The Glitch now visible in the Final Battle. All tests pass. Uploaded to Google Drive as functionia-v1.7.zip.
- **Possible next:** a music theme for each kingdom in the new style.
- Docs in `functionia/docs/`: README (handover), HOW_TO_PLAY + a printable one-page card, ANSWER_KEY (for Uno's sign-off),
  DECISIONS, PLAYTEST_CHECKLIST, RUBRIC_SELF_ASSESSMENT, PROGRESS.

## Next steps (for the crew)
1. **Uno:** check `docs/ANSWER_KEY.md` and tick each box (final math sign-off).
2. **Kayyira:** play it, then decide which art to replace (all drawing is in `js/engine/art.js`, `portraits.js`, and the `drawBody` functions in `ori.js` and `delta.js`).
3. **Nara:** run the peer play-test with 2+ crews using `docs/PLAYTEST_CHECKLIST.md`, then fix the top 3 stuck points.
4. Paste the f(x)plained Shorts links into `js/data/shorts.js` once the videos are up.

## Deadlines
- Not given yet. Ask Nara for the play-test and showcase dates.
