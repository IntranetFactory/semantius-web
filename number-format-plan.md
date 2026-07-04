# Plan: Locale-aware number formatting (grid + new form control)

## Goal (from user)
1. **Grid**: numbers in `DataTableView` render per **browser locale** with the field's
   **precision** — e.g. `7,800.00` (en-US) / `7.800,00` (de-DE). Test page:
   `/it-ops-starter/saas_subscriptions?page=1&pageSize=10&sortBy=id&sortOrder=desc`.
2. **Form control**: a number input that shares the Base UI / shadcn theming of the other
   form controls, but is built on **react-number-format** (live thousands separators +
   decimal scale per locale).

## Progress checklist
Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` skipped (with reason).

### Phase 0 — Pre-work
- [ ] Inspect API: `curl` `saas_subscriptions` metadata (`get_schema`) + one data row — confirm
      the price field carries `precision` and whether numeric values arrive as strings
- [ ] Add dependency: `pnpm --filter web add react-number-format` (record exact version)

### Phase 1 — Shared helpers + types
- [x] `types/metadata.ts` — added `precision?: number` to `JsonSchemaProperty`
- [x] `lib/number-format.ts` (NEW) — `getNumberSeparators` / `resolvePrecision` / `formatNumberForDisplay`
- [x] `number-format.test.ts` (NEW) — 13 tests pass (en-US `7,800.00`, de-DE `7.800,00`, integer, null → `''`, separators)

### Phase 2 — Form control
- [x] `ui-ext/number-input.tsx` (NEW) — `NumericFormat` default input (self-manages caret ref) + base Input surface
      (chosen over `customInput={Input}` because the CLI-owned base `Input` doesn't forward `ref`)
- [x] `form/InputNumber.tsx` — rewritten to use `NumberInput`, precision read from `schema`
- [x] `number-input.test.tsx` (NEW) — 4 tests pass (type→value, clear→undefined, grouping+padding, integer)

### Phase 3 — Grid
- [x] `data-table-view/DataTableView.tsx` — numeric branch → `formatNumberForDisplay(...)`, grouping off for id_column
      (pre-existing 4 embedded NUL bytes in this file verified intact after edit)
- [-] `data-table-view/TableView.tsx` — SKIPPED: confirmed dead code (zero references); a cleanup should delete it, not update it

### Phase 4 — Verify & ship
- [x] `pnpm build` clean (vite + `tsc -b --noEmit` exit 0). NOTE: `pnpm lint` fails with a
      PRE-EXISTING eslint flat-config error (`react-hooks` plugin as array-of-strings) — not
      caused by this change (lockfile diff added only `react-number-format`, no eslint deps).
- [x] Deployed: preview `https://main-20260704161954-semantius-web.ma532.workers.dev` (`.preview-url.md` written)
- [x] Grid screenshot — Annual Spend renders `7,800.00` … `2,400.00` (grouped, 2 decimals), ids un-grouped
- [x] Form screenshot — Seat Count `12,500` (integer grouping), Annual Spend `7,800.00`, same input surface as siblings
- [x] `id_column` grouping suppressed (verified: Id column shows plain `1..10`)
- [x] `CONTEXT-MEMORY.md` — added "Number formatting (grid + form) — single source of truth" note
- [ ] `.pr-comment.md` → `bash workplace/approve-pr.sh` exits 0 → `gh pr create --body-file`  ← awaiting user OK to push/open PR

## Key facts established from the codebase
- **Grid cell renderer** — `apps/web/src/components/data-table-view/DataTableView.tsx`
  currently renders numeric cells as:
  ```tsx
  if (property.type === 'integer' || property.type === 'number') {
    return <div className="text-right">{String(value ?? '0')}</div>
  }
  ```
  `DataTableView` is the live grid (`views/View.tsx` imports it). `TableView.tsx` has the
  same block (line 375) but is **not imported by any view** — legacy.
- **`precision`** is a real sem-schema JSON-Schema keyword (0–4 decimals; see
  `form/README.md` line 174, `form/Playground.tsx` line 63). It arrives in the `get_schema`
  JSON on each property but is **not declared** on `JsonSchemaProperty`
  (`apps/web/src/types/metadata.ts`). It is still present at runtime.
- **Form control dispatch** — `form/controls.ts` maps `format || (enum?'enum':type)` →
  component; `integer` and `number` both → `InputNumber`. `SchemaForm.tsx` passes the full
  property as `schema={propSchema}` to every control, so `schema.precision` / `schema.type`
  are readable inside the control.
