import { MockBuilder, MockRender, ngMocks } from "ng-mocks";
import { Dialog } from "primeng/dialog";
import { Button } from "primeng/button";
import { DomTestUtils } from "@mxevolve/testing";
import { TestSelectionBrowserDialogComponent } from "./test-selection-browser-dialog.component";
import { TestSelectionBrowserComponent } from "../test-selection-browser/test-selection-browser.component";
import { PrimeTemplate } from "primeng/api";

const modalInputs = {
  visible: true,
  projectId: "project-1",
  testSequenceName: "sequence-a",
  repositoryId: "repo-1",
};

describe("TestSelectionBrowserDialogComponent", () => {
  beforeEach(async () => {
    await MockBuilder(TestSelectionBrowserDialogComponent)
      .keep(Dialog)
      .keep(Button)
      .keep(PrimeTemplate)
      .mock(TestSelectionBrowserComponent);
  });

  function render(inputs = { ...modalInputs }) {
    const fixture = MockRender(TestSelectionBrowserDialogComponent, inputs);
    fixture.detectChanges();
    return fixture;
  }

  it("should create the component", () => {
    const fixture = render();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it("should render the dialog with the correct header", () => {
    const fixture = render();
    const dialog = ngMocks.find(fixture, Dialog);
    expect(ngMocks.input(dialog, "header")).toBe("Test Selection Browser");
  });

  it("should not render the browser when not visible", () => {
    const fixture = render({ ...modalInputs, visible: false });
    const browser = ngMocks.find(fixture, TestSelectionBrowserComponent, null);
    expect(browser).toBeNull();
  });

  it("should render the browser when visible", () => {
    const fixture = render();
    const browser = ngMocks.find(fixture, TestSelectionBrowserComponent);
    expect(browser).toBeTruthy();
  });

  it("should destroy the browser when dialog is no longer visible", () => {
    const fixture = render();
    expect(
      ngMocks.find(fixture, TestSelectionBrowserComponent, null)
    ).toBeTruthy();

    fixture.point.componentInstance.visible.set(false);
    fixture.detectChanges();

    expect(
      ngMocks.find(fixture, TestSelectionBrowserComponent, null)
    ).toBeNull();
  });

  it("should recreate the browser when dialog is reopened", () => {
    const fixture = render();
    const browserFirst = ngMocks.find(fixture, TestSelectionBrowserComponent);

    fixture.point.componentInstance.visible.set(false);
    fixture.detectChanges();

    fixture.point.componentInstance.visible.set(true);
    fixture.detectChanges();

    const browserSecond = ngMocks.find(fixture, TestSelectionBrowserComponent);
    expect(browserSecond).toBeTruthy();
    expect(browserSecond).not.toBe(browserFirst);
  });

  it("should pass the needed params to the browser component", () => {
    const fixture = render({ ...modalInputs });
    const browser = ngMocks.find(fixture, TestSelectionBrowserComponent);
    expect(ngMocks.input(browser, "projectId")).toBe(modalInputs.projectId);
    expect(ngMocks.input(browser, "testSequenceName")).toBe(
      modalInputs.testSequenceName
    );
    expect(ngMocks.input(browser, "repositoryId")).toBe(
      modalInputs.repositoryId
    );
  });

  it("should allow the dialog to control visibility of the component", () => {
    const fixture = render();
    const dialog = ngMocks.find(fixture, Dialog);
    ngMocks.output(dialog, "visibleChange").emit(false);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.visible()).toBe(false);
  });

  it("should reset the current path when the dialog is closed", () => {
    const fixture = render();
    fixture.point.componentInstance.setSelectedPath("Root/Child");
    fixture.detectChanges();
    expect(fixture.point.componentInstance.currentPath()).toBe("Root/Child");

    fixture.point.componentInstance.visible.set(false);
    fixture.detectChanges();

    expect(fixture.point.componentInstance.currentPath()).toBeNull();
  });

  describe("path selection", () => {
    it("should store the current path when the browser emits a path", () => {
      const fixture = render();
      const browser = ngMocks.find(fixture, TestSelectionBrowserComponent);
      ngMocks.output(browser, "testSelectionPathEmitter").emit("Root/Child");
      fixture.detectChanges();
      expect(fixture.point.componentInstance.currentPath()).toBe("Root/Child");
    });

    it("should update the current path when a different node is selected", () => {
      const fixture = render();
      const browser = ngMocks.find(fixture, TestSelectionBrowserComponent);
      ngMocks.output(browser, "testSelectionPathEmitter").emit("Root/Child");
      ngMocks.output(browser, "testSelectionPathEmitter").emit("Root/Other");
      fixture.detectChanges();
      expect(fixture.point.componentInstance.currentPath()).toBe("Root/Other");
    });
  });

  describe("Submit button", () => {
    it("should be disabled when no path is selected", () => {
      const fixture = render();
      expect(
        DomTestUtils.getButtonByTestId(fixture, "submit-button").isDisabled()
      ).toBe(true);
    });

    it("should be enabled when a path is selected", () => {
      const fixture = render();
      fixture.point.componentInstance.setSelectedPath("Root/Child");
      fixture.detectChanges();
      expect(
        DomTestUtils.getButtonByTestId(fixture, "submit-button").isDisabled()
      ).toBe(false);
    });

    it("should not emit path when no path is set", () => {
      const fixture = render();
      const emitSpy = jest.spyOn(
        fixture.point.componentInstance.testSelectionPathSelected,
        "emit"
      );
      fixture.point.componentInstance.submit();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should emit the current path when the submit button is clicked", () => {
      const fixture = render();
      const emitSpy = jest.spyOn(
        fixture.point.componentInstance.testSelectionPathSelected,
        "emit"
      );
      fixture.point.componentInstance.setSelectedPath("Root/Child");
      fixture.detectChanges();
      DomTestUtils.getButtonByTestId(fixture, "submit-button").click();
      expect(emitSpy).toHaveBeenCalledWith("Root/Child");
    });

    it("should close the dialog when the submit button is clicked", () => {
      const fixture = render();
      fixture.point.componentInstance.setSelectedPath("Root/Child");
      fixture.detectChanges();
      DomTestUtils.getButtonByTestId(fixture, "submit-button").click();
      fixture.detectChanges();
      expect(fixture.point.componentInstance.visible()).toBe(false);
    });
  });
});
