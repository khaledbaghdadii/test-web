import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MyExecutionsToggleComponent } from "./my-executions-toggle.component";
import { Table } from "primeng/table";
import { AuthenticationService } from "@mxflow/core/auth";

describe("MyExecutionsToggleComponent", () => {
  let component: MyExecutionsToggleComponent;
  let fixture: ComponentFixture<MyExecutionsToggleComponent>;
  let tableMock: Partial<Table>;
  const userName = "userName";
  const filterField = "ownerPhrase";

  beforeEach(() => {
    const authService = {
      getUsername: jest.fn(() => userName),
    };

    tableMock = {
      filter: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [MyExecutionsToggleComponent],
      providers: [{ provide: AuthenticationService, useValue: authService }],
    });

    fixture = TestBed.createComponent(MyExecutionsToggleComponent);
    component = fixture.componentInstance;
    component.table = tableMock as Table;
    component.field = filterField;
    fixture.detectChanges();
  });

  it("given that the user toggles My Executions on, then we should filter the table to show only the executions owned by the user", () => {
    component.showMyExecutionsOnly = true;

    component.onMyExecutionsToggle();

    expect(tableMock.filter).toHaveBeenCalledWith(
      userName,
      filterField,
      "contains"
    );
  });

  it("given that the user toggles My Executions off, then we should clear the owner filter", () => {
    component.showMyExecutionsOnly = false;

    component.onMyExecutionsToggle();

    expect(tableMock.filter).toHaveBeenCalledWith(
      null,
      filterField,
      "contains"
    );
  });
});
