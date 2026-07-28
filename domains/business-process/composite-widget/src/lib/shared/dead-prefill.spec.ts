import { FormControl, Validators } from "@angular/forms";
import { Observable, of, throwError } from "rxjs";
import { BranchDetailsError, BranchService, type BranchDetails } from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  BRANCH_CHECK_FAILED,
  DEAD_PREFILL_ERROR,
  PREFILL_LOOKUP_FAILED,
  checkPrefilledBranch,
  checkPrefilledEntities,
  deadPrefillValidator,
  prefilledIds,
} from "./dead-prefill";

function toastSpy(): ToastMessageService {
  return { showError: jest.fn() } as unknown as ToastMessageService;
}

function branchServiceReturning(result: Observable<BranchDetails>): BranchService {
  return { getBranchDetails: jest.fn().mockReturnValue(result) } as unknown as BranchService;
}

const BRANCH_REQUEST = { projectId: "p1", repositoryId: "r1", branchName: "feature/x" };

describe("prefilledIds", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["an empty array", []],
    ["an object without an id", { mxVersion: "1.0" }],
  ])("returns nothing for %s", (_label, value) => {
    expect(prefilledIds(value)).toEqual([]);
  });

  it("returns a bare id as a single entry", () => {
    expect(prefilledIds("repo-1")).toEqual(["repo-1"]);
  });

  it("returns every entry of an array of ids", () => {
    expect(prefilledIds(["sc-1", "sc-2"])).toEqual(["sc-1", "sc-2"]);
  });

  it("returns the id of an object value", () => {
    expect(prefilledIds({ id: "fp-9", mxVersion: "1.0" })).toEqual(["fp-9"]);
  });

  it("drops empty entries from an array of ids", () => {
    expect(prefilledIds(["sc-1", ""])).toEqual(["sc-1"]);
  });
});

describe("deadPrefillValidator", () => {
  it("reports the message while the control still holds a dead value", () => {
    const control = new FormControl("repo-1");

    expect(deadPrefillValidator(["repo-1"], "gone")(control)).toEqual({
      [DEAD_PREFILL_ERROR]: "gone",
    });
  });

  it("reports nothing once the control holds a different value", () => {
    const control = new FormControl("repo-2");

    expect(deadPrefillValidator(["repo-1"], "gone")(control)).toBeNull();
  });

  it("reports while any one of several ids is still dead", () => {
    const control = new FormControl(["sc-1", "sc-2"]);

    expect(deadPrefillValidator(["sc-2"], "gone")(control)).toEqual({
      [DEAD_PREFILL_ERROR]: "gone",
    });
  });

  it("reports when the dead id is the id of an object value", () => {
    const control = new FormControl({ id: "fp-9", mxVersion: "1.0" });

    expect(deadPrefillValidator(["fp-9"], "gone")(control)).toEqual({
      [DEAD_PREFILL_ERROR]: "gone",
    });
  });

  it("survives revalidation of the control", () => {
    const control = new FormControl("repo-1", [Validators.required]);
    control.addValidators(deadPrefillValidator(["repo-1"], "gone"));
    control.updateValueAndValidity();

    control.updateValueAndValidity();

    expect(control.invalid).toBe(true);
    expect(control.errors).toEqual({ [DEAD_PREFILL_ERROR]: "gone" });
  });
});

