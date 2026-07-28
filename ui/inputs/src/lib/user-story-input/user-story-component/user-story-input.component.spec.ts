import { FormControl } from "@angular/forms";
import { UserStoryInputComponent } from "./user-story-input.component";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { ConfirmationService } from "primeng/api";
import { AddUserStoryModalComponent } from "../add-user-story-modal/add-user-story-modal.component";
import { TableModule } from "primeng/table";
import { ConfirmPopup } from "primeng/confirmpopup";
import { Button } from "primeng/button";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";

describe("UserStoryInputComponent", () => {
  let component: UserStoryInputComponent;
  let fixture: MockedComponentFixture<
    UserStoryInputComponent,
    { formControl: FormControl; requiredInput: boolean }
  >;
  let mockConfirmationService: jest.Mocked<ConfirmationService>;

  beforeEach(async () => {
    mockConfirmationService = {
      confirm: jest.fn(),
    } as unknown as jest.Mocked<ConfirmationService>;

    await MockBuilder(UserStoryInputComponent)
      .mock(AddUserStoryModalComponent)
      .mock(TableModule)
      .mock(ConfirmPopup)
      .mock(Button)
      .mock(TableEmptyMessageComponent)
      .provide({
        provide: ConfirmationService,
        useValue: mockConfirmationService,
      });
  });

  it("Given no user stories exist, When the component loads, Then no user stories are displayed", () => {
    const formControl = new FormControl(null);
    fixture = MockRender(UserStoryInputComponent, {
      formControl,
      requiredInput: false,
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();

    expect(component.userStoryIds).toEqual([]);
  });

  it("Given three user stories exist, When the component loads, Then all three user stories are displayed", () => {
    const existingUserStoryIds: string[] = ["US-100", "US-101", "US-102"];
    const formControl = new FormControl([...existingUserStoryIds]);
    fixture = MockRender(UserStoryInputComponent, {
      formControl,
      requiredInput: true,
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();

    expect(component.userStoryIds).toEqual(existingUserStoryIds);
    expect(component.userStoryIds.length).toBe(3);
  });

  it("Given no user stories exist, When a user story is added, Then the user story becomes visible", () => {
    const formControl = new FormControl(null);
    fixture = MockRender(UserStoryInputComponent, {
      formControl,
      requiredInput: false,
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();

    const newUserStory: string = "US-123";
    component.addUserStory(newUserStory);

    expect(component.userStoryIds).toContain(newUserStory);
    expect(component.userStoryIds.length).toBe(1);
    expect(component.formControl.value).toEqual([newUserStory]);
  });

  it("Given three user stories exist, When user attempts to delete a user story, Then a confirmation prompt is displayed", () => {
    const userStoryIds: string[] = ["US-100", "US-101", "US-102"];
    const formControl = new FormControl([...userStoryIds]);
    fixture = MockRender(UserStoryInputComponent, {
      formControl,
      requiredInput: true,
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();

    const mockEvent = {
      target: document.createElement("button"),
    } as unknown as Event;
    const userStoryToDelete = userStoryIds[0];
    component.confirmDelete(mockEvent, userStoryToDelete);

    expect(mockConfirmationService.confirm).toHaveBeenCalled();
    const confirmOptions = mockConfirmationService.confirm.mock.calls[0][0];
    expect(confirmOptions.message).toBe("Sure to remove?");
    expect(confirmOptions.acceptLabel).toBe("Ok");
    expect(confirmOptions.rejectLabel).toBe("Cancel");
  });

  it("Given three user stories exist, When user attempts to delete a user story and confirms, Then the user story disappears", () => {
    const currentUserStoryIds: string[] = ["US-100", "US-101", "US-102"];
    const formControl = new FormControl([...currentUserStoryIds]);
    fixture = MockRender(UserStoryInputComponent, {
      formControl,
      requiredInput: true,
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();

    const mockEvent = {
      target: document.createElement("button"),
    } as unknown as Event;
    const userStoryToDelete = currentUserStoryIds[0];
    component.confirmDelete(mockEvent, userStoryToDelete);

    const confirmOptions = mockConfirmationService.confirm.mock.calls[0][0];
    confirmOptions.accept?.();

    expect(component.userStoryIds).not.toContain(userStoryToDelete);
    expect(component.userStoryIds.length).toBe(2);
  });

  it("Given three user stories exist, When user attempts to delete a user story and cancels, Then the user story remains", () => {
    const existingUserStoryIds: string[] = ["US-100", "US-101", "US-102"];
    const formControl = new FormControl([...existingUserStoryIds]);
    fixture = MockRender(UserStoryInputComponent, {
      formControl,
      requiredInput: true,
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();

    const mockEvent = {
      target: document.createElement("button"),
    } as unknown as Event;
    const userStoryToDelete = existingUserStoryIds[0];
    const initialCount = component.userStoryIds.length;
    component.confirmDelete(mockEvent, userStoryToDelete);

    const confirmOptions = mockConfirmationService.confirm.mock.calls[0][0];
    confirmOptions.reject?.();

    expect(component.userStoryIds).toContain(userStoryToDelete);
    expect(component.userStoryIds.length).toBe(initialCount);
  });
});
