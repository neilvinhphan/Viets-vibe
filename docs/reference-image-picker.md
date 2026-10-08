# Lookbook reference image picker — Moderate VTON

`POST /api/lookbook/find-similar-images` accepts `garmentIds` and optional `query`
(single exact search) or `queries` (remixSearchQuery, styleSearchQuery,
traditionalSearchQuery). User edits are preserved. Generated queries use
`buildHybridSearchQueries` and the modifier `chụp toàn thân rõ trang phục`.
The builder is shared with the client and exported from server.ts.

Bing Images is searched live without a search API key. The server parses murl,
turl, t and purl from the HTML m attributes. Completed searches are not cached.

## Moderate scoring

The endpoint calls `src/services/findSimilarImages.server.ts`. With a working
Gemini key, the scorer receives actual image bytes (thumbnails when available),
not just URLs or titles. Up to twelve candidate images are fetched using the
existing SSRF-safe downloader, with four parallel workers, an eight-second total
budget and limits of 2 MB per image and 16 MB per scoring batch. Unreadable images
are not submitted for visual approval. Gemini calls have a twelve-second timeout.
The client allows 55 seconds for the complete query/search/download/score flow.

The system prompt weights outfit similarity at 50% and VTON suitability at 50%.
Full-length and knee-up images, natural poses, walking, mild three-quarter views,
and small props are accepted. Extreme camera angles or slightly dim lighting get
minor deductions. Face closeups, missing chest, back-facing models and more than
50% chest/waist occlusion must score below 60 overall.

The server validates Gemini's `{ candidates: [{ imageUrl, matchScore,
matchReason }] }` response, accepts only provided/readable URLs, deduplicates,
rejects invalid/out-of-range scores, filters at >=65, sorts descending and keeps
at most six. The old 55/98 score caps do not apply to visual Moderate scores.

The response retains `images` for the existing picker and also exposes
`candidates`. `queryMode`, `rankingMode`, `searchMode`, `fetchedAt` and `warning`
identify the actual path used.

If no candidates qualify (including empty or failed Web searches), four distinct
references are randomly sampled without replacement from
`REFERENCE_OUTFITS_CATALOG`. These have `searchMode: catalog`, `rankingMode:
fallback`, an explicit warning and a reference badge in the UI. They are not
claimed to pass VTON or artificially given scores >=65. This replaces the earlier
rule restricting the catalog to offline use.

When Gemini is unavailable, metadata ranking is explicitly labeled unverified;
its top six >=65 results are used, or the four catalog references if none qualify.
The browser also retains the existing offline catalog path. There is no offline
service worker, so offline availability of the photo bytes depends on caching.

## Proxy and UI

`GET /api/image-proxy?url=...` serves raster bytes, suitable for Blob/Base64 later.
It checks public DNS/IPs, pins the socket destination, validates every redirect,
rejects HTML/SVG, and limits downloads to 8 MB, twelve seconds and three redirects.
The picker retries the thumbnail when the original fails.

The picker preserves its three editable queries, two/three-column mobile/desktop
layout, selection, local uploads and confirmation callback. Catalog results are
labeled as references. `onSelectReferenceImage` is the future integration point;
no Cam AI simulator or handoff preview is implemented.

Photo provenance for the bundled catalog remains in
`public/reference-outfits/credits.json`.

## Checks

```sh
npm run lint
node --import tsx --test src/services/referenceImages.test.ts src/services/webImages.test.ts
npm run build
```

Automated checks cover query modifiers, 65-point boundary, top-six ordering,
URL allowlisting, multimodal inputs, empty/below-threshold fallback, quota,
unreadable images, Bing parsing and proxy protection. Live Gemini scoring is not
asserted by these mocked tests. Browser visual QA remains manual.
