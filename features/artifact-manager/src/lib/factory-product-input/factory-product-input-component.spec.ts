import { FactoryProductInputComponent } from "./factory-product-input-component";
import { interval, map, merge, Observable, of, Subject } from "rxjs";
import { ArtifactManagerService } from "../artifact-manager.service";
import { MxBuildIdDropdownValue } from "../software-product-selector/model/mxbuildid-dropdown-option";
import { v4 as uuidv4 } from "uuid";
import { FactoryProductApiResponse } from "../api-models/factory-product/factory-product-api-response";

const ERROR_MESSAGE = "error";
describe("factory-product-input-component tests", () => {
  let component: FactoryProductInputComponent;
  let artifactManagerService: ArtifactManagerService;

  beforeEach(() => {
    artifactManagerService = {
      getFactoryProductById: jest.fn(() => of(factoryProduct)),
    } as unknown as ArtifactManagerService;
    component = new FactoryProductInputComponent(artifactManagerService);
    component.projectId = projectId;
  });

  describe("on component initialization", () => {
    describe("when the factory product id is passed", () => {
      beforeEach(() => {
        component.factoryProductId = "some-id";
      });

      it("should fetch the factory product by its id", () => {
        component.ngOnInit();

        expect(
          artifactManagerService.getFactoryProductById
        ).toHaveBeenCalledWith("some-id", expect.anything());
      });

      it("should fetch the factory product with the correct project id", () => {
        let expectedProjectId = uuidv4();
        component.projectId = expectedProjectId;

        component.ngOnInit();

        expect(
          artifactManagerService.getFactoryProductById
        ).toHaveBeenCalledWith(expect.anything(), expectedProjectId);
      });

      it("should set the values of the factory product specifications from the fetched data", () => {
        component.ngOnInit();

        expect(component.mxVersion).toEqual(mxVersion);
        expect(component.mxBuildId).toEqual(mxBuildId);
        expect(component.bipVersion).toEqual(bipVersion);
        expect(component.bipBuildId).toEqual(bipBuildId);
      });

      it("should emit the values of the factory product specifications from the fetched data", () => {
        const bipVersionChangeEmitter = jest.spyOn(
          component.bipVersionChange,
          "emit"
        );
        const mxVersionChangeEmitter = jest.spyOn(
          component.mxVersionChange,
          "emit"
        );
        const bipBuildIdChangeEmitter = jest.spyOn(
          component.bipBuildIdChange,
          "emit"
        );
        const mxBuildIdChangeEmitter = jest.spyOn(
          component.mxBuildIdChange,
          "emit"
        );

        component.ngOnInit();

        expect(mxVersionChangeEmitter).toHaveBeenCalledWith(mxVersion);
        expect(mxBuildIdChangeEmitter).toHaveBeenCalledWith(mxBuildId);
        expect(bipVersionChangeEmitter).toHaveBeenCalledWith(bipVersion);
        expect(bipBuildIdChangeEmitter).toHaveBeenCalledWith(bipBuildId);
      });

      it("should not override the passed factory product specifications from the parent component with the ones from the fetched factory product", () => {
        component.mxVersion = "something";
        component.mxBuildId = "another thing";
        component.bipVersion = "hello";
        component.bipBuildId = "world";

        component.ngOnInit();

        expect(component.mxVersion).toEqual("something");
        expect(component.mxBuildId).toEqual("another thing");
        expect(component.bipVersion).toEqual("hello");
        expect(component.bipBuildId).toEqual("world");
      });
    });
  });

  describe("when mx version changes", () => {
    const mxVersion = pickRandomlyFrom(["some-mx-version", undefined]);

    it("should update the value of the mx version in the component that is passed to the child components", () => {
      component.onMxVersionChange(mxVersion);
      expect(component.mxVersion).toEqual(mxVersion);
    });

    it("should update the value of the bip version in the component that is passed to the child components to undefined", () => {
      component.onMxVersionChange(mxVersion);
      expect(component.bipVersion).toBeUndefined();
    });

    it("should update the value of the bip build id in the component that is passed to the child components to undefined", () => {
      component.onMxVersionChange(mxVersion);
      expect(component.bipBuildId).toBeUndefined();
    });

    it("should emit the new value of the mx version to the parent component", () => {
      const emitter = jest.spyOn(component.mxVersionChange, "emit");
      component.onMxVersionChange(mxVersion);
      expect(emitter).toHaveBeenCalledWith(mxVersion);
    });

    it("should emit an undefined value of the bip version to the parent component", () => {
      const emitter = jest.spyOn(component.bipVersionChange, "emit");
      component.onMxVersionChange(mxVersion);
      expect(emitter).toHaveBeenCalledWith(undefined);
    });

    it("should emit an undefined value of the bip build id to the parent component", () => {
      const emitter = jest.spyOn(component.bipBuildIdChange, "emit");
      component.onMxVersionChange(mxVersion);
      expect(emitter).toHaveBeenCalledWith(undefined);
    });

    it("should emit an undefined value of the factory product id to the parent component", () => {
      const emitter = jest.spyOn(component.factoryProductIdChange, "emit");
      component.onMxVersionChange(mxVersion);
      expect(emitter).toHaveBeenCalledWith(undefined);
    });
  });

  describe("when mx build id changes", () => {
    const mxBuildId: MxBuildIdDropdownValue | undefined = pickRandomlyFrom([
      { buildId: "mxBuildId", parentId: "parentId" } as MxBuildIdDropdownValue,
      undefined,
    ]);

    it("should update the value of the mx build id in the component that is passed to the child components", () => {
      component.onMxBuildIdChange(mxBuildId);
      expect(component.mxBuildId).toEqual(mxBuildId?.buildId);
    });

    it("should update the value of the parent id in the component that is passed to the child components", () => {
      component.onMxBuildIdChange(mxBuildId);
      expect(component.parentId).toEqual(mxBuildId?.parentId);
    });

    it("should update the value of the bip version in the component that is passed to the child components to undefined", () => {
      component.onMxBuildIdChange(mxBuildId);
      expect(component.bipVersion).toBeUndefined();
    });

    it("should update the value of the bip build id in the component that is passed to the child components to undefined", () => {
      component.onMxBuildIdChange(mxBuildId);
      expect(component.bipBuildId).toBeUndefined();
    });

    it("should emit the new value of the mx build id to the parent component", () => {
      const emitter = jest.spyOn(component.mxBuildIdChange, "emit");
      component.onMxBuildIdChange(mxBuildId);
      expect(emitter).toHaveBeenCalledWith(mxBuildId?.buildId);
    });

    it("should emit an undefined value of the bip version to the parent component", () => {
      const emitter = jest.spyOn(component.bipVersionChange, "emit");
      component.onMxBuildIdChange(mxBuildId);
      expect(emitter).toHaveBeenCalledWith(undefined);
    });

    it("should emit an undefined value of the bip build id to the parent component", () => {
      const emitter = jest.spyOn(component.bipBuildIdChange, "emit");
      component.onMxBuildIdChange(mxBuildId);
      expect(emitter).toHaveBeenCalledWith(undefined);
    });

    it("should emit an undefined value of the factory product id to the parent component", () => {
      const emitter = jest.spyOn(component.factoryProductIdChange, "emit");
      component.onMxBuildIdChange(mxBuildId);
      expect(emitter).toHaveBeenCalledWith(undefined);
    });
  });

  describe("when bip version changes", () => {
    const bipVersion = pickRandomlyFrom(["some-bip-version", undefined]);

    it("should update the value of the bip version in the component that is passed to the child components", () => {
      component.onBipVersionChange(bipVersion);
      expect(component.bipVersion).toEqual(bipVersion);
    });

    it("should emit the new value of the bip version to the parent component", () => {
      const emitter = jest.spyOn(component.bipVersionChange, "emit");
      component.onBipVersionChange(bipVersion);
      expect(emitter).toHaveBeenCalledWith(bipVersion);
    });
  });

  describe("when bip build id changes", () => {
    const bipBuildId = pickRandomlyFrom(["some-bip-build-id", undefined]);

    it("should update the value of the bip build id in the component that is passed to the child components", () => {
      component.onBipBuildIdChange(bipBuildId);
      expect(component.bipBuildId).toEqual(bipBuildId);
    });

    it("should emit the new value of the bip build id to the parent component", () => {
      const emitter = jest.spyOn(component.bipBuildIdChange, "emit");
      component.onBipBuildIdChange(bipBuildId);
      expect(emitter).toHaveBeenCalledWith(bipBuildId);
    });
  });

  describe("when factory product id changes", () => {
    const factoryProductId = pickRandomlyFrom([
      "some-factory-product-id",
      undefined,
    ]);

    it("should update the value of the factory product id in the component that is passed to the child components", () => {
      component.onFactoryProductIdChange(factoryProductId);
      expect(component.factoryProductId).toEqual(factoryProductId);
    });

    it("should emit the new value of the factory product id to the parent component", () => {
      const emitter = jest.spyOn(component.factoryProductIdChange, "emit");
      component.onFactoryProductIdChange(factoryProductId);
      expect(emitter).toHaveBeenCalledWith(factoryProductId);
    });
  });

  describe("when error occurs", () => {
    it("should emit error message", () => {
      const emitter = jest.spyOn(component.errorOutput, "emit");
      component.onError(ERROR_MESSAGE);
      expect(emitter).toHaveBeenCalledWith(ERROR_MESSAGE);
    });
  });

  it("should unsubscribe from all the observables that outlive the component", () => {
    const subject = new Subject();
    const observable = interval(100).pipe(map((i) => i.toString()));
    artifactManagerService.getFactoryProductById = jest.fn(
      () =>
        merge(
          subject,
          observable
        ) as unknown as Observable<FactoryProductApiResponse>
    );

    component.factoryProductId = "something";
    component.ngOnInit();

    expect(subject.observed).toEqual(true);

    component.ngOnDestroy();

    expect(subject.observed).toEqual(false);
  });

  function pickRandomlyFrom(array: any[]): any {
    const lastArrayIndex = array.length - 1;
    const index = Math.floor(Math.random() * lastArrayIndex);
    return array[index];
  }
});

const projectId = "projectId";
const mxVersion = "mxVersion";
const mxBuildId = "mxBuildId";
const bipVersion = "bipVersion";
const bipBuildId = "bipBuildId";

const factoryProduct = {
  softwareProduct: {
    version: mxVersion,
    builds: [
      {
        mxBuild: {
          buildId: mxBuildId,
        },
        mxBundles: [{}],
      },
      {
        mxBundles: [],
      },
      {},
    ],
  },
  configurationComponents: [
    {
      version: bipVersion,
      builds: [
        {
          mxBuild: {
            buildId: bipBuildId,
          },
          mxBundles: [{}],
        },
        {
          mxBundles: [],
        },
        {},
      ],
    },
  ],
};
