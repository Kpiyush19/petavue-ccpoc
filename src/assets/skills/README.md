# Skill preview images

Drop a screenshot here for any skill and the build script will swap the
empty placeholder frame on `/skills/<slug>` for your image.

## Filename

The filename must match the skill's `id` (slug) from `content/skills/tiles/<id>.json`.

Examples:

| Skill | Slug | Filename |
|---|---|---|
| Lead Source Effectiveness | `lead-source-effectiveness` | `lead-source-effectiveness.png` |
| Multi-touch Revenue Attribution | `multi-touch-revenue-attribution` | `multi-touch-revenue-attribution.png` |
| Campaign Lift | `campaign-lift` | `campaign-lift.png` |
| Account Intent Shift Brief | `account-intent-shift-brief` | `account-intent-shift-brief.png` |

To see every available slug, run:

```bash
ls content/skills/tiles/ | sed 's/\.json$//'
```

## Supported formats

Looked up in priority order (first one that exists wins):

1. `.png`
2. `.webp`
3. `.jpg` / `.jpeg`
4. `.svg`

## Recommended specs

- **Aspect ratio**: 16:9 (the frame is locked to `aspect-ratio: 16/9`)
- **Resolution**: 1600 × 900 (retina-ready)
- **Format**: PNG for product UI screenshots, WebP for smaller file size
- **File size**: aim for under 200 KB (compress with TinyPNG / Squoosh)
- **Content**: full app/dashboard/memo screenshot or a clean UI mock

If no image exists for a slug, the page renders an empty dark frame (no
broken-image icon). Just add the file and re-run the build — nothing else
to wire up.

## How the build picks it up

`scripts/build-skills.py` calls `find_skill_image(slug)` per skill. It
checks each supported extension in order and returns the first match as a
URL path (e.g. `/assets/skills/<slug>.png`). The detail page template
renders that URL inside `.sd-screenshot-frame`.

After adding or replacing images:

```bash
python3 scripts/build-skills.py
```

Then refresh any skill detail page to see the screenshot.
