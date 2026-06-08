import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BusinessProcessNotificationsRecipientsInputComponent } from "./business-process-notifications-recipients-input.component";
import { FormControl } from "@angular/forms";
import { of, throwError } from "rxjs";
import { ProjectUsersFetcherService } from "../../../../user-management/src/lib/project-users-fetcher-service/project-users-fetcher.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Component } from "@angular/core";

describe("BusinessProcessNotificationsRecipientsComponent", () => {
  let component: BusinessProcessNotificationsRecipientsInputComponent;
  let fixture: ComponentFixture<BusinessProcessNotificationsRecipientsInputComponent>;
  let userFetcherByMailService: Partial<ProjectUsersFetcherService>;
  let toastMessageService: Partial<ToastMessageService>;

  beforeEach(async () => {
    userFetcherByMailService = {
      fetchUsersByEmails: jest.fn(),
    };
    toastMessageService = {
      showError: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BusinessProcessNotificationsRecipientsInputComponent],
    })
      .overrideComponent(BusinessProcessNotificationsRecipientsInputComponent, {
        set: {
          imports: [MockProjectUsersMultiselectComponent],
          providers: [
            {
              provide: ProjectUsersFetcherService,
              useValue: userFetcherByMailService,
            },
            {
              provide: ToastMessageService,
              useValue: toastMessageService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(
      BusinessProcessNotificationsRecipientsInputComponent
    );
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should update the input form control when the user selects 2 interested parties", () => {
    component.formControl = new FormControl([]);
    component.ngOnInit();
    component.multiSelectFormControl.patchValue([
      { id: "userId1", mail: "mail1", displayName: "name1" },
      { id: "userId2", mail: "mail2", displayName: "name2" },
    ]);
    const expectedValue = ["mail1", "mail2"];
    const actualValue = component.formControl.value;
    expect(actualValue).toEqual(expectedValue);
  });

  it("should set the default value for the users multi select input", () => {
    jest.spyOn(userFetcherByMailService, "fetchUsersByEmails").mockReturnValue(
      of({
        content: [
          {
            id: "userId1",
            mail: "mail1",
            displayName: "name1",
          },
          {
            id: "userId2",
            mail: "mail2",
            displayName: "name2",
          },
        ],
      })
    );
    const projectId = "projectId1";
    component.projectId = projectId;
    component.formControl = new FormControl(["mail1", "mail2"]);
    component.ngOnInit();

    const expectedValue = [
      { id: "userId1", mail: "mail1", displayName: "name1" },
      { id: "userId2", mail: "mail2", displayName: "name2" },
    ];
    const actualValue = component.multiSelectFormControl.value;

    expect(userFetcherByMailService.fetchUsersByEmails).toHaveBeenCalledWith(
      projectId,
      ["mail1", "mail2"]
    );
    expect(actualValue).toEqual(expectedValue);
  });

  it("should show an error to the user when failing to fetch the users corresponding to the pre-selected emails", () => {
    jest
      .spyOn(userFetcherByMailService, "fetchUsersByEmails")
      .mockImplementation(() => throwError(() => new Error("errorMessage")));
    component.projectId = "projectId1";
    component.formControl = new FormControl(["mail1", "mail2"]);
    component.ngOnInit();
    fixture.detectChanges();
    expect(toastMessageService.showError).toHaveBeenCalledWith("errorMessage");
  });
});

@Component({
  selector: "mxevolve-project-users-multiselect",
  template: "<div></div>",
})
class MockProjectUsersMultiselectComponent {}
