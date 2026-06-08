import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { InputText } from "primeng/inputtext";
import { RerunDialogComponent } from "./rerun-dialog.component";
import { FactoryProductInputComponent } from "../rerun-scenario-button/factory-product-input/factory-product-input.component";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

const MOCK_IMPORTS = [
  MockComponent(FactoryProductInputComponent),
  MockComponent(MxevolveIconComponent),
  ReactiveFormsModule,
  Button,
  Dialog,
  Message,
  InputText,
];

const REQUIRED_INPUTS = {
  projectId: "project-123",
  visible: true,
};

async function renderComponent(
  inputs: Partial<
    typeof REQUIRED_INPUTS & {
      factoryProductId: string;
      warningMessage: string;
      loading: boolean;
    }
  > = {}
) {
  return render(RerunDialogComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
  });
}

describe("RerunDialogComponent", () => {
  afterEach(() => {
    document.body
      .querySelectorAll(".p-dialog-mask")
      .forEach((el) => el.remove());
  });

  it("renders the dialog when visible", async () => {
    await renderComponent();

    expect(screen.getByText("Scenario Rerun")).toBeTruthy();
  });

  it("does not render the dialog when not visible", async () => {
    await renderComponent({ visible: false });

    expect(screen.queryByText("Scenario Rerun")).toBeNull();
  });

  it("shows the warning message when provided", async () => {
    await renderComponent({ warningMessage: "This is a warning" });

    expect(screen.getByText("This is a warning")).toBeTruthy();
  });

  it("does not show a warning message when not provided", async () => {
    await renderComponent();

    expect(screen.queryByText("This is a warning")).toBeNull();
  });

  it("shows commit ID helper text", async () => {
    await renderComponent();

    expect(
      screen.getByText("Defaults to the HEAD commit if left empty.")
    ).toBeTruthy();
  });

  it("disables the Rerun button when no factory product is selected", async () => {
    await renderComponent();

    expect(screen.getByRole("button", { name: "Rerun" })).toBeDisabled();
  });

  it("emits rerunRequested with the selected factory product", async () => {
    const rerunSpy = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

    const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
    ngMocks.output(fpInput, "factoryProductIdChange").emit("fp-456");
    fixture.detectChanges();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Rerun" }));

    expect(rerunSpy).toHaveBeenCalledWith({
      factoryProductId: "fp-456",
      commitId: undefined,
    });
  });

  it("emits rerunRequested with the commit ID when provided", async () => {
    const rerunSpy = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

    const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
    ngMocks.output(fpInput, "factoryProductIdChange").emit("fp-456");
    fixture.detectChanges();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Enter a commit ID"), "abc123");
    await user.click(screen.getByRole("button", { name: "Rerun" }));

    expect(rerunSpy).toHaveBeenCalledWith({
      factoryProductId: "fp-456",
      commitId: "abc123",
    });
  });

  it("passes the projectId to FactoryProductInputComponent", async () => {
    const { fixture } = await renderComponent({ projectId: "proj-789" });

    const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
    expect(ngMocks.input(fpInput, "projectId")).toBe("proj-789");
  });

  it("passes the factoryProductId to FactoryProductInputComponent", async () => {
    const { fixture } = await renderComponent({
      factoryProductId: "fp-pre-filled",
    });

    const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
    expect(ngMocks.input(fpInput, "factoryProductId")).toBe("fp-pre-filled");
  });

  it("resets the commit ID field when the dialog opens", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(
      screen.getByPlaceholderText("Enter a commit ID"),
      "old-value"
    );
    expect(screen.getByPlaceholderText("Enter a commit ID")).toHaveValue(
      "old-value"
    );

    fixture.componentInstance.visible.set(false);
    fixture.detectChanges();
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByPlaceholderText("Enter a commit ID")).toHaveValue("");
  });
});