- **Current `InputNumber`** (`form/InputNumber.tsx`) uses native `<input type="number">`,
  stores `number | undefined` in form state via `field.handleChange(Number(val))`.
- **Base Input** (`ui/input.tsx`, Base UI) provides the filled `bg-input/50` surface.
  `inputSurfaceClassName` (`lib/utils-ext.ts`) is for non-`<input>` triggers only.
- `react-number-format` is **not** yet a dependency. `@tanstack/react-form` is the form lib.
- **`lib/utils.ts` is CLI-owned** — new helpers go in a new file, not there.

## Design

### A. Shared formatting helpers — NEW `apps/web/src/lib/number-format.ts`
Single source of truth for both grid and form so they stay consistent.
```ts
// Derive locale group/decimal separators from Intl (browser locale when locale undefined).
export function getNumberSeparators(locale?: string): { group: string; decimal: string }
// -> via new Intl.NumberFormat(locale).formatToParts(11111.1), read 'group' & 'decimal' parts.

// Resolve the decimal precision for a property/field.
//   precision (number) wins; else integer -> 0; else (number, no precision) -> undefined.
export function resolvePrecision(p: { type?: string|string[]; precision?: number }): number | undefined

// Grid display formatter.
export function formatNumberForDisplay(
  value: unknown, precision: number | undefined, locale?: string
): string
//  - null/undefined/'' -> '' (no more misleading '0')
//  - coerce string -> number first (PostgREST numeric/decimal arrive as strings)
//  - non-finite/NaN -> String(value) (don't corrupt unexpected data)
//  - precision defined -> Intl.NumberFormat(locale,{min=max=precision, useGrouping:true})
//  - precision undefined -> Intl.NumberFormat(locale,{maximumFractionDigits:20, useGrouping:true})
```
`locale` param defaults to `undefined` (browser default) in the app; tests pass explicit
`'en-US'` / `'de-DE'` for determinism.

### B. Number input primitive — NEW `apps/web/src/components/ui-ext/number-input.tsx`
Hand-written non-registry control → lives in `ui-ext/` (per repo convention).
```tsx
import { NumericFormat } from 'react-number-format'
import { Input as InputPrimitive } from '@base-ui/react/input'   // NOT the ui/ wrapper — see below
```
**CRITICAL — ref forwarding (from review).** `ui/input.tsx` is a plain function component
that does NOT forward `ref`, and it is CLI-owned (must not be edited). `NumericFormat`
needs a ref to the DOM `<input>` for caret management, else the cursor jumps to the end on
every keystroke. Resolution that respects the immutable `ui/` rule: define a **local
`forwardRef` wrapper** inside `number-input.tsx` that renders `@base-ui/react/input`'s
primitive (which forwards ref) with a className replicating the base Input surface. Precedent:
`inputSurfaceClassName` in `utils-ext.ts` already duplicates the `bg-input/50` token with a
"keep in sync with ui/input.tsx" comment for exactly this reason. Add the same sync comment.
```tsx
const NumberInputBase = React.forwardRef<HTMLInputElement, ...>((props, ref) => (
  <InputPrimitive ref={ref} data-slot="input" className={cn(NUMBER_INPUT_SURFACE, className)} {...props} />
))
// NUMBER_INPUT_SURFACE = the class string from ui/input.tsx — KEEP IN SYNC.

interface NumberInputProps {
  value: number | string | null | undefined   // API may send numeric as string (PostgREST)
  onValueChange: (value: number | undefined) => void
  precision?: number          // decimalScale; undefined = free decimals
  allowNegative?: boolean      // default true (or derive from schema.minimum >= 0)
  placeholder?: string; disabled?: boolean; readOnly?: boolean
  id?: string; name?: string; className?: string; onBlur?: () => void
  'aria-invalid'?: boolean; 'aria-describedby'?: string
}
```
- Render `<NumericFormat customInput={NumberInputBase} type="text" ... />` — forwards ref,
  inherits the `bg-input/50` surface + focus/aria-invalid styling.
- `thousandSeparator={group}`, `decimalSeparator={decimal}` from `getNumberSeparators()`.
  Guard: if `group === ''` or `group === decimal` (degenerate locale) omit `thousandSeparator`.
  Note: some locales (fr-FR) use a narrow no-break space (U+202F) group separator — fine for
  the user's primary targets (en-US `,` / de-DE `.`); flagged, tested, non-blocking.
- `decimalScale={precision}`, `fixedDecimalScale={precision !== undefined}` so precision-2
  fields pad/round to 2 decimals (matches `7,800.00`). Integer (precision 0) → no decimals.
