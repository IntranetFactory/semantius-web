// Re-export from next-themes so that shadcn components (e.g. Sonner Toaster)
// that call useTheme() from 'next-themes' can resolve the theme context.
// next-themes was already a declared dependency; this replaces the previous
// custom implementation which had the same API surface.
export { ThemeProvider, useTheme } from 'next-themes'