describe("checkPrefilledEntities", () => {
  it("leaves the control untouched when nothing was pre-filled", (done) => {
    const control = new FormControl(null, [Validators.required]);
    const toast = toastSpy();
    const lookup = jest.fn();

    checkPrefilledEntities(control, prefilledIds(control.value), lookup, toast).subscribe(() => {
      expect(lookup).not.toHaveBeenCalled();
      expect(toast.showError).not.toHaveBeenCalled();
      done();
    });
  });

  it("leaves the control valid when the pre-filled id still resolves", (done) => {
    const control = new FormControl("repo-1", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledEntities(control, ["repo-1"], () => of({ id: "repo-1" }), toast).subscribe(() => {
      expect(control.valid).toBe(true);
      expect(toast.showError).not.toHaveBeenCalled();
      done();
    });
  });

  it("invalidates the control when the pre-filled id no longer resolves", (done) => {
    const control = new FormControl("repo-1", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledEntities(
      control,
      ["repo-1"],
      () => throwError(() => new Error("Repository not found")),
      toast
    ).subscribe(() => {
      expect(control.invalid).toBe(true);
      expect(control.errors).toEqual({ [DEAD_PREFILL_ERROR]: "Repository not found" });
      done();
    });
  });

  it("relays the lookup failure to the user", (done) => {
    const control = new FormControl("repo-1");
    const toast = toastSpy();

    checkPrefilledEntities(
      control,
      ["repo-1"],
      () => throwError(() => new Error("Repository not found")),
      toast
    ).subscribe(() => {
      expect(toast.showError).toHaveBeenCalledWith("Repository not found");
      done();
    });
  });

  it("relays a failure rejected as a bare string, as InfraGroupService does", (done) => {
    const control = new FormControl("group-1");
    const toast = toastSpy();

    checkPrefilledEntities(control, ["group-1"], () => throwError(() => "Could not fetch groups details"), toast).subscribe(
      () => {
        expect(toast.showError).toHaveBeenCalledWith("Could not fetch groups details");
        done();
      }
    );
  });

  it("falls back to a generic message when the failure carries none", (done) => {
    const control = new FormControl("repo-1");
    const toast = toastSpy();

    checkPrefilledEntities(control, ["repo-1"], () => throwError(() => new Error("")), toast).subscribe(() => {
      expect(toast.showError).toHaveBeenCalledWith(PREFILL_LOOKUP_FAILED);
      done();
    });
  });

  it("invalidates the control when only some of several ids resolve", (done) => {
    const control = new FormControl(["sc-1", "sc-2"], [Validators.required]);
    const toast = toastSpy();

    checkPrefilledEntities(
      control,
      ["sc-1", "sc-2"],
      (id) => (id === "sc-1" ? of({ id }) : throwError(() => new Error("Scenario not found"))),
      toast
    ).subscribe(() => {
      expect(control.invalid).toBe(true);
      done();
    });
  });

  it("clears the error once the dead id is replaced", (done) => {
    const control = new FormControl("repo-1", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledEntities(control, ["repo-1"], () => throwError(() => new Error("gone")), toast).subscribe(() => {
      control.setValue("repo-2");

      expect(control.valid).toBe(true);
      done();
    });
  });
});

describe("checkPrefilledBranch", () => {
  it("leaves the control untouched when no branch was pre-filled", (done) => {
    const control = new FormControl(null);
    const branchService = branchServiceReturning(of({ latestCommitId: "c1" }));
    const toast = toastSpy();

    checkPrefilledBranch(
      control,
      branchService,
      { ...BRANCH_REQUEST, branchName: "" },
      { mustExist: true, message: "missing" },
      toast
    ).subscribe(() => {
      expect(branchService.getBranchDetails).not.toHaveBeenCalled();
      done();
    });
  });

  it("leaves the control valid when a branch expected to exist does", (done) => {
    const control = new FormControl("feature/x", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledBranch(
      control,
      branchServiceReturning(of({ latestCommitId: "c1" })),
      BRANCH_REQUEST,
      { mustExist: true, message: "missing" },
      toast
    ).subscribe(() => {
      expect(control.valid).toBe(true);
      expect(toast.showError).not.toHaveBeenCalled();
      done();
    });
  });

  it("invalidates the control when a branch expected to exist is absent", (done) => {
    const control = new FormControl("feature/x", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledBranch(
      control,
      branchServiceReturning(throwError(() => new BranchDetailsError("not found", 404))),
      BRANCH_REQUEST,
      { mustExist: true, message: "missing" },
      toast
    ).subscribe(() => {
      expect(control.errors).toEqual({ [DEAD_PREFILL_ERROR]: "missing" });
      expect(toast.showError).toHaveBeenCalledWith("missing");
      done();
    });
  });

  it("invalidates the control when a branch about to be created already exists", (done) => {
    const control = new FormControl("feature/x", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledBranch(
      control,
      branchServiceReturning(of({ latestCommitId: "c1" })),
      BRANCH_REQUEST,
      { mustExist: false, message: "already taken" },
      toast
    ).subscribe(() => {
      expect(control.errors).toEqual({ [DEAD_PREFILL_ERROR]: "already taken" });
      expect(toast.showError).toHaveBeenCalledWith("already taken");
      done();
    });
  });

  it("leaves the control valid when a branch about to be created is absent", (done) => {
    const control = new FormControl("feature/x", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledBranch(
      control,
      branchServiceReturning(throwError(() => new BranchDetailsError("not found", 404))),
      BRANCH_REQUEST,
      { mustExist: false, message: "already taken" },
      toast
    ).subscribe(() => {
      expect(control.valid).toBe(true);
      done();
    });
  });

  it("reports a generic message when the branch lookup itself fails", (done) => {
    const control = new FormControl("feature/x", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledBranch(
      control,
      branchServiceReturning(throwError(() => new BranchDetailsError("Internal Server Error", 500))),
      BRANCH_REQUEST,
      { mustExist: true, message: "missing" },
      toast
    ).subscribe(() => {
      expect(toast.showError).toHaveBeenCalledWith(BRANCH_CHECK_FAILED);
      done();
    });
  });

  it("blocks submission when the branch lookup itself fails", (done) => {
    const control = new FormControl("feature/x", [Validators.required]);
    const toast = toastSpy();

    checkPrefilledBranch(
      control,
      branchServiceReturning(throwError(() => new BranchDetailsError("Internal Server Error", 500))),
      BRANCH_REQUEST,
      { mustExist: true, message: "missing" },
      toast
    ).subscribe(() => {
      expect(control.invalid).toBe(true);
      done();
    });
  });
});
