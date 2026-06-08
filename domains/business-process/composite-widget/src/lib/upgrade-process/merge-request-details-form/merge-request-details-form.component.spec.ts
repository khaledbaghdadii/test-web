import { Component, input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, Subject } from "rxjs";
import { DeleteDevelopmentCheckboxComponent } from "@mxevolve/domains/business-process/widget";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import {
  MergeConfigurationDropdownComponent,
  ReviewersAutoCompleteComponent,
} from "@mxevolve/domains/scm/widget";
import {
  CommitsService,
  DevelopmentService,
  MergeConfigurationService,
} from "@mxevolve/domains/scm/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import {
  MergeRequestDetailsFormComponent,
  MergeRequestDetailsValue,
} from "./merge-request-details-form.component";

const MockDeleteDevelopmentCheckbox = MockComponent(
  DeleteDevelopmentCheckboxComponent
);
const MockMergeConfigurationDropdown = MockComponent(
  MergeConfigurationDropdownComponent
);
const MockReviewersAutoComplete = MockComponent(ReviewersAutoCompleteComponent);
const MockMxevolveIcon = MockComponent(MxevolveIconComponent);

const MOCK_MERGE_CONFIGURATION = {
  id: "mc-1",
  projectId: "proj-1",
  branchName: "main",
  mergeConfigurationDefinition: {
    id: "mcd-1",
    repositoryId: "repo-1",
    branchPattern: "main",
  },
};

const MOCK_DEVELOPMENT = {
  id: "dev-1",
  name: "feature-branch",
  projectId: "proj-1",
  repository: { id: "repo-1", url: "https://repo.example.com" },
  latestCommitId: "abc123",
  createdOn: "2026-01-01",
  parentCommitId: "parent123",
  deleted: false,
};

const MOCK_REVIEWERS = [
  { name: "user1", displayName: "User One" },
  { name: "user2", displayName: "User Two" },
];

const mockCommitsService = {
  getCommitDifferences: jest.fn(),
};

const mockDevelopmentService = {
  getDevelopment: jest.fn(),
};

const mockMergeConfigurationService = {
  getFilteredMergeConfigurations: jest.fn(),
};

@Component({
  selector: "mxevolve-test-host",
  standalone: true,
  imports: [MergeRequestDetailsFormComponent, ReactiveFormsModule],
  template: `
    <mxevolve-merge-request-details-form
      [formControl]="control"
      [projectId]="projectId()"
      [processId]="processId()"
      [developmentId]="developmentId()"
      [supportsResourceManagement]="supportsResourceManagement()"
      [parentBranchName]="parentBranchName()"
    />
  `,
})
class TestHostComponent {
  readonly projectId = input("proj-1");
  readonly processId = input("proc-1");
  readonly developmentId = input("dev-1");
  readonly supportsResourceManagement = input(true);
  readonly parentBranchName = input("main");
  readonly control = new FormControl<MergeRequestDetailsValue | null>(null);
}

async function renderComponent(
  overrides: Partial<{
    projectId: string;
    processId: string;
    developmentId: string;
    supportsResourceManagement: boolean;
    parentBranchName: string;
  }> = {}
) {
  return render(TestHostComponent, {
    inputs: { ...overrides },
    configureTestBed: (testBed) => {
      testBed.overrideComponent(MergeRequestDetailsFormComponent, {
        remove: {
          imports: [
            DeleteDevelopmentCheckboxComponent,
            MergeConfigurationDropdownComponent,
            ReviewersAutoCompleteComponent,
            MxevolveIconComponent,
          ],
        },
        add: {
          imports: [
            MockDeleteDevelopmentCheckbox,
            MockMergeConfigurationDropdown,
            MockReviewersAutoComplete,
            MockMxevolveIcon,
          ],
        },
      });
    },
    componentProviders: [
      { provide: CommitsService, useValue: mockCommitsService },
      { provide: DevelopmentService, useValue: mockDevelopmentService },
      {
        provide: MergeConfigurationService,
        useValue: mockMergeConfigurationService,
      },
    ],
  });
}

describe("MergeRequestDetailsFormComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommitsService.getCommitDifferences.mockReturnValue(of([]));
    mockDevelopmentService.getDevelopment.mockReturnValue(of(MOCK_DEVELOPMENT));
    mockMergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
      of({
        content: [MOCK_MERGE_CONFIGURATION],
        totalPages: 1,
        totalElements: 1,
        size: 1,
        number: 0,
        last: true,
      })
    );
  });

  it("renders MR title input", async () => {
    await renderComponent();

    expect(
      screen.getByRole("textbox", { name: /Merge Request Title/ })
    ).toBeTruthy();
  });

  it("renders destination branch dropdown with correct inputs when development is loaded", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-merge-configuration-dropdown")
      ).toBeTruthy();
      const dropdown = ngMocks.find(
        fixture,
        MergeConfigurationDropdownComponent
      );
      expect(dropdown.componentInstance.projectId).toBe("proj-1");
      expect(dropdown.componentInstance.repositoryId).toBe("repo-1");
    });
  });

  it("hides destination branch dropdown while development is loading", async () => {
    mockDevelopmentService.getDevelopment.mockReturnValue(new Subject());
    await renderComponent();

    expect(
      document.querySelector("mxevolve-merge-configuration-dropdown")
    ).toBeNull();
  });

  it("renders reviewers autocomplete with correct inputs when development is loaded", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-autocomplete-reviewers")
      ).toBeTruthy();
      const autocomplete = ngMocks.find(
        fixture,
        ReviewersAutoCompleteComponent
      );
      expect(autocomplete.componentInstance.projectId).toBe("proj-1");
      expect(autocomplete.componentInstance.sourceDevelopmentId).toBe("dev-1");
    });
  });

  it("hides reviewers autocomplete while development is loading", async () => {
    mockDevelopmentService.getDevelopment.mockReturnValue(new Subject());
    await renderComponent();

    expect(
      document.querySelector("mxevolve-autocomplete-reviewers")
    ).toBeNull();
  });

  it("renders delete-branch checkbox with correct inputs when supportsResourceManagement is true", async () => {
    const { fixture } = await renderComponent({
      supportsResourceManagement: true,
    });

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-delete-development-checkbox")
      ).toBeTruthy();
      const checkbox = ngMocks.find(
        fixture,
        DeleteDevelopmentCheckboxComponent
      );
      expect(checkbox.componentInstance.projectId).toBe("proj-1");
      expect(checkbox.componentInstance.processId).toBe("proc-1");
      expect(checkbox.componentInstance.familyId).toBe(
        ExecutionFamily.UPGRADE_PROCESS
      );
      expect(checkbox.componentInstance.actionLabel).toBe(
        "after changes are merged"
      );
    });
  });

  it("hides delete-branch checkbox when supportsResourceManagement is false", async () => {
    await renderComponent({ supportsResourceManagement: false });

    expect(
      document.querySelector("mxevolve-delete-development-checkbox")
    ).toBeNull();
  });

  it("shows commits-behind warning when there are commits behind", async () => {
    mockCommitsService.getCommitDifferences.mockReturnValue(
      of([{ id: "c1" }, { id: "c2" }])
    );
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-merge-configuration-dropdown")
      ).toBeTruthy();
    });

    const dropdown = ngMocks.find(fixture, MergeConfigurationDropdownComponent);
    ngMocks.change(dropdown, MOCK_MERGE_CONFIGURATION);

    await waitFor(() => {
      expect(screen.getByText(/2/)).toBeTruthy();
      expect(screen.getByText(/commits behind/)).toBeTruthy();
      expect(screen.getByText(/main/)).toBeTruthy();
    });
  });

  it("hides commits-behind warning when there are no commits behind", async () => {
    await renderComponent();

    expect(screen.queryByText(/commits behind/)).toBeNull();
  });

  it("updates form control value when user fills in the form", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(
      screen.getByRole("textbox", { name: /Merge Request Title/ }),
      "My MR Title"
    );

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({ mergeRequestTitle: "My MR Title" })
      );
    });
  });

  it("resets reviewers when destination branch is cleared", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-merge-configuration-dropdown")
      ).toBeTruthy();
    });

    const dropdown = ngMocks.find(fixture, MergeConfigurationDropdownComponent);
    ngMocks.change(dropdown, MOCK_MERGE_CONFIGURATION);

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({
          destinationBranch: MOCK_MERGE_CONFIGURATION,
        })
      );
    });

    ngMocks.change(dropdown, null);

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({ reviewers: [] })
      );
    });
  });

  it("updates form control reviewers when reviewers autocomplete changes", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-autocomplete-reviewers")
      ).toBeTruthy();
    });

    const autocomplete = ngMocks.find(fixture, ReviewersAutoCompleteComponent);
    autocomplete.componentInstance.reviewersFormControl.setValue(
      MOCK_REVIEWERS
    );

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({ reviewers: MOCK_REVIEWERS })
      );
    });
  });

  it("pre-populates the form when the control has an initial value", async () => {
    const { fixture } = await renderComponent();

    fixture.componentInstance.control.setValue({
      mergeRequestTitle: "Pre-filled Title",
      destinationBranch: MOCK_MERGE_CONFIGURATION,
      reviewers: [],
      deleteBranch: null,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: /Merge Request Title/ })
      ).toHaveValue("Pre-filled Title");
    });
  });

  it("is invalid when MR title and destination branch are both empty", async () => {
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.control.valid).toBe(false);
  });

  it("is invalid when only MR title is provided", async () => {
    mockMergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
      of({
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 1,
        number: 0,
        last: true,
      })
    );
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(
      screen.getByRole("textbox", { name: /Merge Request Title/ }),
      "My MR Title"
    );

    expect(fixture.componentInstance.control.valid).toBe(false);
  });

  it("is invalid when only destination branch is selected", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-merge-configuration-dropdown")
      ).toBeTruthy();
    });

    const dropdown = ngMocks.find(fixture, MergeConfigurationDropdownComponent);
    ngMocks.change(dropdown, MOCK_MERGE_CONFIGURATION);

    expect(fixture.componentInstance.control.valid).toBe(false);
  });

  it("is valid when both MR title and destination branch are provided", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(
      screen.getByRole("textbox", { name: /Merge Request Title/ }),
      "My MR Title"
    );

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-merge-configuration-dropdown")
      ).toBeTruthy();
    });

    const dropdown = ngMocks.find(fixture, MergeConfigurationDropdownComponent);
    ngMocks.change(dropdown, MOCK_MERGE_CONFIGURATION);

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(true);
    });
  });

  it("auto-selects destination branch when parent branch name matches a merge configuration", async () => {
    const { fixture } = await renderComponent({ parentBranchName: "main" });

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({ destinationBranch: MOCK_MERGE_CONFIGURATION })
      );
    });
  });

  it("does not auto-select destination branch when no merge configuration matches parent branch name", async () => {
    mockMergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
      of({
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 1,
        number: 0,
        last: true,
      })
    );
    const { fixture } = await renderComponent({
      parentBranchName: "non-existent-branch",
    });

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-merge-configuration-dropdown")
      ).toBeTruthy();
    });

    expect(fixture.componentInstance.control.value).toEqual(
      expect.objectContaining({ destinationBranch: null })
    );
  });
});
