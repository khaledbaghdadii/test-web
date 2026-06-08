import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { BranchInputComponent } from "./branch-input.component";
import { ScmService } from "../scm.service";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";

const mockScmService = {
  getBranchDetails: jest.fn(),
};

describe("BranchInputComponent", () => {
  let component: BranchInputComponent;
  let fixture: ComponentFixture<BranchInputComponent>;
  let branchNameFormControl: FormControl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BranchInputComponent, ReactiveFormsModule],
      providers: [{ provide: ScmService, useValue: mockScmService }],
    });
    branchNameFormControl = new FormControl("");
    fixture = TestBed.createComponent(BranchInputComponent);
    component = fixture.componentInstance;
    component.projectId = "proj";
    component.repoId = "repo";
    component.branchNameFormControl = branchNameFormControl;
    component.branchShouldExist = true;
    jest.clearAllMocks();
  });

  describe("ngOnInit", () => {
    it("should set sync validators on form control", () => {
      const setValidatorsSpy = jest.spyOn(
        branchNameFormControl,
        "setValidators"
      );

      component.ngOnInit();

      expect(setValidatorsSpy).toHaveBeenCalledWith([expect.any(Function)]);
    });

    it("should set initial value and mark as touched when initialValue is provided", () => {
      component.initialValue = "feature/test";

      component.ngOnInit();

      expect(branchNameFormControl.value).toBe("feature/test");
      expect(branchNameFormControl.touched).toBe(true);
    });

    it("should set up debounced async validation on valueChanges", () => {
      const valueChangesSpy = jest.spyOn(
        branchNameFormControl.valueChanges,
        "pipe"
      );

      component.ngOnInit();

      expect(valueChangesSpy).toHaveBeenCalled();
    });
  });

  describe("when branchShouldExist is true", () => {
    beforeEach(() => {
      component.branchShouldExist = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it("should return null for any input (skip format validation)", () => {
      branchNameFormControl.setValue("invalid branch name with spaces");

      expect(branchNameFormControl.errors).toBeNull();
    });
  });

  describe("when branchShouldExist is false", () => {
    beforeEach(() => {
      component.branchShouldExist = false;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it("should return null for empty input", () => {
      branchNameFormControl.setValue("");
      expect(branchNameFormControl.errors).toBeNull();
    });

    it.each([
      [" ", "Branch name cannot be blank or whitespace."],
      ["   ", "Branch name cannot be blank or whitespace."],
      ["\t", "Branch name cannot be blank or whitespace."],
      ["feature new-ui", "Spaces are not allowed."],
      ["feature/new~ui", "Special characters are not allowed."],
      ["feature/new^ui", "Special characters are not allowed."],
      ["feature/new:ui", "Special characters are not allowed."],
      ["feature/new?ui", "Special characters are not allowed."],
      ["feature/new*ui", "Special characters are not allowed."],
      ["feature/new[ui", "Special characters are not allowed."],
      ["feature/new\\ui", "Special characters are not allowed."],
      ["feature/new@ui", "Special characters are not allowed."],
      ["feature/new{ui", "Special characters are not allowed."],
      ["feature/..ui", "Special characters are not allowed."],
      ["feature/ui//", "Special characters are not allowed."],
      ["feature//sub", "Special characters are not allowed."],
      ["feature/", "Cannot start or end with a slash."],
      ["/feature", "Cannot start or end with a slash."],
      [".feature", "Cannot start or end with a dot."],
      ["feature.", "Cannot start or end with a dot."],
      ["feature/file.lock", "Cannot end with '.lock'."],
      ["feature/.hidden/file", "Cannot contain a segment starting with a dot."],
    ])(
      "should return error for invalid branch name '%s'",
      (branchName, expectedError) => {
        branchNameFormControl.setValue(branchName);

        expect(branchNameFormControl.errors?.["branchNameFormat"]).toBe(
          expectedError
        );
      }
    );

    it("should return null for valid branch names", () => {
      const validNames = [
        "feature/new-ui",
        "bugfix/issue-123",
        "hotfix/urgent-fix",
        "main",
        "develop",
        "feature-branch",
      ];

      validNames.forEach((name) => {
        branchNameFormControl.setValue(name);
        expect(branchNameFormControl.errors).toBeNull();
      });
    });
  });

  describe("debounced async validation", () => {
    it("should validate branch existence after debounce time", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(of({}));

      component.ngOnInit();

      branchNameFormControl.setValue("feature/test");

      tick(50);
      expect(mockScmService.getBranchDetails).not.toHaveBeenCalled();

      tick(500);
      expect(mockScmService.getBranchDetails).toHaveBeenCalledTimes(1);
      expect(mockScmService.getBranchDetails).toHaveBeenCalledWith({
        projectId: "proj",
        repoId: "repo",
        branchName: "feature/test",
      });
    }));

    it("should not make API call if sync validation fails", fakeAsync(() => {
      component.branchShouldExist = false;
      component.ngOnInit();

      branchNameFormControl.setValue("invalid branch");
      tick(600);

      expect(mockScmService.getBranchDetails).not.toHaveBeenCalled();
    }));

    it("should not make API call for empty values", fakeAsync(() => {
      component.ngOnInit();
      branchNameFormControl.setValue("");
      tick(600);

      expect(mockScmService.getBranchDetails).not.toHaveBeenCalled();

      branchNameFormControl.setValue("   ");
      tick(600);

      expect(mockScmService.getBranchDetails).not.toHaveBeenCalled();
    }));

    it("should cancel previous API calls when value changes quickly", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(of({}));

      component.ngOnInit();

      branchNameFormControl.setValue("branch1");
      tick(20);
      branchNameFormControl.setValue("branch2");
      tick(20);
      branchNameFormControl.setValue("branch3");
      tick(600);

      expect(mockScmService.getBranchDetails).toHaveBeenCalledTimes(1);
      expect(mockScmService.getBranchDetails).toHaveBeenCalledWith({
        projectId: "proj",
        repoId: "repo",
        branchName: "branch3",
      });
    }));

    it("should mark form control as pending when value is not null", fakeAsync(() => {
      component.branchShouldExist = true;
      component.ngOnInit();

      branchNameFormControl.setValue("some-branch");

      expect(branchNameFormControl.pending).toBe(true);
    }));

    it("should not mark form control as pending when value is null", fakeAsync(() => {
      branchNameFormControl.setValue(null);

      expect(branchNameFormControl.pending).toBe(false);
    }));
  });

  describe("Set errors when branchShouldExist is true", () => {
    beforeEach(() => {
      component.branchShouldExist = true;
    });

    it("should set no error when branch exists (200 response)", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(of({}));

      component.ngOnInit();

      branchNameFormControl.setValue("existing-branch");
      tick(600);

      expect(branchNameFormControl.errors).toBeNull();
    }));

    it("should set error when branch does not exist (404 response)", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 404 }))
      );

      component.ngOnInit();

      branchNameFormControl.setValue("non-existing-branch");
      tick(600);

      expect(branchNameFormControl.errors?.["branchInvalid"]).toBe(
        "Branch does not exist."
      );
    }));
  });

  describe("Set errors when branchShouldExist is false", () => {
    beforeEach(() => {
      component.branchShouldExist = false;
    });

    it("should set error when branch exists (200 response)", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(of({}));

      component.ngOnInit();

      branchNameFormControl.setValue("existing-branch");

      tick(600);

      expect(branchNameFormControl.errors?.["branchInvalid"]).toBe(
        "Branch already exists."
      );
    }));

    it("should set no error when branch does not exist (404 response)", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 404 }))
      );

      component.ngOnInit();

      branchNameFormControl.setValue("new-branch");
      tick(600);

      expect(branchNameFormControl.errors).toBeNull();
    }));
  });

  describe("async failed results", () => {
    it("should set API error for non-404 HTTP errors", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 500, message: "Internal Server Error" }))
      );

      component.ngOnInit();

      branchNameFormControl.setValue("some-branch");
      tick(600);

      expect(branchNameFormControl.errors?.["branchApiError"]).toBe(
        "Unable to validate branch: Internal Server Error"
      );
    }));

    it("should set generic API error when error has no message", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 500 }))
      );

      component.ngOnInit();

      branchNameFormControl.setValue("some-branch");
      tick(600);

      expect(branchNameFormControl.errors?.["branchApiError"]).toBe(
        "Unable to validate branch: Unknown error"
      );
    }));
  });

  describe("error merging", () => {
    beforeEach(() => {
      component.branchShouldExist = false;
    });

    it("should preserve sync errors and add async errors", fakeAsync(() => {
      component.ngOnInit();

      branchNameFormControl.setValue("invalid branch");

      expect(branchNameFormControl.errors?.["branchNameFormat"]).toBe(
        "Spaces are not allowed."
      );

      tick(600);

      expect(branchNameFormControl.errors?.["branchNameFormat"]).toBe(
        "Spaces are not allowed."
      );
      expect(branchNameFormControl.errors?.["branchInvalid"]).toBeUndefined();
      expect(mockScmService.getBranchDetails).not.toHaveBeenCalled();
    }));

    it("should clear async errors when they become null", fakeAsync(() => {
      mockScmService.getBranchDetails.mockReturnValue(of({}));

      component.ngOnInit();

      branchNameFormControl.setValue("existing-branch");

      tick(600);

      expect(branchNameFormControl.errors?.["branchInvalid"]).toBe(
        "Branch already exists."
      );

      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 404 }))
      );
      component.ngOnInit();

      branchNameFormControl.setValue("new-branch");
      tick(600);

      expect(branchNameFormControl.errors).toBeNull();
    }));
  });

  describe("initial invalid emission", () => {
    it("should emit immediately when initialValue fails sync validation", fakeAsync(() => {
      component.branchShouldExist = false;
      component.initialValue = "invalid branch";
      const emitSpy = jest.spyOn(component.initialInvalid, "emit");

      component.ngOnInit();

      // Wait for the debounced async validation to complete
      tick(component.debounceTime);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(component.branchNameFormControl.hasError("branchNameFormat")).toBe(
        true
      );
      expect(branchNameFormControl.dirty).toBe(true);
    }));

    it("should emit after async validation when initialValue fails async (branch missing)", fakeAsync(() => {
      component.branchShouldExist = true;
      component.initialValue = "missing-branch";
      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 404 }))
      );
      const emitSpy = jest.spyOn(component.initialInvalid, "emit");

      component.ngOnInit();
      tick(600);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(component.branchNameFormControl.dirty).toBe(true);
    }));

    it("should not emit when initialValue is valid (exists)", fakeAsync(() => {
      component.branchShouldExist = true;
      component.initialValue = "existing-branch";
      mockScmService.getBranchDetails.mockReturnValue(of({}));
      const emitSpy = jest.spyOn(component.initialInvalid, "emit");

      component.ngOnInit();
      tick(600);

      expect(emitSpy).not.toHaveBeenCalled();
      expect(component.branchNameFormControl.dirty).toBe(false);
    }));

    it("should emit only once even if subsequent values are invalid", fakeAsync(() => {
      component.branchShouldExist = true;
      component.initialValue = "missing-branch-1";
      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 404 }))
      );
      const emitSpy = jest.spyOn(component.initialInvalid, "emit");

      component.ngOnInit();
      tick(600);

      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 404 }))
      );
      component.branchNameFormControl.setValue("missing-branch-2");
      tick(600);

      expect(emitSpy).toHaveBeenCalledTimes(1);
    }));

    it("should not emit when there is no initialValue (later invalid input does not count)", fakeAsync(() => {
      component.branchShouldExist = true;

      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 404 }))
      );
      const emitSpy = jest.spyOn(component.initialInvalid, "emit");

      component.ngOnInit();

      component.branchNameFormControl.setValue("missing-branch");
      tick(600);

      expect(emitSpy).not.toHaveBeenCalled();
    }));

    it("should not emit when user changes value from valid initialValue to a different invalid value", fakeAsync(() => {
      component.branchShouldExist = true;
      component.initialValue = "existing-branch";
      mockScmService.getBranchDetails.mockReturnValue(of({}));
      const emitSpy = jest.spyOn(component.initialInvalid, "emit");

      component.ngOnInit();
      tick(600);
      mockScmService.getBranchDetails.mockReturnValue(
        throwError(() => ({ status: 404 }))
      );
      component.branchNameFormControl.setValue("missing-branch");
      tick(600);
      expect(emitSpy).not.toHaveBeenCalled();
    }));
  });
});
