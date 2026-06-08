import { ComponentFixture } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { within } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { Select } from "primeng/select";

interface PrimeNgScroller {
  readonly _items?: unknown[];
  last: number;
  numItemsInViewport: number;
  readonly cd: {
    detectChanges(): void;
  };
}

export interface PrimeNgSelectHarness {
  select(optionText: string): Promise<void>;
  getOptions(): Promise<string[]>;
  clear(): Promise<void>;
  getValue(): string | null;
  expectToBeEnabled(): void;
  expectToBeDisabled(): void;
  expectToHaveValue(expectedText: string): void;
}

function createNoop(): () => void {
  return () => undefined;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function getHostElement(hostSelector: string): HTMLElement {
  const hostElement = document.querySelector<HTMLElement>(hostSelector);
  if (!hostElement) {
    throw new Error(
      `PrimeNG Select host not found for selector ${hostSelector}`
    );
  }

  return hostElement;
}

function getCombobox(hostSelector: string): HTMLElement {
  return within(getHostElement(hostSelector)).getByRole("combobox");
}

function showPrimeNgOverlays(): void {
  document
    .querySelectorAll("p-motion")
    .forEach((element) => ((element as HTMLElement).style.display = ""));
}

function getSelectInstance(
  fixture: ComponentFixture<unknown>,
  hostSelector: string
): Select {
  const combobox = getCombobox(hostSelector);
  const selectDebugElement = fixture.debugElement
    .queryAll(By.directive(Select))
    .find((debugElement) => {
      const nativeElement = debugElement.nativeElement as HTMLElement;
      return nativeElement.contains(combobox);
    });

  if (!selectDebugElement) {
    throw new Error(
      `PrimeNG Select instance not found for selector ${hostSelector}`
    );
  }

  return selectDebugElement.componentInstance as Select;
}

function getListbox(selectInstance: Select): HTMLElement {
  const listbox = document.getElementById(`${selectInstance.id}_list`);
  if (!listbox) {
    throw new Error(
      `PrimeNG Select listbox not found for id ${selectInstance.id}`
    );
  }

  return listbox;
}

async function initializeVirtualScroll(
  fixture: ComponentFixture<unknown>,
  selectInstance: Select
): Promise<void> {
  selectInstance.onOverlayBeforeEnter({});
  fixture.detectChanges();

  await wait(10);
  fixture.detectChanges();
  await wait(0);

  const scroller = selectInstance.scroller as PrimeNgScroller | undefined;
  const itemCount = scroller?._items?.length ?? 0;
  if (!scroller || itemCount === 0) {
    return;
  }

  scroller.last = itemCount;
  scroller.numItemsInViewport = itemCount;
  scroller.cd.detectChanges();
}

async function waitForOptions(
  fixture: ComponentFixture<unknown>,
  selectInstance: Select
): Promise<void> {
  if (selectInstance.options?.length) {
    return;
  }

  const timeoutMs = 500;
  const intervalMs = 50;
  let elapsedMs = 0;

  while (elapsedMs < timeoutMs) {
    await wait(intervalMs);
    fixture.detectChanges();

    if (selectInstance.options?.length) {
      return;
    }

    elapsedMs += intervalMs;
  }
}

async function openSelect(
  fixture: ComponentFixture<unknown>,
  hostSelector: string
): Promise<Select> {
  await userEvent.click(getCombobox(hostSelector));
  showPrimeNgOverlays();
  fixture.detectChanges();

  const selectInstance = getSelectInstance(fixture, hostSelector);
  await waitForOptions(fixture, selectInstance);

  if (selectInstance.virtualScroll) {
    await initializeVirtualScroll(fixture, selectInstance);
  }

  fixture.detectChanges();
  return selectInstance;
}

function getVisibleOptions(selectInstance: Select): HTMLElement[] {
  return within(getListbox(selectInstance)).getAllByRole("option");
}

function readDisplayedValue(hostSelector: string): string | null {
  const hostElement = getHostElement(hostSelector);
  const labelElement = hostElement.querySelector(".p-select-label");
  const displayedValue = labelElement?.textContent?.trim() ?? null;

  if (!displayedValue) {
    return null;
  }

  if (hostElement.querySelector(".p-select-label.p-placeholder")) {
    return null;
  }

  return displayedValue;
}

/**
 * PrimeNG Select uses browser APIs that jsdom does not provide.
 * Install these once in test setup before interacting with PrimeNG Select.
 */
export function installPrimeNgSelectPolyfills(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: createNoop(),
      removeListener: createNoop(),
      addEventListener: createNoop(),
      removeEventListener: createNoop(),
      dispatchEvent: () => true,
    }),
  });

  Element.prototype.scrollIntoView = createNoop();
  Element.prototype.scrollTo =
    createNoop() as typeof Element.prototype.scrollTo;

  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() {
      return document.body;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return 200;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return 300;
    },
  });
}

/**
 * Create a harness for one PrimeNG Select host.
 *
 * Pass a selector that uniquely identifies the host element wrapping the target select.
 * If a test has multiple selects, use a more specific selector such as:
 * - `form mxevolve-version-dropdown`
 * - `.filters p-select:nth-of-type(2)`
 * - `mxevolve-version-dropdown:first-of-type`
 */
export function createPrimeNgSelectHarness(
  fixture: ComponentFixture<unknown>,
  hostSelector: string
): PrimeNgSelectHarness {
  return {
    expectToBeDisabled(): void {
      expect(getCombobox(hostSelector).getAttribute("aria-disabled")).toBe(
        "true"
      );
    },

    expectToBeEnabled(): void {
      expect(getCombobox(hostSelector).getAttribute("aria-disabled")).toBe(
        "false"
      );
    },

    expectToHaveValue(expectedText: string): void {
      expect(readDisplayedValue(hostSelector)).toBe(expectedText);
    },

    getValue(): string | null {
      return readDisplayedValue(hostSelector);
    },

    async getOptions(): Promise<string[]> {
      const selectInstance = await openSelect(fixture, hostSelector);
      const optionTexts = getVisibleOptions(selectInstance).map(
        (option) => option.textContent?.trim() ?? ""
      );

      await userEvent.click(getCombobox(hostSelector));
      fixture.detectChanges();

      return optionTexts;
    },

    async select(optionText: string): Promise<void> {
      const selectInstance = await openSelect(fixture, hostSelector);
      const optionElement = getVisibleOptions(selectInstance).find(
        (option) => option.textContent?.trim() === optionText
      );

      if (!optionElement) {
        const availableOptions = getVisibleOptions(selectInstance)
          .map((option) => option.textContent?.trim())
          .join(", ");
        throw new Error(
          `Option ${optionText} not found in ${hostSelector}. Available: ${availableOptions}`
        );
      }

      // Direct click is the stable path for PrimeNG virtual scroll in jsdom.
      optionElement.click();
      fixture.detectChanges();
    },

    async clear(): Promise<void> {
      const clearButton = getHostElement(hostSelector).querySelector(
        ".p-select-clear-icon"
      );

      if (!clearButton) {
        throw new Error(
          `Clear button not found in ${hostSelector}. Ensure showClear is enabled.`
        );
      }

      await userEvent.click(clearButton as HTMLElement);
      fixture.detectChanges();
    },
  };
}
