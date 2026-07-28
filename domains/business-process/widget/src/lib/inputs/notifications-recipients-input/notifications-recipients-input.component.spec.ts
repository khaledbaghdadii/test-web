import { render, waitFor } from "@testing-library/angular";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Type } from "@angular/core";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { User } from "@mxevolve/domains/business-process/data-access";
import { UserService } from "@mxevolve/domains/user/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { NotificationsRecipientsInputComponent } from "./notifications-recipients-input.component";
import { ProjectUsersMultiselectComponent } from "../project-users-multiselect/project-users-multiselect.component";

function simulateCvaChange<T>(component: Type<unknown>, value: T): void {
  const instance = ngMocks.findInstance(component) as unknown as {
    __simulateChange?: (value: T) => void;
  };
  if (!instance.__simulateChange) {
    throw new Error("Mocked component is not a ControlValueAccessor");
  }
  instance.__simulateChange(value);
}

const mockFetcher = { fetchUsersByEmails: jest.fn() };
const mockToast = { showError: jest.fn() };

async function renderComponent(initialEmails: string[] | null) {
  const control = new FormControl<string[] | null>(initialEmails);
  const view = await render(NotificationsRecipientsInputComponent, {
    inputs: {
      projectId: "project-1",
      notificationsRecipientsFormControl: control,
    },
    componentImports: [
      MockComponent(ProjectUsersMultiselectComponent),
      ReactiveFormsModule,
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToast }],
    componentProviders: [{ provide: UserService, useValue: mockFetcher }],
  });
  return { ...view, control };
}

describe("NotificationsRecipientsInputComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetcher.fetchUsersByEmails.mockReturnValue(of({ content: [] }));
  });

  it("renders the project users multiselect", async () => {
    await renderComponent(null);

    expect(
      document.querySelector("mxevolve-project-users-multiselect")
    ).toBeTruthy();
  });

  it("resolves the prefilled emails into selectable users", async () => {
    await renderComponent(["alice@x.com", "bob@x.com"]);

    await waitFor(() =>
      expect(mockFetcher.fetchUsersByEmails).toHaveBeenCalledWith("project-1", [
        "alice@x.com",
        "bob@x.com",
      ])
    );
  });

  it("does not resolve users when there are no prefilled emails", async () => {
    await renderComponent(null);

    expect(mockFetcher.fetchUsersByEmails).not.toHaveBeenCalled();
  });

  it("writes the selected users' emails back to the form control", async () => {
    const { control } = await renderComponent(null);

    const selected: User[] = [
      { id: "1", displayName: "Alice", mail: "alice@x.com" },
      { id: "2", displayName: "Bob", mail: "bob@x.com" },
    ];
    simulateCvaChange(ProjectUsersMultiselectComponent, selected);

    expect(control.value).toEqual(["alice@x.com", "bob@x.com"]);
  });

  it("shows an error toast when the prefilled users fail to load", async () => {
    mockFetcher.fetchUsersByEmails.mockReturnValue(
      throwError(() => ({ message: "fetch failed" }))
    );

    await renderComponent(["alice@x.com"]);

    await waitFor(() =>
      expect(mockToast.showError).toHaveBeenCalledWith("fetch failed")
    );
  });
});
