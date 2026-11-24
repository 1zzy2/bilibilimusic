# Live rooms implementation plan

**Goal:** Implement the approved live room search, audio playback and persistent history.
**Architecture:** Separate live-room model and view; existing player consumes freshly resolved HLS sources. Existing loopback forwarder rewrites HLS references.
**Tech Stack:** React, TypeScript, Electron, hls.js, Node HTTP.
**Spec:** docs/live-rooms-design.md

- [x] Test and implement bounded HLS playlist rewriting in res/.service/request-forwarder.js; retain streaming for ordinary media. Cover relative/absolute references, URI attributes, errors.
- [x] Add renderer/core/live-rooms API, mapping and history module; test canonical IDs, HTML stripping, deduplication and limits.
- [x] Add live room results and history view, search tab after sheet and sidebar route after recently_play. Handle pagination, stale requests and retry.
- [x] Integrate player fresh resolution, successful-start history, live seek suppression and separate song history.
- [x] Run focused tests, TypeScript and renderer build; review integration and document remaining local playback check.

Ruling: directory is not a Git repository; use .codex-backups/live-20261124 for originals and work in place.

## Verification
- Eight focused tests passed: playlist URI rewriting, real HTTP forwarding, metadata mapping, bounded history, offline-room preservation, pause/current-song cancellation and out-of-order selection.
- TypeScript check and main/renderer webpack builds passed; existing lyric matching test passed.
- Production API online check returned 31 rooms for 德云色, resolved room 6 and fetched a media segment with HTTP 200.
- Independent reviewer found pending-selection cancellation races; fixed and regression-tested.
- Desktop QA confirmed sidebar and empty live-history view. Automated clicks paused because local user input was detected. Full in-app playback and history persistence across restart remain for local acceptance testing.
- release/Music-live-win32-x64 uses an isolated portable QA profile. release/Music-live-release-win32-x64 excludes that profile and uses the normal existing application configuration.
