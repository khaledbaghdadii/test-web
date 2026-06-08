import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { FormsModule } from "@angular/forms";
import { Checkbox } from "primeng/checkbox";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { DevelopmentService } from "@mxevolve/domains/scm/data-access";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import {
  ExecutionResourcesService,
  ExecutionResourceType,
} from "@mxevolve/domains/business-process/data-access";
import { DeleteDevelopmentCheckboxComponent } from "./delete-development-checkbox.component";

const MOCK_IMPORTS = [Checkbox, FormsModule, MxevolveIconComponent];

const mockDevelopmentService = {
  getDevelopment: jest.fn(),
};

const mockResourcesService = {
  getExecutionResources: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  processId: "process-456",
  actionLabel: "when process is aborted",
  familyId: ExecutionFamily.UPGRADE_PROCESS,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(DeleteDevelopmentCheckboxComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: DevelopmentService, useValue: mockDevelopmentService },
      { provide: ExecutionResourcesService, useValue: mockResourcesService },
    ],
  });
}

describe("DeleteDevelopmentCheckboxComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResourcesService.getExecutionResources.mockReturnValue(
      of([
        {
          resourceId: "dev-1",
          projectId: "project-123",
          resourceType: ExecutionResourceType.DEVELOPMENT,
          usageTags: [],
        },
      ])
    );
    mockDevelopmentService.getDevelopment.mockReturnValue(
      of({ name: "feature/my-branch" })
    );
  });

  it("shows the resolved branch name", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByText("feature/my-branch")).toBeTruthy()
    );
  });

  it("shows the action label", async () => {
    await renderComponent({ actionLabel: "after changes are merged" });

    await waitFor(() =>
      expect(screen.getByText(/after changes are merged/)).toBeTruthy()
    );
  });

  it("shows the checkbox unchecked by default for non-USER_STORY_BUILD_AND_TEST processes", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByLabelText(/Delete branch/)).not.toBeChecked()
    );
  });

  it("shows the checkbox pre-checked by default for USER_STORY_BUILD_AND_TEST processes", async () => {
    await renderComponent({
      familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
    });

    await waitFor(() =>
      expect(screen.getByLabelText(/Delete branch/)).toBeChecked()
    );
  });

  it("emits the default form control value when registered for non-USER_STORY_BUILD_AND_TEST processes", async () => {
    const { fixture } = await renderComponent();
    const onChange = jest.fn();

    fixture.componentInstance.registerOnChange(onChange);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ shouldDelete: false })
    );
  });

  it("emits the default form control value when registered for USER_STORY_BUILD_AND_TEST processes", async () => {
    const { fixture } = await renderComponent({
      familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
    });
    const onChange = jest.fn();

    fixture.componentInstance.registerOnChange(onChange);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ shouldDelete: true })
    );
  });

  it("shows the checkbox checked when the value is set to true", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(screen.getByLabelText(/Delete branch/)).toBeTruthy()
    );

    fixture.componentInstance.writeValue({
      shouldDelete: true,
      developmentId: "dev-1",
    });

    await waitFor(() =>
      expect(screen.getByLabelText(/Delete branch/)).toBeChecked()
    );
  });

  it("toggles the checkbox when clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByLabelText(/Delete branch/)).not.toBeChecked()
    );

    await user.click(screen.getByLabelText(/Delete branch/));

    await waitFor(() =>
      expect(screen.getByLabelText(/Delete branch/)).toBeChecked()
    );
  });

  it("shows the note about shared branches", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(
        screen.getByText(
          /If the branch is used by another process, it will not be deleted/
        )
      ).toBeTruthy()
    );
  });

  it("shows the checkbox without branch name when branch resolution fails", async () => {
    mockDevelopmentService.getDevelopment.mockReturnValue(
      throwError(() => new Error("branch not found"))
    );
    await renderComponent();

    await waitFor(() =>
      expect(
        screen.getByText(/Delete branch when process is aborted/)
      ).toBeTruthy()
    );
  });
});
