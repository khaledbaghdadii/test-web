import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { of, throwError } from "rxjs";
import { BranchInputComponent } from "./branch-input.component";
import {
  BranchService,
  BranchDetailsError,
} from "@mxevolve/domains/scm/data-access";

const branchServiceMock = {
  getBranchDetails: jest.fn(),
};

interface SetupOptions {
  branchShouldExist?: boolean;
  initialValue?: string;
}

async function setup(options: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [BranchInputComponent],
  })
    .overrideComponent(BranchInputComponent, {
      set: {
        providers: [{ provide: BranchService, useValue: branchServiceMock }],
      },
    })
    .compileComponents();

  const fixture: ComponentFixture<BranchInputComponent> =
    TestBed.createComponent(BranchInputComponent);
  const control = new FormControl("");
  const initialInvalid = jest.fn();

  fixture.componentRef.setInput(
    "branchShouldExist",
    options.branchShouldExist ?? true
  );
  fixture.componentRef.setInput("projectId", "project-1");
  fixture.componentRef.setInput("repositoryId", "repo-1");
  fixture.componentRef.setInput("branchNameFormControl", control);
  fixture.componentRef.setInput("initialValue", options.initialValue ?? "");
  fixture.componentInstance.initialInvalid.subscribe(() => initialInvalid());

  fixture.detectChanges();
  return { fixture, control, initialInvalid };
}

function text(fixture: ComponentFixture<BranchInputComponent>): string {
  return fixture.nativeElement.textContent ?? "";
}

describe("BranchInputComponent", () => {
  beforeEach(() => {
    branchServiceMock.getBranchDetails.mockReset();
  });

  it("shows 'Branch does not exist.' when a required-existing branch is missing", fakeAsync(async () => {
    branchServiceMock.getBranchDetails.mockReturnValue(
      throwError(() => new BranchDetailsError("not found", 404))
    );

    const { fixture, control } = await setup({ branchShouldExist: true });

    control.setValue("feature/x");
    tick(500);
    fixture.detectChanges();

    expect(text(fixture)).toContain("Branch does not exist.");
  }));

  it("shows 'Branch already exists.' when a to-be-created branch already exists", fakeAsync(async () => {
    branchServiceMock.getBranchDetails.mockReturnValue(
      of({ latestCommitId: "abc" })
    );

    const { fixture, control } = await setup({ branchShouldExist: false });

    control.setValue("newbranch");
    tick(500);
    fixture.detectChanges();

    expect(text(fixture)).toContain("Branch already exists.");
  }));

  it("stays valid when a required-existing branch is found", fakeAsync(async () => {
    branchServiceMock.getBranchDetails.mockReturnValue(
      of({ latestCommitId: "abc" })
    );

    const { fixture, control } = await setup({ branchShouldExist: true });

    control.setValue("main");
    tick(500);
    fixture.detectChanges();

    expect(text(fixture)).not.toContain("Branch does not exist.");
    expect(control.valid).toBe(true);
  }));

  it("emits initialInvalid once when a prefilled branch is invalid on load", fakeAsync(async () => {
    branchServiceMock.getBranchDetails.mockReturnValue(
      throwError(() => new BranchDetailsError("not found", 404))
    );

    const { initialInvalid } = await setup({
      branchShouldExist: true,
      initialValue: "prefilled",
    });

    tick(500);

    expect(initialInvalid).toHaveBeenCalledTimes(1);
  }));
});
