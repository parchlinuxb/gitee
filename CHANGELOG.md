# Changelog

All notable changes to Gitee (Parch Linux fork of SearXNG) are documented here.

## [Unreleased]

### Added

- **Parch Linux brand theme** — Complete visual redesign of the smart theme using Parch Gnu/Linux design language:
  - Brand colors: Cyan (`#007a99` / `#00eaff`), Blue (`#0060c0` / `#0080ff`), Green (`#008a4c` / `#00ff80`)
  - Brand gradient: `linear-gradient(135deg, cyan, blue, green)` applied to buttons, skip links, and selected states
  - Dark theme: Neon accents on near-black `#0a0f16` surfaces with glass layers
  - Light theme: Deep low-chroma tones on white backgrounds
  - Typography: Estedad + Work Sans (Google Fonts), JetBrains Mono for code
  - Parch signature easing: `cubic-bezier(0.16, 1, 0.3, 1)` on all transitions
  - Custom CSS properties: `--brand-gradient`, `--accent-green`, `--accent-purple`, `--accent-violet`

- **Minimal hero index page** — Redesigned landing page layout:
  - Vertically centered hero section with generous whitespace
  - Clean logo display (up to 160px, responsive)
  - Minimal category pills (text-only, no icons) with transparent borders; selected state uses cyan accent
  - Full-width search box constrained by parent container
  - Subtle footer links (donate, about, settings) below search

- **Root `Dockerfile`** — Combined builder+dist multi-stage Docker image for standalone builds
- **`build.yml` workflow** — GitHub Actions workflow to build Docker image on push
- **`container.yml` workflow** — GitHub Actions workflow for container-based CI (owner-gated)
- **Skip link** — Accessibility skip-to-content link on all pages

### Changed

- **Upstream merge** — Synced with latest SearXNG upstream (`searxng/searxng`)
- **Removed Jabir AI backend** — AI chat framework retained but now configurable via user-provided OpenAI-compatible API URL/key (no hardcoded Jabir endpoints)
- **`version_frozen.py` generation** — Fixed to use `printf` instead of heredoc for reliable shell expansion; generates directly in builder stage without git
- **`__SEARXNG_*` env vars** — Set during Docker build for version metadata
- **Button primary style** — Now uses `--brand-gradient` background instead of solid `--primary-color`
- **Loading indicator dots** — Three dots now use cyan → blue → green (Parch gradient colors) instead of uniform `--primary-color`
- **Result link underlines** — Changed from hardcoded Apple blue (`rgba(0, 122, 255, .3)`) to `var(--primary-color)` for theme consistency
- **Skip link background** — Uses `--brand-gradient` instead of solid `--primary-color`
- **Preferences color picker** — Gitee theme swatch updated to Parch gradient
- **Bang font** — Changed from hardcoded `SF Mono` to `var(--mono-font-family)` for consistency
- **Search box width** — Changed from `clamp(400px, 50vw, 40rem)` to `width: 100%` (constrained by parent)
- **Category display on index** — Changed from stacked icon boxes with gradient backgrounds to inline text pills with subtle borders
- **`settings.yml` description** — Updated to mention Parch Linux

### Fixed

- **`Preferences` class missing `self.cfg`** — Added `self.cfg: SettingsPref` attribute and import to `Preferences.__init__()` (`preferences.py:56`)
- **`Preferences` SCHEMA type mismatch** — Changed `"preferences"` in `SCHEMA` from plain dict `{"lock": SettingsValue(list, [])}` to `SettingsPref` struct so `apply_schema` properly decodes it (`settings_defaults.py`)
- **Null settings crash** — When `preferences:` is commented out in `settings.yml`, `settings.get('preferences')` returns `None`. Fixed `apply_schema` to use `settings.get(key) or {}` to default to empty dict (`settings_defaults.py`)
- **`is_locked()` attribute error** — Changed from dict-style `'lock' not in settings['preferences']` to `hasattr(pref, 'lock')` since `settings['preferences']` is now a `SettingsPref` struct (`preferences.py`)
- **Missing `icon_small` import** — Added `{% from 'smart/icons.html' import icon_small %}` to `sidebar.html`
- **Undefined `locales` variable** — Added `kwargs['locales'] = LOCALE_NAMES` to `webapp.py` `render()` function
- **AI chat renders when disabled** — Changed `preferences.get_value('ai_chat')` to `preferences.get_value('ai_chat') != 'off'` in `results.html` so AI chat HTML isn't rendered when the setting is `'off'`
- **Dockerfile `COPY --exclude`** — Added BuildKit syntax directive for `COPY --exclude` support
- **Dockerfile variable issues** — Fixed variable scoping and expansion in multi-stage build
- **`version_frozen.py` not found in dist** — Fixed by generating the file in the builder stage and setting `__SEARXNG_VERSION` env var

### Removed

- **Extra suggestion-box div** — Removed `<div class="suggestion-box" id="suggestion"></div>` from `search_box.html` (JS null-checks `#suggestion` so this is safe)
- **Jabir AI API keys** — Removed hardcoded API URLs and keys from `settings.yml`
- **Apple-like design references** — Replaced all Apple-minimalism design tokens and comments with Parch Linux brand language

---

## [0.1.0] — Initial Parch fork

### Added

- Fork of `searxng/searxng` owned by `parchlinuxb`
- Smart theme with custom UI/UX improvements
- AI chat integration framework (configurable OpenAI-compatible endpoint)
- Sidebar preferences panel with quick settings
- Image proxy toggle
- Infinite scroll support
- Category icons on index page

### Changed

- Renamed from SearXNG to Gitee
- Updated branding, logos, and metadata
- Modified default search engines and settings
