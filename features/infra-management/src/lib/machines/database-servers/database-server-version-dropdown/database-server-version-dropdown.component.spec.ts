import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule, FormGroup, FormControl } from "@angular/forms";
import { DatabaseServerVersionDropdownComponent } from "./database-server-version-dropdown.component";
import { DatabaseServerVersionDropdownStateService } from "./state-service/database-server-version-dropdown-state.service";
import { signal } from "@angular/core";
import { DatabaseServerType } from "../model/database-server-type";

describe("DatabaseServerVersionDropdownComponent", () => {
  let component: DatabaseServerVersionDropdownComponent;
  let fixture: ComponentFixture<DatabaseServerVersionDropdownComponent>;
  let mockStateService: any;

  beforeEach(async () => {
    mockStateService = {
      databaseServerVersionOptions: signal([
        { version: "1.0.0", spVersions: ["1.0.1,1.0.2"] },
        { version: "2.0.0" },
      ]),
      setProjectIdSubject: jest.fn(),
      setServerTypeSubject: jest.fn(),
      errorMessageSignal: signal(""),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, DatabaseServerVersionDropdownComponent],
    })
      .overrideComponent(DatabaseServerVersionDropdownComponent, {
        set: {
          providers: [
            {
              provide: DatabaseServerVersionDropdownStateService,
              useValue: mockStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DatabaseServerVersionDropdownComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({
      serverVersion: new FormControl<string>("", { nonNullable: true }),
    });
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  describe("Input Handling", () => {
    it("should bind the form input", () => {
      expect(component.form).toBeDefined();
      expect(component.form.contains("serverVersion")).toBe(true);
    });

    it("should set project and merge request IDs on mergeRequest input change", () => {
      const projectId = "projectId";
      const serverType = DatabaseServerType.SYBASE;
      component.projectId = projectId;
      component.serverType = serverType;

      expect(mockStateService.setProjectIdSubject).toHaveBeenCalledWith(
        projectId
      );
      expect(mockStateService.setServerTypeSubject).toHaveBeenCalledWith(
        serverType
      );
    });
  });

  describe("Signal Subscriptions", () => {
    it("should emit errorEventEmitter when errorMessageSignal changes", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.errorEventEmitter, "emit");
      mockStateService.errorMessageSignal.set("Error occurred");
      fixture.detectChanges();
      expect(emitSpy).toHaveBeenCalledWith("Error occurred");
    }));
  });

  it("should render dropdown options", () => {
    const dropdown = fixture.nativeElement.querySelector("p-select");
    expect(dropdown).toBeTruthy();
    expect(component.databaseServerVersionOptions).toBeDefined();
  });
});
