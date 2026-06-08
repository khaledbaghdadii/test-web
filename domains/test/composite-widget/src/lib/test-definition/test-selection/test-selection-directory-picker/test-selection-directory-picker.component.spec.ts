import { of } from "rxjs";
import { TestSelectionDirectoryPickerComponent } from "./test-selection-directory-picker.component";
import { RepositoryService } from "@mxflow/features/repository";
import { Store } from "@ngrx/store";
import { RepositoryDirectoryPickerComponent } from "@mxflow/features/scm";
import { By } from "@angular/platform-browser";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";

describe("Edit TestSelection form component", () => {
  let fixture: MockedComponentFixture<TestSelectionDirectoryPickerComponent>;
  let component: TestSelectionDirectoryPickerComponent;
  let repositoryService: jest.Mocked<RepositoryService>;
  let store: Store;

  beforeEach(async () => {
    store = {
      select: jest.fn().mockReturnValue(of()),
      pipe: jest.fn(),
    } as unknown as Store;

    repositoryService = {
      getRepoById: jest.fn().mockReturnValue(of({})),
    } as unknown as jest.Mocked<RepositoryService>;

    await MockBuilder(TestSelectionDirectoryPickerComponent)
      .mock(RepositoryService, repositoryService)
      .mock(Store, store)
      .mock(RepositoryDirectoryPickerComponent);

    fixture = MockRender(TestSelectionDirectoryPickerComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
    const fn = jest.fn();
    component.registerOnChange(fn);
    component.registerOnTouched(fn);
  });

  describe("onInit", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
      const storeSpy = jest.spyOn(store, "select");
      expect(storeSpy).toHaveBeenCalled();
    });
  });

  describe("handleTestDirectorySelected", () => {
    it("should omit the base path from the selected path", () => {
      component.basePath = "base_path";
      component.handleTestDirectorySelected(
        component.basePath + "/config/TestPackageConfig/RootSuite"
      );
      expect(component.selectedPath).toEqual("RootSuite");
    });
  });

  describe("ngOnDestroy", () => {
    it("should complete the destroy subject", () => {
      const completeSpy = jest.spyOn(component["destroy$"], "complete");

      fixture.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("onDialogClosed", () => {
    it("should emit dialogClosedEvent", () => {
      const dialogClosedSpy = jest.spyOn(component.dialogClosedEvent, "emit");
      component.onDialogClosed();
      expect(dialogClosedSpy).toHaveBeenCalled();
    });
  });

  describe("openRepositoryBrowser", () => {
    it("should call openBrowserOnFilteredSelectedDirectory when selectedPath is defined", () => {
      component.selectedPath = "some_path";
      component.repoBrowser = {
        openBrowserOnFilteredSelectedDirectory: jest.fn(),
        openBrowserOnFilteredDirectory: jest.fn(),
      } as unknown as RepositoryDirectoryPickerComponent;
      const openBrowserOnFilteredSelectedDirectorySpy = jest.spyOn(
        component.repoBrowser,
        "openBrowserOnFilteredSelectedDirectory"
      );
      component.openRepositoryBrowser();
      expect(openBrowserOnFilteredSelectedDirectorySpy).toHaveBeenCalled();
    });
    it("should call openBrowserOnFilteredDirectory when selectedPath is not defined", () => {
      component.repoBrowser = {
        openBrowserOnFilteredSelectedDirectory: jest.fn(),
        openBrowserOnFilteredDirectory: jest.fn(),
      } as unknown as RepositoryDirectoryPickerComponent;
      const openBrowserOnFilteredDirectorySpy = jest.spyOn(
        component.repoBrowser,
        "openBrowserOnFilteredDirectory"
      );
      component.openRepositoryBrowser();
      expect(openBrowserOnFilteredDirectorySpy).toHaveBeenCalled();
    });
  });
  describe("dom tests", () => {
    it("should call openRepositoryBrowser when folder icon is clicked", () => {
      const onSubmitSpy = jest.spyOn(component, "openRepositoryBrowser");
      fixture.detectChanges();
      const openRepoFolderInput = fixture.debugElement.query(
        By.css('[data-testid="test-selection-selection-input"]')
      );
      expect(openRepoFolderInput).not.toBeNull();
      openRepoFolderInput.nativeElement.click();
      fixture.detectChanges();
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });
    it("should call testSelectionFieldClicked when text input is clicked", () => {
      const onSubmitSpy = jest.spyOn(component, "testSelectionFieldClicked");
      fixture.detectChanges();
      const testSelectionSelectionInput = fixture.debugElement.query(
        By.css('[data-testid="test-selection-selection-input"]')
      );
      expect(testSelectionSelectionInput).not.toBeNull();
      testSelectionSelectionInput.nativeElement.click();
      fixture.detectChanges();
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });
  });
});
