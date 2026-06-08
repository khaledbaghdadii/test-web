import { FactoryProductValidator } from "./factory-product.validator";
import { FormControl } from "@angular/forms";

describe("FactoryProductValidator", () => {
  it("should return an error if factory product id does not exist", () => {
    let result = FactoryProductValidator.factoryProductAttributes()(
      new FormControl({ mxVersion: "mxVersion", mxBuildId: "mxBuildId" })
    );
    expect(result).toEqual({ missingFactoryProductAttributes: true });
  });

  it("should return an error if factory product object does not exist", () => {
    let result = FactoryProductValidator.factoryProductAttributes()(
      new FormControl()
    );
    expect(result).toEqual({ missingFactoryProductAttributes: true });
  });
});