- Controlled `value={value ?? undefined}` (coerce string→number for the initial value);
  `onValueChange={(v)=>onValueChange(v.floatValue)}` — store numeric `floatValue`
  (`undefined` when cleared, which SchemaForm correctly drops for optional fields).

### C. Rewrite `apps/web/src/components/form/InputNumber.tsx`
Keep the exact wrapper structure (FormLabel / FormDescription / FormError, `pt-2 space-y-1`,
hidden+readonly hidden-`<input>` for submission). Swap the native input for `<NumberInput>`.
- `precision = resolvePrecision({ type: schema?.type, precision: schema?.precision })`.
- `onValueChange={(v) => field.handleChange(v)}` (number | undefined) — unchanged contract.
- `onBlur={field.handleBlur}`; pass `disabled`, `readOnly`, `aria-invalid`, `aria-describedby`.
- Because `integer` & `number` both map here, one control covers both (integer → precision 0).

### D. Grid — `DataTableView.tsx`
Replace the numeric branch with:
```tsx
if (property.type === 'integer' || property.type === 'number') {
  const precision = resolvePrecision(property)
  return <div className="text-right">{formatNumberForDisplay(value, precision)}</div>
}
```
- `formatNumberForDisplay` must **coerce string→number first** (`Number(value)`): PostgREST
  returns Postgres `numeric`/`decimal` columns as JSON **strings** to preserve precision, so
  price fields often arrive as `"7800.00"`, not `7800`. Non-finite → fall back to `String(value)`.
- Formatting is display-only; sorting/filtering/drag-reorder use the raw row value, unaffected.
- Update the legacy `TableView.tsx` identically (cheap, avoids drift) — it is currently unused.

### E. Types — `apps/web/src/types/metadata.ts`
Add to `JsonSchemaProperty`:
```ts
/** Sem-schema number precision (decimal places, 0–4). Drives grid + form formatting. */
precision?: number
```

### F. Dependency
`pnpm --filter web add react-number-format` (React 19 compatible; note exact version in PR).

## Testing
- Unit (Vitest): `number-format.test.ts` — `formatNumberForDisplay(7800, 2, 'en-US') === '7,800.00'`
  and `=== '7.800,00'` for `'de-DE'`; integer precision 0; null/undefined → `''`;
  `getNumberSeparators('de-DE') === {group:'.',decimal:','}`. (Node ICU makes these deterministic.)
- Component test for `NumberInput`: typing updates value; precision padding on blur.
- `pnpm build` + `pnpm lint` clean.

## Verification (per CLAUDE.md)
1. `pnpm build`; 2. deploy `dotenvx run -- bash workplace/deploy-wrangler.sh`; read
   `.preview-url.md`; 3. mint token (`--quiet` + JWT-extract), open
   `$PREVIEW/#jwt=$TOKEN` then the saas_subscriptions grid; screenshot showing grouped
   decimals; 4. open a create/edit form for a table with a precision number field, screenshot
   the new control formatting live. Save under `screenshots/`.

## Decisions (post-review)
1. **No-precision `number`** → free decimals + grouping (no forced padding). Keep.
2. **Null/empty numeric grid cell** → render `''` (not misleading `'0'`). Low risk; verify no
   CSS/filter logic depends on the `'0'` fallback.
3. **Rewrite `InputNumber` in place** (not a separate `InputDecimal` key) — covers both
   `integer`+`number`, no field-`format` change needed.
4. **Integer grouping**: apply grouping to integers too (quantities/counts read better). Watch
   the primary-key `id_column` — a grouped id (`1,002`) can look odd; if so, skip grouping when
   `key === metadata.table.id_column`. Confirm on the preview screenshot.
5. **Consistency (follow-up, NOT in core PR to avoid regressions):** `CustomTableChart.tsx`
   (`toLocaleString`) and `table-range-filter.tsx` (`maximumFractionDigits: 0`, deliberately
   compact) could later adopt `formatNumberForDisplay`. Left out of scope; noted for a follow-up.

## Pre-implementation verification
- Before finalizing, `curl` the `saas_subscriptions` metadata (`get_schema`) + a data row to
  confirm the price field carries `precision` and whether values arrive as strings — drives the
  coercion + default (per CLAUDE.md "inspect API before implementing").

## Scope / sem-schema guard
Touches only the **consumer**: `types/metadata.ts` (type decl), app components, a new lib +
ui-ext file, `package.json`. Does **not** touch `packages/sem-schema` (off limits) or any
`ui/` CLI-owned file.
