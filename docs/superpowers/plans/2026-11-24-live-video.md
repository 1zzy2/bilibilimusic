# Live video implementation plan

Goal: Show live video on the existing detail page, with bottom-right picture-in-picture and fullscreen controls as requested.

Design: The playback controller owns one HTMLVideoElement, shared with existing audio controls. Detail view mounts that same element without replacing its source; when hidden, a persistent offscreen host keeps it connected for picture-in-picture and continued sound. Ordinary music keeps the cover/lyrics layout. Fullscreen covers the video area and includes playback/volume/exit controls. Errors are shown inline.

- [x] Test then implement persistent media-surface ownership and mount/unmount lifecycle.
- [x] Expose the controller video to the live detail component; integrate picture-in-picture and fullscreen with feature checks and event cleanup.
- [x] Replace cover/lyrics only for live items and guard Escape while fullscreen.
- [x] Run focused regressions, type checking, renderer build and independent review; update the user's local application with backup.

Acceptance: Same playback element in all modes; no duplicate sound or source reset on detail navigation. Picture-in-picture remains active on collapsing details. Fullscreen exits to details. Normal songs retain existing layout. Actual video decoding and native window modes require application-level confirmation.

Verification: 11 focused tests passed; TypeScript and renderer webpack builds passed. Independent review identified passive-effect teardown risk; changed mounting/parking to layout-effect cleanup. Updated out/Music-win32-x64 and release builds, hash checked. Native UI inspection confirmed live video decoded, frame changed between observations, and player entered Playing with pause controls. Native PiP/fullscreen acceptance remains unconfirmed: local input was detected during mode-switch checks, so automation stopped.
