import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { WhitespaceValidators } from "@mxevolve/shared/ui/form";
import { DefinitionInputComponent } from "./definition-input.component";

const TEMPLATE = `
  <mxevolve-definition-input
    [inputId]="inputId"
    [control]="control"
    [label]="label"
    [description]="description"
    [tooltip]="tooltip"
    [showValidationErrors]="showValidationErrors"
  >
    <input [id]="inputId" [formControl]="control" />
  </mxevolve-definition-input>
`;

interface RenderOptions {
  control?: FormControl;
  label?: string;
  description?: string;
  tooltip?: string;
  showValidationErrors?: boolean;
}

async function renderComponent({
  control = new FormControl(""),
  label = "Archival Branch Name",
  description = "Enter the name of the archival branch",
  tooltip = "",
  showValidationErrors = true,
}: RenderOptions = {}) {
  return render(TEMPLATE, {
    imports: [DefinitionInputComponent, ReactiveFormsModule],
    componentProperties: {
      inputId: "archival-branch",
      control,
      label,
      description,
      tooltip,
      showValidationErrors,
    },
  });
}

function requiredControl(value = ""): FormControl {
  return new FormControl(value, [Validators.required]);
}

describe("DefinitionInputComponent", () => {
  it("labels the projected control", async () => {
    await renderComponent();

    expect(screen.getByLabelText("Archival Branch Name")).toBeTruthy();
  });

  it("omits the label when none is provided", async () => {
    await renderComponent({ label: "" });

    expect(screen.queryByText("Archival Branch Name")).toBeNull();
  });

  it("marks the field as required when the control has a required validator", async () => {
    await renderComponent({ control: requiredControl() });

    expect(
      screen.getByText("Archival Branch Name").classList.contains("required")
    ).toBe(true);
  });

  it("leaves an optional field unmarked", async () => {
    await renderComponent();

    expect(
      screen.getByText("Archival Branch Name").classList.contains("required")
    ).toBe(false);
  });

  it("shows the field description", async () => {
    await renderComponent({ description: "Pick an existing branch" });

    expect(screen.getByText("Pick an existing branch")).toBeTruthy();
  });

  it("explains the field through a tooltip when the user hovers the hint icon", async () => {
    const user = userEvent.setup();
    await renderComponent({ tooltip: "A final product is the client config" });

    await user.hover(document.querySelector("i.pi-info-circle") as Element);

    expect(
      screen.getByText("A final product is the client config")
    ).toBeTruthy();
  });

  it("keeps showing the description while an invalid field is still untouched", async () => {
    await renderComponent({
      control: requiredControl(),
      description: "Pick an existing branch",
    });

    expect(screen.getByText("Pick an existing branch")).toBeTruthy();
    expect(screen.queryByText("Field is required")).toBeNull();
  });

  it("replaces the description with the error once the user empties a required field", async () => {
    const user = userEvent.setup();
    await renderComponent({
      control: requiredControl("main"),
      description: "Pick an existing branch",
    });

    await user.clear(screen.getByLabelText("Archival Branch Name"));

    expect(screen.getByText("Field is required")).toBeTruthy();
    expect(screen.queryByText("Pick an existing branch")).toBeNull();
  });

  it("reports a blank value as whitespace-only", async () => {
    const control = new FormControl("   ", [WhitespaceValidators.notBlank()]);
    const { fixture } = await renderComponent({ control });

    control.markAsDirty();
    fixture.detectChanges();

    expect(screen.getByText("Field cannot be whitespaces")).toBeTruthy();
  });

  it("reports an empty multi-select as needing at least one value", async () => {
    const control = new FormControl<string[]>([]);
    const { fixture } = await renderComponent({ control });

    control.markAsDirty();
    control.setErrors({ minlength: { requiredLength: 1, actualLength: 0 } });
    fixture.detectChanges();

    expect(screen.getByText("Select at least one value")).toBeTruthy();
  });

  it("surfaces the branch validator's own message", async () => {
    const control = new FormControl("feature/x");
    const { fixture } = await renderComponent({ control });

    control.markAsDirty();
    control.setErrors({ branchInvalid: "Branch already exists." });
    fixture.detectChanges();

    expect(screen.getByText("Branch already exists.")).toBeTruthy();
  });

  it("hides validation errors when the consumer opts out", async () => {
    const control = requiredControl();
    control.markAsDirty();
    await renderComponent({ control, showValidationErrors: false });

    expect(screen.queryByText("Field is required")).toBeNull();
  });
});
