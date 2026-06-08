import { BusinessProcessDestinationBranchInputComponent } from "./business-process-destination-branch-input.component";
import { FormControl } from "@angular/forms";
import {
  DestinationBranchDropdownComponent,
  MergeConfiguration,
  MergeConfigurationPage,
  MergeConfigurationService,
} from "@mxflow/features/scm-management";
import { TestBed } from "@angular/core/testing";
import { MockComponent } from "ng-mocks";
import { of } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";

describe("Business process destination branch input component test", () => {
  let component: BusinessProcessDestinationBranchInputComponent;
  let mergeConfigurationService: Partial<MergeConfigurationService>;
  let toastMessageService: Partial<ToastMessageService>;

  beforeEach(() => {
    mergeConfigurationService = {
      getFilteredMergeConfigurations: jest.fn(() =>
        of({
          content: [getMergeConfiguration()],
        } as MergeConfigurationPage)
      ),
    };

    toastMessageService = {
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [
        BusinessProcessDestinationBranchInputComponent,
        MockComponent(DestinationBranchDropdownComponent),
      ],
    })
      .overrideComponent(BusinessProcessDestinationBranchInputComponent, {
        set: {
          providers: [
            {
              provide: MergeConfigurationService,
              useValue: mergeConfigurationService,
            },
            { provide: ToastMessageService, useValue: toastMessageService },
          ],
        },
      })
      .compileComponents();

    component = TestBed.createComponent(
      BusinessProcessDestinationBranchInputComponent
    ).componentInstance;

    component.projectId = "projectId";
    component.repositoryId = "repositoryId";
    component.mergeConfigurationIdFormControl = new FormControl();
  });

  describe("ngOnInit", () => {
    it("should initialize formControlAdapter", () => {
      component.ngOnInit();

      expect(component.formControlAdapter).toBeDefined();
    });

    it("should set initial loading state to true", () => {
      expect(component.mergeConfigurationLoading).toBe(true);
    });

    it("should update merge configuration id form control when the adapter form control value changes", () => {
      component.ngOnInit();
      component.formControlAdapter.setValue(getMergeConfiguration());

      expect(component.mergeConfigurationIdFormControl.value).toBe(
        "mergeConfigurationId"
      );
    });

    it("should mark merge configuration Id form control as dirty when value changes", () => {
      component.ngOnInit();
      component.formControlAdapter.setValue(getMergeConfiguration());

      expect(component.mergeConfigurationIdFormControl.dirty).toBeTruthy();
    });

    it("should not fetch initial value when mergeConfigurationIdFormControl has no initial value", () => {
      component.ngOnInit();

      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).not.toHaveBeenCalled();
    });

    it("should call fetch initial value with correct parameters when mergeConfigurationIdFormControl has initial value", () => {
      component.mergeConfigurationIdFormControl.setValue(
        "mergeConfigurationId"
      );

      component.ngOnInit();

      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(
        "projectId",
        {
          repositoryId: "repositoryId",
          searchKey: "mergeConfigurationId",
        },
        1
      );
    });

    it("should set formControlAdapter value when merge configuration is found", () => {
      component.mergeConfigurationIdFormControl.setValue(
        "mergeConfigurationId"
      );

      component.ngOnInit();

      expect(component.formControlAdapter.value).toEqual(
        getMergeConfiguration()
      );
    });

    it("should show error toast when merge configuration is not found", () => {
      component.mergeConfigurationIdFormControl.setValue(
        "mergeConfigurationId"
      );
      jest
        .spyOn(mergeConfigurationService, "getFilteredMergeConfigurations")
        .mockReturnValue(
          of({ content: [] as MergeConfiguration[] } as MergeConfigurationPage)
        );

      component.ngOnInit();

      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "The selected merge configuration could not be found, please select a new one."
      );
    });
  });

  describe("Merge configuration loading finished", () => {
    it("should set mergeConfigurationLoading to false", () => {
      component.mergeConfigurationLoading = true;

      component.mergeConfigurationLoadingFinished();

      expect(component.mergeConfigurationLoading).toBe(false);
    });
  });

  function getMergeConfiguration(): MergeConfiguration {
    return {
      id: "mergeConfigurationId",
      branchName: "branchName",
      projectId: "projectId",
      mergeConfigurationDefinition: {
        id: "mergeConfigurationId",
        repositoryId: "repositoryId",
      },
    };
  }
});
