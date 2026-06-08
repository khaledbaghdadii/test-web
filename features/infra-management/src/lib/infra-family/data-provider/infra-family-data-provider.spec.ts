import { firstValueFrom, of } from "rxjs";
import { InfraFamilyDataProvider } from "./infra-family-data-provider";
import { InfraFamilyService } from "../infra-family.service";
import { InfraFamily } from "../model/infra-family.model";

describe("InfraFamilyDataProvider", () => {
  let dataProvider: InfraFamilyDataProvider;
  let mockInfraFamilyService: jest.Mocked<InfraFamilyService>;
  const PROJECT_ID = "test-project-id";

  const mockInfraFamilies: InfraFamily[] = [
    {
      id: "family-1",
      name: "Family 1",
      projectId: PROJECT_ID,
      description: "Description 1",
      createdOn: "2026-01-12T14:49:51.785Z",
      lastModifiedOn: "2026-01-12T14:49:51.785Z",
      createdBy: "user1",
      lastModifiedBy: "user1",
    },
    {
      id: "family-2",
      name: "Family 2",
      projectId: PROJECT_ID,
      description: "Description 2",
      createdOn: "2026-01-12T15:00:00.000Z",
      lastModifiedOn: "2026-01-12T15:00:00.000Z",
      createdBy: "user2",
      lastModifiedBy: "user2",
    },
  ];

  beforeEach(() => {
    mockInfraFamilyService = {
      getInfraFamilies: jest.fn().mockReturnValue(of(mockInfraFamilies)),
    } as unknown as jest.Mocked<InfraFamilyService>;

    dataProvider = new InfraFamilyDataProvider(mockInfraFamilyService);
  });

  describe("fetchData", () => {
    it("should call infraFamilyService.getInfraFamilies with correct projectId", () => {
      dataProvider.fetchData({ projectId: PROJECT_ID }).subscribe();

      expect(mockInfraFamilyService.getInfraFamilies).toHaveBeenCalledWith(
        PROJECT_ID
      );
    });

    it("should return infra families from service", async () => {
      const result = await firstValueFrom(
        dataProvider.fetchData({ projectId: PROJECT_ID })
      );

      expect(result).toEqual(mockInfraFamilies);
      expect(result.length).toBe(2);
    });
  });

  describe("toDropdownOption", () => {
    it("should convert infra family to dropdown option with name as label", () => {
      const infraFamily = mockInfraFamilies[0];

      const option = dataProvider.toDropdownOption(infraFamily);

      expect(option.label).toBe("Family 1");
      expect(option.value).toBe(infraFamily);
    });

    it("should use full infra family object as value", () => {
      const infraFamily = mockInfraFamilies[1];

      const option = dataProvider.toDropdownOption(infraFamily);

      expect(option.value).toEqual({
        id: "family-2",
        name: "Family 2",
        projectId: PROJECT_ID,
        description: "Description 2",
        createdOn: "2026-01-12T15:00:00.000Z",
        lastModifiedOn: "2026-01-12T15:00:00.000Z",
        createdBy: "user2",
        lastModifiedBy: "user2",
      });
    });
  });

  describe("getItemId", () => {
    it("should return infra family name as unique identifier", () => {
      const infraFamily = mockInfraFamilies[0];

      const itemId = dataProvider.getItemId(infraFamily);

      expect(itemId).toBe("family-1");
    });
  });
});
