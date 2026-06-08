import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
  BusinessProcessFamily,
  SourceDefinitionsFetcherService,
} from "@mxflow/features/business-process";
import { lastValueFrom, of } from "rxjs";

const projectId = "projectId";
describe("Source definitions fetcher service", () => {
  let definitionService: BusinessProcessDefinitionService;
  let sourceDefinitionsFetcherService: SourceDefinitionsFetcherService;

  beforeEach(() => {
    definitionService = {
      getBusinessProcessDefinitions: jest.fn(() =>
        of([getFirstDefinition(), getSecondDefinition()])
      ),
    } as unknown as BusinessProcessDefinitionService;

    sourceDefinitionsFetcherService = new SourceDefinitionsFetcherService(
      definitionService
    );
  });

  describe("when fetching source defintions grouped by families", () => {
    it("should fetch the list of extendable definitions", async () => {
      await lastValueFrom(
        sourceDefinitionsFetcherService.getSourceBusinessProcessDefinitionsMap(
          projectId
        )
      );
      expect(
        definitionService.getBusinessProcessDefinitions
      ).toHaveBeenCalledWith({
        projectId: projectId,
        extendable: true,
      });
    });

    it("should group the definitions by their family id", async () => {
      let groupedDefinitions = await lastValueFrom(
        sourceDefinitionsFetcherService.getSourceBusinessProcessDefinitionsMap(
          projectId
        )
      );

      expect(groupedDefinitions).toStrictEqual(
        new Map([
          [getFirstFamily(), [getFirstDefinition()]],
          [getSecondFamily(), [getSecondDefinition()]],
        ])
      );
    });
  });

  function getFirstDefinition() {
    return {
      id: "def-id-1",
      family: getFirstFamily(),
    } as unknown as BusinessProcessDefinition;
  }

  function getSecondDefinition() {
    return {
      id: "def-id-2",
      family: getSecondFamily(),
    } as unknown as BusinessProcessDefinition;
  }

  function getFirstFamily() {
    return {
      id: "family-id-1",
      name: "family-name-1",
    } as unknown as BusinessProcessFamily;
  }

  function getSecondFamily() {
    return {
      id: "family-id-2",
      name: "family-name-2",
    } as unknown as BusinessProcessFamily;
  }
});
