# Icon Catalog

## Where our icons come from

We use **Google Material Symbols (Rounded)**.
Browse the full icon set here:

> **https://fonts.google.com/icons?icon.set=Material+Symbols&icon.style=Rounded**

Search for an icon on that page and use the exact name shown (e.g. `delete`, `arrow_back`, `check_circle`).

---

## How to use an icon

```html
<mxevolve-icon name="delete" />
<mxevolve-icon name="search" size="lg" />
<mxevolve-icon name="check_circle" [filled]="true" />
```

---

## Finding the right name

1. Go to [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols&icon.style=Rounded).
2. Search for what you need (e.g. "trash", "settings", "cloud").
3. Click the icon → copy the name shown (e.g. `delete`, `settings`, `cloud_upload`).
4. Check if it's already in our mapping (see below). If yes, use it directly.
5. If not, add it to the mapping first (see next section).

---

## Our icon name mapping

We maintain a mapping file that lists every Material icon we use:

**`libs/shared/ui/primitive/src/lib/icons/mxevolve-icon/names/mx-icon-names.ts`**

The keys are canonical Google Material Symbols names (e.g. `delete`, `settings`, `check_circle`).

**Every Material icon must be in this mapping to work.** If you use a name that isn't
mapped, and no `CUSTOM_ICONS_PATH` is provided, nothing will render and you'll see
an error in the browser console.

---

## Icon not in the mapping?

If you find an icon on Google Material Symbols that isn't in our mapping yet:

1. Open `libs/shared/ui/primitive/src/lib/icons/mxevolve-icon/names/mx-icon-names.ts`.
2. Add it to the appropriate section:
   ```ts
   rocket_launch: "rocket_launch",
   ```
3. Use it: `<mxevolve-icon name="rocket_launch" />`.

---

## Custom (non-Material) icons

For icons that don't exist in Material Symbols (e.g. a company logo, a domain-specific shape):

1. Drop your `.svg` file in `libs/shared/ui/primitive/src/lib/icons/custom-icons/svgs/` (use **snake_case** naming).
2. That's it — the build copies SVGs to `assets/icons/` automatically.
3. Use it: `<mxevolve-icon name="your_icon_name" />`.

No registration code or definitions file needed. The component resolves non-Material
names as `${CUSTOM_ICONS_PATH}/${name}.svg` and renders them via `<img>`.

### Currently available custom icons

| Name                    | File                        |
| ----------------------- | --------------------------- |
| `murex_logo_ball`       | `svgs/murex_logo_ball.svg`       |
| `murex_logo_ball_black` | `svgs/murex_logo_ball_black.svg` |
| `murex_logo_ball_white` | `svgs/murex_logo_ball_white.svg` |

---

## Quick reference

| What you want            | What to do                                                         |
| ------------------------ | ------------------------------------------------------------------ |
| Use a Material icon      | `<mxevolve-icon name="icon_name" />`                               |
| Change size              | `size="xs"` / `"sm"` / `"md"` / `"lg"` / `"xl"` / `"xxl"`        |
| Filled variant           | `[filled]="true"` (Material only)                                  |
| Change color             | `color="var(--p-red-500)"` (Material only)                         |
| Spinning loader          | `[spin]="true"`                                                    |
| Custom SVG icon          | Drop `.svg` in `custom-icons/svgs/`, then use by filename          |
| See all Material names   | Open `names/mx-icon-names.ts`                                      |
| Live demo                | Navigate to `/icon-showcase` in the shell app                      |
