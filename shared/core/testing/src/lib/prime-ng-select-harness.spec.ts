import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { render, waitFor } from "@testing-library/angular";
import { Select } from "primeng/select";
import {
  createPrimeNgSelectHarness,
  installPrimeNgSelectPolyfills,
} from "./prime-ng-select-harness";

interface SelectOption {
  readonly label: string;
  readonly value: string;
}

const STANDARD_HOST_SELECTOR = ".standard-select";
const VIRTUAL_SCROLL_HOST_SELECTOR = ".virtual-scroll-select";

const THREE_OPTIONS: SelectOption[] = [
  { label: "Alpha", value: "alpha" },
  { label: "Beta", value: "beta" },
  { label: "Gamma", value: "gamma" },
];

const SINGLE_OPTION: SelectOption[] = [{ label: "OnlyOne", value: "only-one" }];

@Component({
  selector: "mxevolve-standard-host",
  standalone: true,
  imports: [Select, FormsModule],
  template: `
    <div class="standard-select">
      <p-select
        [options]="options()"
        optionLabel="label"
        [disabled]="disabled()"
        [showClear]="showClear()"
        [(ngModel)]="selectedValue"
        placeholder="Pick one"
      />
    </div>
  `,
})
class StandardHostComponent {
  readonly options = signal<SelectOption[]>(THREE_OPTIONS);
  readonly disabled = signal(false);
  readonly showClear = signal(false);
  selectedValue: SelectOption | null = null;
}

@Component({
  selector: "mxevolve-virtual-scroll-host",
  standalone: true,
  imports: [Select, FormsModule],
  template: `
    <div class="virtual-scroll-select">
      <p-select
        [options]="options()"
        optionLabel="label"
        [virtualScroll]="true"
        [virtualScrollItemSize]="40"
        [(ngModel)]="selectedValue"
        placeholder="Pick one"
      />
    </div>
  `,
})
class VirtualScrollHostComponent {
  readonly options = signal<SelectOption[]>(THREE_OPTIONS);
  selectedValue: SelectOption | null = null;
}

@Component({
  selector: "mxevolve-multi-select-host",
  standalone: true,
  imports: [Select, FormsModule],
  template: `
    <div class="first-select">
      <p-select
        [options]="firstOptions()"
        optionLabel="label"
        [(ngModel)]="firstSelected"
        placeholder="First"
      />
    </div>
    <div class="second-select">
      <p-select
        [options]="secondOptions()"
        optionLabel="label"
        [(ngModel)]="secondSelected"
        placeholder="Second"
      />
    </div>
  `,
})
class MultiSelectHostComponent {
  readonly firstOptions = signal<SelectOption[]>([
    { label: "One", value: "1" },
    { label: "Two", value: "2" },
  ]);
  readonly secondOptions = signal<SelectOption[]>([
    { label: "Three", value: "3" },
    { label: "Four", value: "4" },
  ]);
  firstSelected: SelectOption | null = null;
  secondSelected: SelectOption | null = null;
}

async function renderStandardHost(
  overrides: Partial<{
    options: SelectOption[];
    disabled: boolean;
    showClear: boolean;
    selectedValue: SelectOption | null;
  }> = {}
) {
  const rendered = await render(StandardHostComponent, {
    componentProperties: {
      ...(overrides.options !== undefined && {
        options: signal(overrides.options),
      }),
      ...(overrides.disabled !== undefined && {
        disabled: signal(overrides.disabled),
      }),
      ...(overrides.showClear !== undefined && {
        showClear: signal(overrides.showClear),
      }),
      ...(overrides.selectedValue !== undefined && {
        selectedValue: overrides.selectedValue,
      }),
    },
  });

  return {
    ...rendered,
    harness: createPrimeNgSelectHarness(
      rendered.fixture,
      STANDARD_HOST_SELECTOR
    ),
  };
}

async function renderVirtualScrollHost(
  overrides: Partial<{
    options: SelectOption[];
    selectedValue: SelectOption | null;
  }> = {}
) {
  const rendered = await render(VirtualScrollHostComponent, {
    componentProperties: {
      ...(overrides.options !== undefined && {
        options: signal(overrides.options),
      }),
      ...(overrides.selectedValue !== undefined && {
        selectedValue: overrides.selectedValue,
      }),
    },
  });

  return {
    ...rendered,
    harness: createPrimeNgSelectHarness(
      rendered.fixture,
      VIRTUAL_SCROLL_HOST_SELECTOR
    ),
  };
}

async function renderMultiSelectHost() {
  const rendered = await render(MultiSelectHostComponent);

  return {
    ...rendered,
    firstHarness: createPrimeNgSelectHarness(rendered.fixture, ".first-select"),
    secondHarness: createPrimeNgSelectHarness(
      rendered.fixture,
      ".second-select"
    ),
  };
}

