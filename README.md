# dandellas

Personal website with seeding (study notes, `input.html`), dandelion (research and projects), and untitled (photography).

A static site deployed from the main branch to the existing Vercel project. Open index.html locally or serve the repository root with a static server. No package installation or runtime credentials are required.

The font license notices are in assets/licenses. Photography and video are provided by the site owner. Scientific visuals are artistic interpretations; project notes distinguish research questions and reported experimental results.

## Optimized assets

The intro uses a high-quality 1080p/30fps H.264 encode with its MP4 index at the start for streaming. Original audio is retained.

The original Saira Stencil and Noto Serif KR outlines and variable axes are retained in WOFF2. Current-copy subsets load first; disjoint full-font Unicode ranges keep later text covered. Keep the bundled SIL Open Font License notices with all font derivatives.

Files in `assets/optimized/` have content hashes in their names and a one-year immutable browser cache. When changing a file, generate a new hash/name and update its reference; never replace bytes under an existing hash. Regular pages and styles retain the default revalidation policy.

## seeding notes (input.html)

`input.html` is generated. Edit the subject data in `tools/build_input.py`, then run `python3 tools/build_input.py .` from the repository root. Notes are concept summaries written for the site; exam questions and course materials are not reproduced.
