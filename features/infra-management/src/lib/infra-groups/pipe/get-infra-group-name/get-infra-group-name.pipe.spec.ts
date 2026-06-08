import {
  GetInfraGroupNamePipe,
  Group,
  InfraGroupsService,
} from "@mxflow/features/infra-management";
import { firstValueFrom, of, throwError } from "rxjs";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ToastMessageService } from "@mxflow/ui/alert";

describe("Get Infra Group Name Pipe Test", () => {
  const projectId = "projectId";
  const infraGroupId = "infraGroupId";
  const infraGroupName = "infraGroupName";

  const infraGroup = {
    name: infraGroupName,
  } as Group;

  let infraGroupsService: InfraGroupsService;
  let projectIdResolver: ProjectIdRouteParamsResolverService;
  let toastMessageService: ToastMessageService;

  let pipe: GetInfraGroupNamePipe;

  beforeEach(() => {
    projectIdResolver = {
      resolve: jest.fn(() => projectId),
    } as unknown as ProjectIdRouteParamsResolverService;
    infraGroupsService = {
      getGroup: jest.fn(() => of(infraGroup)),
    } as unknown as InfraGroupsService;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    pipe = new GetInfraGroupNamePipe(
      infraGroupsService,
      projectIdResolver,
      toastMessageService
    );
  });

  it("should fetch the infra group with the correct project id and infra group id", async () => {
    await firstValueFrom(pipe.transform(infraGroupId));

    expect(infraGroupsService.getGroup).toHaveBeenCalledWith(
      projectId,
      infraGroupId
    );
  });

  it("should return the infra group name in an observable", async () => {
    let actualName = await firstValueFrom(pipe.transform(infraGroupId));

    expect(actualName).toStrictEqual(infraGroupName);
  });

  it("should return '-' when failing to fetch group", async () => {
    infraGroupsService.getGroup = jest.fn(() => throwError(() => "error"));

    const actualName = await firstValueFrom(pipe.transform(infraGroupId));

    expect(actualName).toBe("-");
  });

  it("should show an error toast message when failing to fetch group", async () => {
    infraGroupsService.getGroup = jest.fn(() => throwError(() => "error"));

    await firstValueFrom(pipe.transform(infraGroupId));

    expect(toastMessageService.showError).toHaveBeenCalledWith("error");
  });
});
