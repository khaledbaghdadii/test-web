import { FilterTranslatorService } from "./filter-translator.service";

describe("FilterTranslatorService", () => {
  let service: FilterTranslatorService;

  beforeEach(() => {
    service = new FilterTranslatorService();
  });

  it("should return an empty query if filters are not defined", () => {
    const query = service.handleTableFiltersChange<Query>({});

    expect(query.field1).toBeUndefined();
    expect(query.field2).toBeUndefined();
  });

  it("should return an empty query if no filters are passed", () => {
    const query = service.handleTableFiltersChange<Query>({
      filters: {},
    });

    expect(query.field1).toBeUndefined();
    expect(query.field2).toBeUndefined();
  });

  it("should return a query with one field when only the one filter was passed", () => {
    const query = service.handleTableFiltersChange<Query>({
      filters: {
        field1: {
          value: "someValue",
        },
      },
    });

    expect(query.field1).toEqual("someValue");
    expect(query.field2).toBeUndefined();
  });

  it("should return a query with one field when only the one filter was passed as an array", () => {
    const query = service.handleTableFiltersChange<Query>({
      filters: {
        field2: [
          {
            value: "someValue",
          },
        ],
      },
    });

    expect(query.field1).toBeUndefined();
    expect(query.field2).toEqual("someValue");
  });

  it("should set the value of the page size in the query when it is present in the event", () => {
    const query = service.handleTableFiltersChange<Query>({
      rows: 10,
    });

    expect(query.pageSize).toEqual(10);
  });

  it("should deduce the value of the page index when possible", () => {
    const query = service.handleTableFiltersChange<Query>({
      first: 15,
      rows: 10,
    });

    expect(query.page).toEqual(1);
  });

  it("should not set the page if first row is undefined", () => {
    const query = service.handleTableFiltersChange<Query>({
      rows: 10,
    });

    expect(query.page).toBeUndefined();
  });

  it.each([" ", "    ", undefined, ""])(
    "should mark empty string as undefined if requested",
    (field) => {
      const query = service.handleTableFiltersChange<Query>(
        {
          filters: {
            field1: {
              value: field,
            },
          },
        },
        { markEmptyStringAsUndefined: true }
      );

      expect(query.field1).toBeUndefined();
    }
  );

  it.each([" ", "    ", null, ""])(
    "should not mark empty string as undefined if not requested",
    (field) => {
      const query = service.handleTableFiltersChange<Query>({
        filters: {
          field1: {
            value: field,
          },
        },
      });

      expect(query.field1).not.toBeUndefined();
    }
  );
});

interface Query {
  field1: any;
  field2: any;
  page: number;
  pageSize: number;
}
