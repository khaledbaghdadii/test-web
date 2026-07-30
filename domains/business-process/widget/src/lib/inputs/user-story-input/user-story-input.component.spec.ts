import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";
import { ValidateUserStoryService } from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { UserStoryInputComponent } from "./user-story-input.component";

const HOST_TEMPLATE = `
  <mxevolve-user-story-input
    [projectId]="projectId"
    [shouldValidate]="shouldValidate"
    [formControl]="control"
  ></mxevolve-user-story-input>
`;

const mockValidator = { validateUserStory: jest.fn() };
const mockToast = { showError: jest.fn() };
const mockFeatureFlagResolver = { isFeatureEnabled: jest.fn() };

interface HostOptions {
  shouldValidate?: boolean;
  validationEnabled?: boolean;
}

async function renderComponent(options: HostOptions = {}) {
  const control = new FormControl<string[] | null>(null);
  mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(
    options.validationEnabled ?? false
  );

  const view = await render(HOST_TEMPLATE, {
    imports: [UserStoryInputComponent, ReactiveFormsModule],
    componentProperties: {
      projectId: "project-1",
      shouldValidate: options.shouldValidate ?? false,
      control,
    },
    providers: [
      { provide: ValidateUserStoryService, useValue: mockValidator },
      { provide: ToastMessageService, useValue: mockToast },
      { provide: FeatureFlagResolver, useValue: mockFeatureFlagResolver },
    ],
  });

  return { ...view, control };
}

function addButton(): HTMLElement {
  return screen.getByRole("button", {
    name: "Add user story",
  });
}

