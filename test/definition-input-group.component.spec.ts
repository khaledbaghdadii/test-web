import { render, screen } from "@testing-library/angular";
import { FormControl, Validators } from "@angular/forms";
import { AbstractControl } from "@angular/forms";
import { InputAccessMode } from "@mxevolve/domains/business-process/util";
import { DefinitionInputGroupComponent } from "./definition-input-group.component";

const HOST_TEMPLATE = `
  <mxevolve-definition-input-group
    [label]="label"
    [controls]="controls"
    [inputAccessMode]="inputAccessMode"
    [forceShow]="forceShow"
    [required]="required"
  >
    <span>projected content</span>
  </mxevolve-definition-input-group>
`;

interface RenderOptions {
  label?: string;
  controls?: readonly AbstractControl[];
  inputAccessMode?: InputAccessMode;
  forceShow?: boolean;
  required?: boolean;
}

async function renderComponent({
  label = "Configuration Parameters",
  controls = [new FormControl<string | null>(null)],
  inputAccessMode = "ACCESS_INVALID_INPUTS_ONLY",
  forceShow = false,
  required = false,
}: RenderOptions = {}) {
  return render(HOST_TEMPLATE, {
    imports: [DefinitionInputGroupComponent],
    componentProperties: {
      label,
      controls,
      inputAccessMode,
      forceShow,
      required,
    },
  });
}

/** A control the definition already filled in acceptably. */
function satisfiedControl(): FormControl<string | null> {
  return new FormControl<string | null>("already-provided", [
    Validators.required,
  ]);
}

/** A control the definition left unusable, so the user has to supply it. */
function unsatisfiedControl(): FormControl<string | null> {
  return new FormControl<string | null>(null, [Validators.required]);
}

function groupHeading(): HTMLElement | null {
  return screen.queryByText("Configuration Parameters");
}

describe("DefinitionInputGroupComponent", () => {
  describe("when the group is shown", () => {
    it("names the group with its label", async () => {
      await renderComponent({ controls: [unsatisfiedControl()] });

      expect(groupHeading()).toBeInTheDocument();
    });

    it("renders the fields it groups", async () => {
      await renderComponent({ controls: [unsatisfiedControl()] });

      expect(screen.getByText("projected content")).toBeInTheDocument();
    });

    it("groups its fields under a single labelled fieldset", async () => {
      await renderComponent({ controls: [unsatisfiedControl()] });

      const legend = groupHeading();
      expect(legend?.tagName).toBe("LEGEND");
      expect(legend?.closest("fieldset")).toContainElement(
        screen.getByText("projected content")
      );
    });

    it("marks the group required when told to", async () => {
      await renderComponent({
        controls: [unsatisfiedControl()],
        required: true,
      });

      expect(groupHeading()).toHaveClass("required");
    });

    it("leaves the group unmarked when it is not required", async () => {
      await renderComponent({ controls: [unsatisfiedControl()] });

      expect(groupHeading()).not.toHaveClass("required");
    });
  });

  describe("when the group is hidden", () => {
    it("shows neither the label nor the fields it groups", async () => {
      await renderComponent({ controls: [satisfiedControl()] });

      expect(groupHeading()).toBeNull();
      expect(screen.queryByText("projected content")).toBeNull();
    });
  });

  describe("ACCESS_INVALID_INPUTS_ONLY", () => {
    it("shows the group when one of its fields still needs a value", async () => {
      await renderComponent({
        controls: [satisfiedControl(), unsatisfiedControl()],
      });

      expect(groupHeading()).toBeInTheDocument();
    });

    it("hides the group when the definition satisfied every field", async () => {
      await renderComponent({
        controls: [satisfiedControl(), satisfiedControl()],
      });

      expect(groupHeading()).toBeNull();
    });
  });

  describe("ACCESS_ALL_INPUTS", () => {
    it("shows the group even when the definition satisfied every field", async () => {
      await renderComponent({
        controls: [satisfiedControl()],
        inputAccessMode: "ACCESS_ALL_INPUTS",
      });

      expect(groupHeading()).toBeInTheDocument();
    });
  });

  describe("ACCESS_EMPTY_OPTIONAL_INPUTS", () => {
    it("shows the group when one of its optional fields is empty", async () => {
      await renderComponent({
        controls: [new FormControl<string[] | null>([])],
        inputAccessMode: "ACCESS_EMPTY_OPTIONAL_INPUTS",
      });

      expect(groupHeading()).toBeInTheDocument();
    });

    it("hides the group when every optional field already carries a value", async () => {
      await renderComponent({
        controls: [new FormControl<string[] | null>(["someone@example.com"])],
        inputAccessMode: "ACCESS_EMPTY_OPTIONAL_INPUTS",
      });

      expect(groupHeading()).toBeNull();
    });
  });

  describe("forceShow", () => {
    /**
     * Repush seeds the live form, which would make every control valid and
     * collapse the group out of reach. `forceShow` is how the executor keeps it
     * open regardless.
     */
    it("shows the group even when the definition satisfied every field", async () => {
      await renderComponent({
        controls: [satisfiedControl()],
        forceShow: true,
      });

      expect(groupHeading()).toBeInTheDocument();
    });
  });

  /**
   * Visibility is decided once, on creation. A group shown because a field
   * needed a value has to stay on screen after the user supplies it - otherwise
   * the fields disappear from under them mid-edit.
   */
  describe("visibility is decided once", () => {
    it("keeps the group on screen after the user fills in the field that opened it", async () => {
      const control = unsatisfiedControl();
      const { detectChanges } = await renderComponent({ controls: [control] });
      expect(groupHeading()).toBeInTheDocument();

      control.setValue("now-provided");
      detectChanges();

      expect(groupHeading()).toBeInTheDocument();
      expect(screen.getByText("projected content")).toBeInTheDocument();
    });

    it("keeps the group hidden after a field it groups is emptied", async () => {
      const control = satisfiedControl();
      const { detectChanges } = await renderComponent({ controls: [control] });
      expect(groupHeading()).toBeNull();

      control.setValue(null);
      detectChanges();

      expect(groupHeading()).toBeNull();
    });
  });
});
