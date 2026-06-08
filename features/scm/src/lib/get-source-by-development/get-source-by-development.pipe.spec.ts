import { BranchNameByDevelopmentPipe } from "./get-source-by-development.pipe";
import { Development, ScmManagementService } from "@mxflow/features/scm";
import { v4 as uuid } from "uuid";
import { of, throwError } from "rxjs";
import spyOn = jest.spyOn;

describe("BranchNameByDevelopment", () => {
  let pipe: BranchNameByDevelopmentPipe;
  let scmManagementService: ScmManagementService;

  beforeEach(() => {
    scmManagementService = {
      getDevelopment: jest.fn(() => of()),
    } as unknown as ScmManagementService;
    pipe = new BranchNameByDevelopmentPipe(scmManagementService);
  });

  it("should fetch the name of the development given the development id and the project id", () => {
    const projectId = uuid();
    const developmentId = uuid();
    pipe.transform(projectId, developmentId);
    expect(scmManagementService.getDevelopment).toHaveBeenCalledWith(
      projectId,
      developmentId
    );
  });

  it("should return the name of the fetched development", (done) => {
    const name = "branch-name";
    spyOn(scmManagementService, "getDevelopment").mockReturnValue(
      of({ name: name } as Development)
    );
    const projectId = uuid();
    const developmentId = uuid();
    pipe.transform(projectId, developmentId).subscribe((value) => {
      expect(value).toEqual(name);
      done();
    });
  });

  it("should throw an error in case of failure when fetching the development", (done) => {
    const projectId = uuid();
    const developmentId = uuid();
    const errorMessage = uuid();

    spyOn(scmManagementService, "getDevelopment").mockImplementation(() => {
      return throwError(() => new Error(errorMessage));
    });

    pipe.transform(projectId, developmentId).subscribe({
      error: (error) => {
        expect(error).toEqual(new Error("Failed to fetch development"));
        done();
      },
    });
  });
});