describe("PrimeNgSelectHarness", () => {
  beforeAll(() => {
    installPrimeNgSelectPolyfills();
  });

  describe("standard select", () => {
    it("reports enabled when the select is not disabled", async () => {
      const { harness } = await renderStandardHost();

      expect(() => harness.expectToBeEnabled()).not.toThrow();
    });

    it("reports disabled when the select is disabled", async () => {
      const { harness } = await renderStandardHost({ disabled: true });

      expect(() => harness.expectToBeDisabled()).not.toThrow();
    });

    it("returns null when no option is selected", async () => {
      const { harness } = await renderStandardHost();

      expect(harness.getValue()).toBeNull();
    });

    it("returns the label of a pre-selected option", async () => {
      const { harness } = await renderStandardHost({
        selectedValue: THREE_OPTIONS[1],
      });

      await waitFor(() => expect(harness.getValue()).toBe("Beta"));
    });

    it("passes expectToHaveValue when the displayed value matches the pre-selected option", async () => {
      const { harness } = await renderStandardHost({
        selectedValue: THREE_OPTIONS[2],
      });

      const assertGammaSelected = () => harness.expectToHaveValue("Gamma");
      await waitFor(() => expect(assertGammaSelected).not.toThrow());
    });

    it("updates the component model to the first option", async () => {
      const { fixture, harness } = await renderStandardHost();

      await harness.select("Alpha");

      expect(fixture.componentInstance.selectedValue).toEqual({
        label: "Alpha",
        value: "alpha",
      });
    });

    it("updates the component model to the last option", async () => {
      const { fixture, harness } = await renderStandardHost();

      await harness.select("Gamma");

      expect(fixture.componentInstance.selectedValue).toEqual({
        label: "Gamma",
        value: "gamma",
      });
    });

    it("throws when the option does not exist", async () => {
      const { harness } = await renderStandardHost();

      await expect(harness.select("NonExistent")).rejects.toThrow(
        /Option NonExistent not found/
      );
    });

    it("overwrites the component model when changing selection", async () => {
      const { fixture, harness } = await renderStandardHost();

      await harness.select("Alpha");
      await harness.select("Gamma");

      expect(fixture.componentInstance.selectedValue).toEqual({
        label: "Gamma",
        value: "gamma",
      });
    });

    it("returns all option labels", async () => {
      const { harness } = await renderStandardHost();

      const options = await harness.getOptions();

      expect(options).toEqual(["Alpha", "Beta", "Gamma"]);
    });

    it("returns a single option when only one exists", async () => {
      const { harness } = await renderStandardHost({
        options: SINGLE_OPTION,
      });

      const options = await harness.getOptions();

      expect(options).toEqual(["OnlyOne"]);
    });

    it("resets the component model to null when showClear is enabled", async () => {
      const { fixture, harness } = await renderStandardHost({
        showClear: true,
        selectedValue: THREE_OPTIONS[0],
      });

      const assertAlphaSelected = () => harness.expectToHaveValue("Alpha");
      await waitFor(() => expect(assertAlphaSelected).not.toThrow());
      await harness.clear();

      expect(fixture.componentInstance.selectedValue).toBeNull();
    });

    it("throws when showClear is not enabled", async () => {
      const { harness } = await renderStandardHost({
        showClear: false,
        selectedValue: THREE_OPTIONS[0],
      });

      const assertAlphaSelected = () => harness.expectToHaveValue("Alpha");
      await waitFor(() => expect(assertAlphaSelected).not.toThrow());

      await expect(harness.clear()).rejects.toThrow(/Clear button not found/);
    });
  });

  describe("virtual scroll select", () => {
    it("updates the component model in a virtual scroll dropdown", async () => {
      const { fixture, harness } = await renderVirtualScrollHost();

      await harness.select("Gamma");

      expect(fixture.componentInstance.selectedValue).toEqual({
        label: "Gamma",
        value: "gamma",
      });
    });

    it("throws when the option does not exist in a virtual scroll dropdown", async () => {
      const { harness } = await renderVirtualScrollHost();

      await expect(harness.select("NonExistent")).rejects.toThrow(
        /Option NonExistent not found/
      );
    });

    it("returns all option labels from a virtual scroll dropdown", async () => {
      const { harness } = await renderVirtualScrollHost();

      const options = await harness.getOptions();

      expect(options).toEqual(["Alpha", "Beta", "Gamma"]);
    });

    it("returns null when no option is selected in a virtual scroll dropdown", async () => {
      const { harness } = await renderVirtualScrollHost();

      expect(harness.getValue()).toBeNull();
    });

    it("returns the label of a pre-selected option in a virtual scroll dropdown", async () => {
      const { harness } = await renderVirtualScrollHost({
        selectedValue: THREE_OPTIONS[0],
      });

      await waitFor(() => expect(harness.getValue()).toBe("Alpha"));
    });

    it("reports enabled for a virtual scroll dropdown", async () => {
      const { harness } = await renderVirtualScrollHost();

      expect(() => harness.expectToBeEnabled()).not.toThrow();
    });

    it("passes expectToHaveValue for a pre-selected option in a virtual scroll dropdown", async () => {
      const { harness } = await renderVirtualScrollHost({
        selectedValue: THREE_OPTIONS[2],
      });

      const assertGammaSelected = () => harness.expectToHaveValue("Gamma");
      await waitFor(() => expect(assertGammaSelected).not.toThrow());
    });
  });

  describe("multiple selects on the same page", () => {
    it("updates only the targeted component model when selecting", async () => {
      const { fixture, firstHarness, secondHarness } =
        await renderMultiSelectHost();

      await firstHarness.select("One");
      await secondHarness.select("Four");

      expect(fixture.componentInstance.firstSelected).toEqual({
        label: "One",
        value: "1",
      });
      expect(fixture.componentInstance.secondSelected).toEqual({
        label: "Four",
        value: "4",
      });
    });

    it("returns options scoped to the targeted select", async () => {
      const { firstHarness, secondHarness } = await renderMultiSelectHost();

      const firstOptions = await firstHarness.getOptions();
      const secondOptions = await secondHarness.getOptions();

      expect(firstOptions).toEqual(["One", "Two"]);
      expect(secondOptions).toEqual(["Three", "Four"]);
    });

    it("does not affect the other component model when selecting in one", async () => {
      const { fixture, firstHarness } = await renderMultiSelectHost();

      await firstHarness.select("Two");

      expect(fixture.componentInstance.secondSelected).toBeNull();
    });
  });
});
