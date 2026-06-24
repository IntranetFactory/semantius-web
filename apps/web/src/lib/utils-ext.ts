// Hand-maintained utility helpers that are NOT part of shadcn's registry output.
//
// Why this file exists: `src/lib/utils.ts` is owned by the shadcn CLI (it is the
// `aliases.utils` target in components.json). Any `shadcn add` or `--preset apply`
// resets utils.ts to the registry default (`cn` only), silently wiping anything we
// add there. Keep our own helpers here so the CLI can never clobber them.
// Import `cn` from "@/lib/utils"; import everything else from "@/lib/utils-ext".

export function interpolate(template: string, obj: Record<string, unknown>): string {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => String(obj[key] ?? ""))
}
