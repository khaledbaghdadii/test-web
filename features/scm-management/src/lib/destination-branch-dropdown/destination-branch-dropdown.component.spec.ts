import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  DestinationBranchDropdownComponent,
  MergeConfiguration,
  MergeConfigurationFilterRequest,
  MergeConfigurationPage,
  MergeConfigurationService,
} from "@mxflow/features/scm-management";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { of, throwError } from "rxjs";
import { DestroyRef } from "@angular/core";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
} from "@mxflow/ui/mxevolve-dropdown";

describe("Destination Branch Dropdown Component Test", () => {
  const PROJECT_ID = "projectId";
  const REPOSITORY_ID = "repositoryId";
  const REPOSITORY_NAME = "test-repo";
  const MERGE_CONFIG_ID = "1";
  const MERGE_CONFIG_ID_2 = "2";
  const DEFAULT_DEST_BRANCH_NAME = "feature-1";
  const DEST_BRANCH_NAME = "feature-2";
  const PAGE_INDEX_FIRST = 0;
  const PAGE_SIZE = 100;
  const TOTAL_MERGE_CONFIGURATION_ELEMENTS = 1000;
  const FILTER_REQUEST: MergeConfigurationFilterRequest = {
    searchKey: "",
    repositoryId: REPOSITORY_ID,
  };

  const MERGE_CONFIG: MergeConfiguration = {
    id: MERGE_CONFIG_ID,
    branchName: DEFAULT_DEST_BRANCH_NAME,
    projectId: PROJECT_ID,
    mergeConfigurationDefinition: {
      id: "def-1",
      repositoryId: REPOSITORY_ID,
      branchPattern: "^feature-1$",
    },
  };
  const MERGE_CONFIG_2: MergeConfiguration = {
    id: MERGE_CONFIG_ID_2,
    branchName: DEST_BRANCH_NAME,
    projectId: PROJECT_ID,
    mergeConfigurationDefinition: {
      id: "def-2",
      repositoryId: REPOSITORY_ID,
      branchPattern: "^feature-2$",
    },
  };

  let repositoryService: jest.Mocked<RepositoryService>;
  let mergeConfigurationService: jest.Mocked<MergeConfigurationService>;

  let fixture: ComponentFixture<DestinationBranchDropdownComponent>;
  let component: DestinationBranchDropdownComponent;

  beforeEach(async () => {
    repositoryService = {
      getRepoById: jest.fn(() => of(getRepository())),
    } as unknown as jest.Mocked<RepositoryService>;
    mergeConfigurationService = {
      getFilteredMergeConfigurations: jest.fn(
        (projectId, filterRequest, pageSize, pageIndex) =>
          of(
            getFilteredMergeConfigurations(
              projectId,
              filterRequest,
              pageSize,
              pageIndex
            )
          )
      ),
    } as unknown as jest.Mocked<MergeConfigurationService>;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        DestinationBranchDropdownComponent,
        MxevolveSingleSelectDropdownComponent,
      ],
    })
      .overrideComponent(DestinationBranchDropdownComponent, {
        set: {
          providers: [
            ...BaseSingleSelectDropdown.createProviders(
              DestinationBranchDropdownComponent
            ),
            {
              provide: MergeConfigurationService,
              useValue: mergeConfigurationService,
            },
            {
              provide: RepositoryService,
              useValue: repositoryService,
            },
            {
              provide: DestroyRef,
              useValue: mockDestroyRef,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DestinationBranchDropdownComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("repositoryId", REPOSITORY_ID);
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should extend BaseSingleSelectDropdown", () => {
    expect(component instanceof BaseSingleSelectDropdown).toBe(true);
  });

  describe("On Init", () => {
    it("should fetch the dest branch data of a specified repo from repository service and merge configuration service", () => {
      fixture.detectChanges();

      const initialMergeConfigurationPageContent =
        getFilteredMergeConfigurations(
          PROJECT_ID,
          FILTER_REQUEST,
          PAGE_SIZE,
          PAGE_INDEX_FIRST
        ).content;

      expect(component.defaultDestinationBranchConfiguration).toStrictEqual(
        MERGE_CONFIG
      );
      expect(component.mergeConfigurations).toStrictEqual(
        initialMergeConfigurationPageContent
      );
      expect(repositoryService.getRepoById).toHaveBeenCalledWith(
        PROJECT_ID,
        REPOSITORY_ID
      );
      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        FILTER_REQUEST,
        PAGE_SIZE,
        PAGE_INDEX_FIRST
      );
    });

    it("should fetch only the first merge configuration page from one call to merge configuration service on init", () => {
      fixture.detectChanges();

      const filterRequest: MergeConfigurationFilterRequest = {
        searchKey: "",
        repositoryId: REPOSITORY_ID,
      };
      const initialMergeConfigurationPageContent =
        getFilteredMergeConfigurations(
          PROJECT_ID,
          filterRequest,
          PAGE_SIZE,
          0
        ).content;

      expect(component.mergeConfigurations).toStrictEqual(
        initialMergeConfigurationPageContent
      );
      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(PROJECT_ID, filterRequest, PAGE_SIZE, 0);
      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledTimes(1);
    });

    it("should set the default configuration to the one matching the given default destination branch name", () => {
      component.defaultDestinationBranchName = DEST_BRANCH_NAME;
      fixture.detectChanges();

      const initialMergeConfigurationPageContent =
        getFilteredMergeConfigurations(
          PROJECT_ID,
          FILTER_REQUEST,
          PAGE_SIZE,
          PAGE_INDEX_FIRST
        ).content;

      expect(component.mergeConfigurations).toStrictEqual(
        initialMergeConfigurationPageContent
      );
      expect(component.defaultDestinationBranchConfiguration).toStrictEqual(
        MERGE_CONFIG_2
      );
      expect(repositoryService.getRepoById).toHaveBeenCalledWith(
        PROJECT_ID,
        REPOSITORY_ID
      );
      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        FILTER_REQUEST,
        PAGE_SIZE,
        PAGE_INDEX_FIRST
      );
    });

    it("should set the default configuration to repository default if the given branch name is invalid", () => {
      fixture.detectChanges();

      const initialMergeConfigurationPageContent =
        getFilteredMergeConfigurations(
          PROJECT_ID,
          FILTER_REQUEST,
          PAGE_SIZE,
          PAGE_INDEX_FIRST
        ).content;

      expect(component.mergeConfigurations).toStrictEqual(
        initialMergeConfigurationPageContent
      );
      expect(component.defaultDestinationBranchConfiguration).toStrictEqual(
        MERGE_CONFIG
      );
      expect(repositoryService.getRepoById).toHaveBeenCalledWith(
        PROJECT_ID,
        REPOSITORY_ID
      );
      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        FILTER_REQUEST,
        PAGE_SIZE,
        PAGE_INDEX_FIRST
      );
    });

    it("should set no default destination branch on failure to fetch default from repository service and invalid passed destination branch", () => {
      jest
        .spyOn(repositoryService, "getRepoById")
        .mockReturnValue(throwError(() => "Error"));
      fixture.detectChanges();

      const initialMergeConfigurationPageContent =
        getFilteredMergeConfigurations(
          PROJECT_ID,
          FILTER_REQUEST,
          PAGE_SIZE,
          PAGE_INDEX_FIRST
        ).content;

      expect(component.mergeConfigurations).toStrictEqual(
        initialMergeConfigurationPageContent
      );
      expect(component.defaultDestinationBranchConfiguration).toBeUndefined();
      expect(repositoryService.getRepoById).toHaveBeenCalledWith(
        PROJECT_ID,
        REPOSITORY_ID
      );
      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        FILTER_REQUEST,
        PAGE_SIZE,
        PAGE_INDEX_FIRST
      );
    });

    it("should display error message on failure to fetch destination branches", () => {
      jest
        .spyOn(mergeConfigurationService, "getFilteredMergeConfigurations")
        .mockReturnValue(throwError(() => "Error"));

      fixture.detectChanges();

      expect(component.mergeConfigurations).toStrictEqual([]);
      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        FILTER_REQUEST,
        PAGE_SIZE,
        PAGE_INDEX_FIRST
      );
      expect(repositoryService.getRepoById).not.toHaveBeenCalled();
    });

    it("should not set default destination branch when setDefaultDestinationBranch is false", () => {
      component.setDefaultDestinationBranch = false;
      fixture.detectChanges();

      expect(component.defaultDestinationBranchConfiguration).toStrictEqual(
        MERGE_CONFIG
      );
    });

    it("should set default destination branch when setDefaultDestinationBranch is true", () => {
      component.setDefaultDestinationBranch = true;
      fixture.detectChanges();

      expect(component.defaultDestinationBranchConfiguration).toStrictEqual(
        MERGE_CONFIG
      );
    });
  });

  describe("ControlValueAccessor", () => {
    it("should implement ControlValueAccessor methods", () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
      expect(component.setDisabledState).toBeDefined();
    });

    it("should register onChange callback", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      component.onSelectionChange(MERGE_CONFIG);

      expect(onChangeFn).toHaveBeenCalledWith(MERGE_CONFIG);
    });

    it("should register onChange callback and handle null", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      component.onSelectionChange(null);

      expect(onChangeFn).toHaveBeenCalledWith(null);
    });
  });

  describe("onError", () => {
    it("should emit error through failureEvent", () => {
      const failureSpy = jest.fn();
      component.failureEvent.subscribe(failureSpy);

      component.onError("Test error message");

      expect(failureSpy).toHaveBeenCalledWith("Test error message");
    });
  });

  function getRepository(): Repository {
    return {
      id: REPOSITORY_ID,
      name: REPOSITORY_NAME,
      url: "repoUrl",
      credentialsId: "credentialsId",
      label: "config",
      defaultBranch: DEFAULT_DEST_BRANCH_NAME,
    };
  }

  function getFilteredMergeConfigurations(
    projectId: string = PROJECT_ID,
    filterRequest: MergeConfigurationFilterRequest = FILTER_REQUEST,
    pageSize: number = PAGE_SIZE,
    pageIndex: number = PAGE_INDEX_FIRST
  ): MergeConfigurationPage {
    const totalElements = TOTAL_MERGE_CONFIGURATION_ELEMENTS;

    const totalPages = Math.ceil(totalElements / pageSize);
    const lastPageSize = totalElements % pageSize || pageSize;

    const content = Array.from(
      { length: pageIndex === totalPages - 1 ? lastPageSize : pageSize },
      (_, index) => {
        const id = (pageIndex * pageSize + index + 1).toString();
        return {
          id,
          projectId,
          branchName: `feature-${id}`,
          mergeConfigurationDefinition: {
            id: `def-${id}`,
            repositoryId: REPOSITORY_ID,
            branchPattern: `^feature-${id}$`,
          },
        } as MergeConfiguration;
      }
    );

    return {
      content,
      totalPages,
      totalElements,
      size: pageSize,
      number: pageIndex,
      last: pageIndex === totalPages - 1,
    };
  }
});
