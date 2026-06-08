import { TestBed } from "@angular/core/testing";
import { FormatDatePipe } from "@mxflow/pipe";
import { FinalProduct } from "@mxflow/features/artifact-manager";
import { FinalProductTableService } from "./final-product-table.service";
import { Router } from "@angular/router"; // Adjust path as needed

const mockFormatDatePipeTransform = jest.fn();

const createMockFinalProduct = (
  expiryDate?: Date,
  state: string = "ACTIVE"
): FinalProduct =>
  ({
    state,
    expiryDate,
  } as unknown as FinalProduct);

describe("FinalProductTableService", () => {
  const routerSpy = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;
  let service: FinalProductTableService;

  const MOCK_NOW = new Date("2025-05-26T12:00:00.000Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_NOW);
    mockFormatDatePipeTransform.mockClear();

    TestBed.configureTestingModule({
      providers: [
        FinalProductTableService,
        {
          provide: FormatDatePipe,
          useValue: { transform: mockFormatDatePipeTransform },
        },
        {
          provide: Router,
          useValue: routerSpy,
        },
      ],
    });
    service = TestBed.inject(FinalProductTableService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getExpiryDate", () => {
    it("should return 'N/A' if expiryDate is undefined", () => {
      const finalProduct = createMockFinalProduct(undefined);
      expect(service.getExpiryDate(finalProduct)).toBe("N/A");
    });

    it("should return 'Expired' if expiryDate is in the past", () => {
      const pastDate = new Date("2025-05-25T11:59:59.999Z");
      const finalProduct = createMockFinalProduct(pastDate, "ACTIVE");
      expect(service.getExpiryDate(finalProduct)).toBe("Expired");
    });

    it("should return 'Expired' if finalProduct state is 'PURGING'", () => {
      const futureDate = new Date("2025-05-27T00:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "PURGING");
      expect(service.getExpiryDate(finalProduct)).toBe("Expired");
    });

    it("should return 'Expired' if finalProduct state is 'PURGED'", () => {
      const futureDate = new Date("2025-05-27T00:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "PURGED");
      expect(service.getExpiryDate(finalProduct)).toBe("Expired");
    });

    it("should return 'Expired' if finalProduct state is 'PURGE_FAILED'", () => {
      const futureDate = new Date("2025-05-27T00:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "PURGE_FAILED");
      expect(service.getExpiryDate(finalProduct)).toBe("Expired");
    });

    it("should return 'Expired' if finalProduct state is 'purging' (case insensitive)", () => {
      const futureDate = new Date("2025-05-27T00:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "purging");
      expect(service.getExpiryDate(finalProduct)).toBe("Expired");
    });

    it("should return formatted date if expiryDate is in the future and state is not expired", () => {
      const futureDate = new Date("2025-05-27T14:30:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "ACTIVE");
      const expectedFormattedDate = "Formatted: 5/27/2025";
      mockFormatDatePipeTransform.mockReturnValue(expectedFormattedDate);

      const result = service.getExpiryDate(finalProduct);

      expect(result).toBe(expectedFormattedDate);
      expect(mockFormatDatePipeTransform).toHaveBeenCalledWith(
        futureDate.toLocaleDateString()
      );
    });
  });

  describe("getRemainingDays", () => {
    it("should return 'N/A' if expiryDate is undefined", () => {
      const finalProduct = createMockFinalProduct(undefined);
      expect(service.getRemainingDays(finalProduct)).toBe("N/A");
    });

    it("should return 'N/A' if expiryDate is invalid", () => {
      const finalProduct = createMockFinalProduct(
        new Date("invalid-date-string"),
        "ACTIVE"
      );
      expect(service.getRemainingDays(finalProduct)).toBe("N/A");
    });

    it("should return 'N/A if finalProduct state is 'PURGING'", () => {
      const futureDate = new Date("2025-05-28T00:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "PURGING");
      expect(service.getRemainingDays(finalProduct)).toBe("N/A");
    });

    it("should return 'N/A' if finalProduct state is 'PURGED'", () => {
      const futureDate = new Date("2025-05-28T00:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "PURGED");
      expect(service.getRemainingDays(finalProduct)).toBe("N/A");
    });

    it("should return 'N/A' if finalProduct state is 'PURGE_FAILED'", () => {
      const futureDate = new Date("2025-05-28T00:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "PURGE_FAILED");
      expect(service.getRemainingDays(finalProduct)).toBe("N/A");
    });

    it("should return 'N/A' if finalProduct state is 'purged' (case insensitive)", () => {
      const futureDate = new Date("2025-05-28T00:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "purged");
      expect(service.getRemainingDays(finalProduct)).toBe("N/A");
    });

    it("should return 'N/A' if expiryDate is in the past", () => {
      const pastDate = new Date("2025-05-25T23:59:59.999Z");
      const finalProduct = createMockFinalProduct(pastDate, "ACTIVE");
      expect(service.getRemainingDays(finalProduct)).toBe("N/A");
    });

    it("should return 'N/A' if expiryDate is exactly now", () => {
      const finalProduct = createMockFinalProduct(MOCK_NOW, "ACTIVE");
      expect(service.getRemainingDays(finalProduct)).toBe("N/A");
    });

    it("should return 1 if expiryDate is less than 24 hours in the future", () => {
      const futureDate = new Date("2025-05-26T23:59:59.999Z");
      const finalProduct = createMockFinalProduct(futureDate, "ACTIVE");
      expect(service.getRemainingDays(finalProduct)).toBe("1");
    });

    it("should return 1 if expiryDate is exactly 24 hours in the future", () => {
      const futureDate = new Date("2025-05-27T12:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "ACTIVE");
      expect(service.getRemainingDays(finalProduct)).toBe("1");
    });

    it("should return 2 if expiryDate is between 24 and 48 hours in the future", () => {
      const futureDate = new Date("2025-05-28T11:59:59.999Z");
      const finalProduct = createMockFinalProduct(futureDate, "ACTIVE");
      expect(service.getRemainingDays(finalProduct)).toBe("2");
    });

    it("should return 5 if expiryDate is 5 days in the future", () => {
      const futureDate = new Date("2025-05-31T12:00:00.000Z");
      const finalProduct = createMockFinalProduct(futureDate, "ACTIVE");
      expect(service.getRemainingDays(finalProduct)).toBe("5");
    });

    it("should correctly calculate remaining days considering Math.ceil", () => {
      const futureDate = new Date("2025-05-27T12:00:00.001Z"); // 1 day and 1 ms
      const finalProduct = createMockFinalProduct(futureDate, "ACTIVE");
      expect(service.getRemainingDays(finalProduct)).toBe("2");
    });
  });

  describe("test navigateToFactoryProductTable", () => {
    it("should call router.navigate with correct path and queryParams", () => {
      const id = "factory-123";
      service.navigateToFactoryProductTable(id);

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ["global-operations/factory-products"],
        { queryParams: { id } }
      );
    });
  });
});
