import { DestroyRef, inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { MonacoEditorService } from "./monaco-editor.service";

const DARK_THEME_CLASS = "app-dark";

/**
 * Keep Monaco's theme in sync with the host app's light/dark class toggle.
 * Call once from a Monaco-hosting component (after `inject(...)` context is
 * available). The observer is torn down automatically on component destroy.
 */
export function syncMonacoThemeWithApp(): void {
  const document = inject(DOCUMENT);
  const monacoService = inject(MonacoEditorService);
  const destroyRef = inject(DestroyRef);

  const apply = (): void => {
    const isDark =
      document.documentElement.classList.contains(DARK_THEME_CLASS);
    monacoService.setTheme(isDark ? "vs-dark" : "vs");
  };

  apply();

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  destroyRef.onDestroy(() => observer.disconnect());
}
