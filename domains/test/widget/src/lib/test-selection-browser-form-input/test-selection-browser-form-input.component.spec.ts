import { MockBuilder, MockRender, ngMocks } from "ng-mocks";
import { TestSelectionBrowserFormInputComponent } from "./test-selection-browser-form-input.component";
import { TestSelectionBrowserDialogComponent } from "../test-selection-browser-dialog/test-selection-browser-dialog.component";
import { By } from "@angular/platform-browser";
import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

const defaultInputs = {
  projectId: "project-1",
  testSequenceName: "sequence-a",
  repositoryId: "repo-1",
};

@Component({
  selector: "test-host",
  template: `
    <mxevolve-test-selection-browser-form-input
      [projectId]="defaultInputs.projectId"
      [testSequenceName]="defaultInputs.testSequenceName"
      [repositoryId]="defaultInputs.repositoryId"
      [formControl]="control"
    />
  `,
  imports: [TestSelectionBrowserFormInputComponent, ReactiveFormsModule],
})
class TestHostComponent {
  control = new FormControl<string | null>(null);
  protected readonly defaultInputs = defaultInputs;
}

describe("TestSelectionBrowserFormInputComponent", () => {
  beforeEach(async () => {
    await MockBuilder(TestHostComponent)
      .keep(TestSelectionBrowserFormInputComponent)
      .keep(ReactiveFormsModule)
      .mock(TestSelectionBrowserDialogComponent);
  });

  function render() {
    const fixture = MockRender(TestHostComponent);
    fixture.detectChanges();
    return fixture;
  }

  function getTestSelectionBrowserFormInputComponent(
    fixture: ReturnType<typeof render>
  ) {
    return ngMocks.find(fixture, TestSelectionBrowserFormInputComponent)
      .componentInstance;
  }

  function getInputElement(
    fixture: ReturnType<typeof render>
  ): HTMLInputElement {
    return fixture.debugElement.query(
      By.css('[data-testid="selected-path-input"]')
    ).nativeElement;
  }

  function getDialog(fixture: ReturnType<typeof render>) {
    return ngMocks.find(fixture, TestSelectionBrowserDialogComponent);
  }

  it("should create the component", () => {
    const fixture = render();
    expect(getTestSelectionBrowserFormInputComponent(fixture)).toBeTruthy();
  });

  it("should render an empty input initially", () => {
    const fixture = render();
    expect(getInputElement(fixture).value).toBe("");
  });

  it("should pass inputs to the dialog", () => {
    const fixture = render();
    const dialog = getDialog(fixture);
    expect(ngMocks.input(dialog, "projectId")).toBe(defaultInputs.projectId);
    expect(ngMocks.input(dialog, "testSequenceName")).toBe(
      defaultInputs.testSequenceName
    );
    expect(ngMocks.input(dialog, "repositoryId")).toBe(
      defaultInputs.repositoryId
    );
  });

  it("should display the value when the form control value is set via setValue", () => {
    const fixture = render();
    fixture.point.componentInstance.control.setValue("Root/Written");
    fixture.detectChanges();
    expect(getInputElement(fixture).value).toBe("Root/Written");
  });

  it("should clear the displayed value when the form control is reset", () => {
    const fixture = render();
    fixture.point.componentInstance.control.setValue("Root/Child");
    fixture.point.componentInstance.control.reset();
    fixture.detectChanges();
    expect(getInputElement(fixture).value).toBe("");
  });

  it("should update the form control value when a path is submitted", () => {
    const fixture = render();
    getTestSelectionBrowserFormInputComponent(fixture).onPathSubmitted(
      "Root/Child/Leaf"
    );
    expect(fixture.point.componentInstance.control.value).toBe(
      "Root/Child/Leaf"
    );
  });

  it("should display the submitted path in the input", () => {
    const fixture = render();
    getTestSelectionBrowserFormInputComponent(fixture).onPathSubmitted(
      "Root/Child/Leaf"
    );
    fixture.detectChanges();
    expect(getInputElement(fixture).value).toBe("Root/Child/Leaf");
  });

  it("should close the dialog after a path is submitted", () => {
    const fixture = render();
    getTestSelectionBrowserFormInputComponent(fixture).dialogVisible.set(true);
    getTestSelectionBrowserFormInputComponent(fixture).onPathSubmitted(
      "Root/Child/Leaf"
    );
    expect(
      getTestSelectionBrowserFormInputComponent(fixture).dialogVisible()
    ).toBe(false);
  });

  it("should overwrite a previously submitted path", () => {
    const fixture = render();
    getTestSelectionBrowserFormInputComponent(fixture).onPathSubmitted(
      "Root/First"
    );
    getTestSelectionBrowserFormInputComponent(fixture).onPathSubmitted(
      "Root/Second"
    );
    expect(fixture.point.componentInstance.control.value).toBe("Root/Second");
  });

  it("should not open the dialog initially", () => {
    const fixture = render();
    expect(ngMocks.input(getDialog(fixture), "visible")).toBe(false);
  });

  it("should open the dialog when the input is clicked", () => {
    const fixture = render();
    getInputElement(fixture).click();
    fixture.detectChanges();
    expect(ngMocks.input(getDialog(fixture), "visible")).toBe(true);
  });

  it("should not update the form value when the dialog is closed without submitting", () => {
    const fixture = render();
    getTestSelectionBrowserFormInputComponent(fixture).onPathSubmitted(
      "Previous/Path"
    );
    getTestSelectionBrowserFormInputComponent(fixture).dialogVisible.set(true);
    getTestSelectionBrowserFormInputComponent(fixture).dialogVisible.set(false);
    expect(fixture.point.componentInstance.control.value).toBe("Previous/Path");
    fixture.detectChanges();
    expect(getInputElement(fixture).value).toBe("Previous/Path");
  });

  it("should not be touched before any interaction", () => {
    const fixture = render();
    expect(fixture.point.componentInstance.control.untouched).toBe(true);
  });

  it("should mark the form control as touched when a path is submitted", () => {
    const fixture = render();
    getTestSelectionBrowserFormInputComponent(fixture).onPathSubmitted(
      "Root/Child/Leaf"
    );
    expect(fixture.point.componentInstance.control.touched).toBe(true);
  });

  it("should not mark the form control as touched when the dialog is opened without submitting", () => {
    const fixture = render();
    getInputElement(fixture).click();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.control.untouched).toBe(true);
  });
});