describe("UserStoryInputComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders a single 'User Story ID' field by default", async () => {
    await renderComponent();

    expect(screen.getByLabelText("User Story ID")).toBeTruthy();
    expect(screen.queryByLabelText("User Story ID 2")).toBeNull();
  });

  it("writes a typed valid id to the form control", async () => {
    const user = userEvent.setup();
    const { control } = await renderComponent();

    await user.type(screen.getByLabelText("User Story ID"), "US-1");

    await waitFor(() => expect(control.value).toEqual(["US-1"]));
  });

  it("does not show a validity check when validation is disabled", async () => {
    const user = userEvent.setup();
    const { container, control } = await renderComponent();

    await user.type(screen.getByLabelText("User Story ID"), "US-1");

    await waitFor(() => expect(control.value).toEqual(["US-1"]));
    expect(container.querySelector(".pi-check")).toBeNull();
  });

  it("disables the add button until the field holds a valid id", async () => {
    const user = userEvent.setup();
    await renderComponent();

    expect(addButton()).toBeDisabled();

    await user.type(screen.getByLabelText("User Story ID"), "US-1");

    await waitFor(() => expect(addButton()).toBeEnabled());
  });

  it("adds a second inline field when the add button is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.type(screen.getByLabelText("User Story ID"), "US-1");
    await waitFor(() => expect(addButton()).toBeEnabled());
    await user.click(addButton());

    expect(await screen.findByLabelText("User Story ID 2")).toBeTruthy();
  });

  it("removes a field when its remove control is clicked", async () => {
    const user = userEvent.setup();
    const { control } = await renderComponent();

    await user.type(screen.getByLabelText("User Story ID"), "US-1");
    await waitFor(() => expect(addButton()).toBeEnabled());
    await user.click(addButton());
    await screen.findByLabelText("User Story ID 2");

    const removeButtons = screen.getAllByRole("button", {
      name: "Remove user story",
    });
    await user.click(removeButtons[removeButtons.length - 1]);

    await waitFor(() =>
      expect(screen.queryByLabelText("User Story ID 2")).toBeNull()
    );
    expect(control.value).toEqual(["US-1"]);
  });

  it("shows a duplicate error and excludes the duplicate id", async () => {
    const user = userEvent.setup();
    const { control } = await renderComponent();

    await user.type(screen.getByLabelText("User Story ID"), "US-1");
    await waitFor(() => expect(addButton()).toBeEnabled());
    await user.click(addButton());

    await user.type(screen.getByLabelText("User Story ID 2"), "US-1");

    expect(await screen.findByText("ID already exists")).toBeTruthy();
    await waitFor(() => expect(control.value).toEqual(["US-1"]));
  });

  it("validates the id live before accepting it when validation is enabled", async () => {
    mockValidator.validateUserStory.mockReturnValue(
      of({ valid: true, errorMessage: "" })
    );
    const user = userEvent.setup();
    const { control } = await renderComponent({
      shouldValidate: true,
      validationEnabled: true,
    });
    await waitFor(() =>
      expect(mockFeatureFlagResolver.isFeatureEnabled).toHaveBeenCalled()
    );

    await user.type(screen.getByLabelText("User Story ID"), "US-9");

    await waitFor(() => expect(control.value).toEqual(["US-9"]));
    expect(mockValidator.validateUserStory).toHaveBeenCalledWith("project-1", {
      userStoryId: "US-9",
    });
  });

  it("shows the validation error message and excludes an invalid id", async () => {
    mockValidator.validateUserStory.mockReturnValue(
      of({ valid: false, errorMessage: "Story not found" })
    );
    const user = userEvent.setup();
    const { control } = await renderComponent({
      shouldValidate: true,
      validationEnabled: true,
    });
    await waitFor(() =>
      expect(mockFeatureFlagResolver.isFeatureEnabled).toHaveBeenCalled()
    );

    await user.type(screen.getByLabelText("User Story ID"), "US-bad");

    expect(await screen.findByText("Story not found")).toBeTruthy();
    expect(control.value).toBeNull();
  });

  it("shows an error toast when validation fails unexpectedly", async () => {
    mockValidator.validateUserStory.mockReturnValue(
      throwError(() => new Error("boom"))
    );
    const user = userEvent.setup();
    await renderComponent({ shouldValidate: true, validationEnabled: true });
    await waitFor(() =>
      expect(mockFeatureFlagResolver.isFeatureEnabled).toHaveBeenCalled()
    );

    await user.type(screen.getByLabelText("User Story ID"), "US-x");

    await waitFor(() =>
      expect(mockToast.showError).toHaveBeenCalledWith(
        "Something went wrong. Please try again later."
      )
    );
  });

  it("seeds fields from an existing form-control value", async () => {
    const control = new FormControl<string[] | null>(["US-1", "US-2"]);
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);

    await render(HOST_TEMPLATE, {
      imports: [UserStoryInputComponent, ReactiveFormsModule],
      componentProperties: {
        projectId: "project-1",
        shouldValidate: false,
        control,
      },
      providers: [
        { provide: ValidateUserStoryService, useValue: mockValidator },
        { provide: ToastMessageService, useValue: mockToast },
        { provide: FeatureFlagResolver, useValue: mockFeatureFlagResolver },
      ],
    });

    expect(screen.getByLabelText("User Story ID")).toHaveValue("US-1");
    expect(screen.getByLabelText("User Story ID 2")).toHaveValue("US-2");
  });

  describe("seeded ids with validation enabled", () => {
    async function renderSeeded(seed: string[]) {
      const control = new FormControl<string[] | null>(seed);
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);

      const view = await render(HOST_TEMPLATE, {
        imports: [UserStoryInputComponent, ReactiveFormsModule],
        componentProperties: {
          projectId: "project-1",
          shouldValidate: true,
          control,
        },
        providers: [
          { provide: ValidateUserStoryService, useValue: mockValidator },
          { provide: ToastMessageService, useValue: mockToast },
          { provide: FeatureFlagResolver, useValue: mockFeatureFlagResolver },
        ],
      });

      return { ...view, control };
    }

    it("checks a seeded id against the backend instead of assuming it is valid", async () => {
      mockValidator.validateUserStory.mockReturnValue(
        of({ valid: true, errorMessage: "" })
      );

      const { container } = await renderSeeded(["US-1"]);

      await waitFor(() =>
        expect(mockValidator.validateUserStory).toHaveBeenCalledWith(
          "project-1",
          { userStoryId: "US-1" }
        )
      );
      await waitFor(() =>
        expect(container.querySelector(".pi-check")).toBeTruthy()
      );
    });

    it("reports a seeded id the backend rejects and drops it from the value", async () => {
      mockValidator.validateUserStory.mockReturnValue(
        of({ valid: false, errorMessage: "Story not found" })
      );

      const { control } = await renderSeeded(["US-gone"]);

      expect(await screen.findByText("Story not found")).toBeTruthy();
      expect(control.value).toBeNull();
    });

    it("rejects the id when the validation request itself fails", async () => {
      mockValidator.validateUserStory.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      const { container, control } = await renderSeeded(["US-1"]);

      await waitFor(() =>
        expect(mockToast.showError).toHaveBeenCalledWith(
          "Something went wrong. Please try again later."
        )
      );
      expect(control.value).toBeNull();
      expect(container.querySelector(".pi-check")).toBeNull();
    });
  });
});
