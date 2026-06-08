import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule, FormGroup, FormControl } from "@angular/forms";
import { DatabaseServerESDDropdownComponent } from "./database-server-esd-dropdown.component";
import { DatabaseServerESDDropdownStateService } from "./state-service/database-server-esd-dropdown-state.service";
import { signal } from "@angular/core";
import { DatabaseServerType } from "../model/database-server-type";

describe("DatabaseServerESDDropdownComponent", () => {
  let component: DatabaseServerESDDropdownComponent;
  let fixture: ComponentFixture<DatabaseServerESDDropdownComponent>;
  let mockStateService: any;

  beforeEach(async () => {
    mockStateService = {
      databaseServerESDOptions: signal(["1.0.1", "1.0.2"]),
      setProjectIdSubject: jest.fn(),
      setServerTypeSubject: jest.fn(),
      setDatabaseServerVersion: jest.fn(),
      errorMessageSignal: signal(""),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, DatabaseServerESDDropdownComponent],
    })
      .overrideComponent(DatabaseServerESDDropdownComponent, {
        set: {
          providers: [
            {
              provide: DatabaseServerESDDropdownStateService,
              useValue: mockStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DatabaseServerESDDropdownComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({
      engineSpecificDetail: new FormControl<string>("", { nonNullable: true }),
    });
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  describe("Input Handling", () => {
    it("should set project ID, server type, and database server version", () => {
      const projectId = "projectId";
      const serverType = DatabaseServerType.SYBASE;
      const databaseServerVersion = "1.0";

      component.projectId = projectId;
      component.serverType = serverType;
      component.databaseServerVersion = databaseServerVersion;

      expect(mockStateService.setProjectIdSubject).toHaveBeenCalledWith(
        projectId
      );
      expect(mockStateService.setServerTypeSubject).toHaveBeenCalledWith(
        serverType
      );
      expect(mockStateService.setDatabaseServerVersion).toHaveBeenCalledWith(
        databaseServerVersion
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
    expect(component.databaseServerESDs).toBeDefined();
  });
});
