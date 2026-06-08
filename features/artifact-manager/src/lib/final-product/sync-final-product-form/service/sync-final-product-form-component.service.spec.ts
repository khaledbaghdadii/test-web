import { SyncFinalProductFormComponentService } from "./sync-final-product-form-component.service";
import { TestBed } from "@angular/core/testing";
import { DestroyRef } from "@angular/core";
import { FinalProductStateService } from "../../service/final-product-state.service";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { SelectedGroup } from "@mxflow/features/infra-management";
import { FinalProduct } from "@mxflow/features/artifact-manager";
import { firstValueFrom, of } from "rxjs";
import { SyncFinalProductForm } from "../model/sync-final-product-form";
import { EnvironmentDefinition } from "@mxflow/features/environment";
import { SyncFinalProductApiRequest } from "../../model/sync-final-product-api-request";

describe("SyncFinalProductComponentService", () => {
  let service: SyncFinalProductFormComponentService;
  let finalProductStateService: FinalProductStateService;
  const FINAL_PRODUCT_VERSION = "FINAL_PRODUCT_VERSION";
  const NFS_STORAGE_TYPE = "nfs";
  const DEFAULT_GROUP_ID = "murex";
  const CLASSIFIER = "CLASSIFIER";
  const NEXUS3_STORAGE_TYPE = "nexus3";
  const DEFAULT_ARTIFACT_ID = "finalproduct";
  const PACKAGE_NAME = "PACKAGE_NAME";
  const DIRECTORY_NAME = "DIRECTORY_NAME";
  const ENVIRONMENT_DEFINITION_ID = "ENVIRONMENT_DEFINITION_ID";
  const ENVIRONMENT_DEFINITION = {
    id: ENVIRONMENT_DEFINITION_ID,
    name: "Environment Definition",
  } as EnvironmentDefinition;
  const INFRA_GROUP: SelectedGroup = {
    id: "GROUP_ID",
    projectId: "PROJECT_ID",
    name: "GROUP_NAME",
  };
  const FINAL_PRODUCT = {
    id: "FINAL_PRODUCT_ID",
    projectId: "PROJECT_ID",
  } as unknown as FinalProduct;
  const SYNC_FINAL_PRODUCT_REQUEST_NFS: SyncFinalProductApiRequest = {
    infraGroupId: INFRA_GROUP.id,
    environmentDefinitionIds: [ENVIRONMENT_DEFINITION_ID],
    lightPackage: true,
    destinationMetadata: {
      storageType: NFS_STORAGE_TYPE,
      packageName: PACKAGE_NAME,
      directoryName: DIRECTORY_NAME,
    },
  };
  const SYNC_FINAL_PRODUCT_REQUEST_NEXUS3: SyncFinalProductApiRequest = {
    infraGroupId: INFRA_GROUP.id,
    environmentDefinitionIds: [ENVIRONMENT_DEFINITION_ID],
    lightPackage: false,
    destinationMetadata: {
      storageType: NEXUS3_STORAGE_TYPE,
      groupId: DEFAULT_GROUP_ID,
      artifactId: DEFAULT_ARTIFACT_ID,
      version: FINAL_PRODUCT_VERSION,
      classifier: CLASSIFIER,
    },
  };
  let form: FormGroup;
  beforeEach(() => {
    form = new FormGroup({
      storageType: new FormControl<"nexus3" | "nfs">(NFS_STORAGE_TYPE, {
        validators: [Validators.required],
      }),
      packageName: new FormControl<string | null>(null),
      directoryName: new FormControl<string | null>(null),
      infraGroup: new FormControl<SelectedGroup | undefined>(undefined, {
        validators: [Validators.required],
      }),
      environmentDefinitions: new FormControl<EnvironmentDefinition[] | null>(
        null,
        {
          validators: [Validators.required],
        }
      ),
      groupId: new FormControl<string>({
        value: DEFAULT_GROUP_ID,
        disabled: true,
      }),
      artifactId: new FormControl<string>({
        value: DEFAULT_ARTIFACT_ID,
        disabled: true,
      }),
      version: new FormControl<string | null>(FINAL_PRODUCT_VERSION),
      classifier: new FormControl<string | null>(null),
      lightPackage: new FormControl<boolean>(false),
    });
    finalProductStateService = {
      syncFinalProduct: jest.fn().mockReturnValue(of(void 0)),
    } as unknown as jest.Mocked<FinalProductStateService>;
    TestBed.configureTestingModule({
      providers: [
        SyncFinalProductFormComponentService,
        DestroyRef,
        FormBuilder,
        {
          provide: FinalProductStateService,
          useValue: finalProductStateService,
        },
      ],
    });
    service = TestBed.inject(SyncFinalProductFormComponentService);
  });
  describe("initializeForm", () => {
    it("should initialize form with default values", () => {
      const initializedForm = service.initializeForm({
        version: FINAL_PRODUCT_VERSION,
      });

      expect(initializedForm).toBeTruthy();
      expect(initializedForm.get("storageType")?.value).toBe(NFS_STORAGE_TYPE);
      expect(initializedForm.get("groupId")?.value).toBe(DEFAULT_GROUP_ID);
      expect(initializedForm.get("artifactId")?.value).toBe(
        DEFAULT_ARTIFACT_ID
      );
      expect(initializedForm.get("version")?.value).toBe(FINAL_PRODUCT_VERSION);
      expect(initializedForm.get("packageName")?.value).toBeNull();
      expect(initializedForm.get("directoryName")?.value).toBeNull();
      expect(initializedForm.get("environmentDefinitions")?.value).toBeNull();
      expect(initializedForm.get("classifier")?.value).toBeNull();
      expect(initializedForm.get("lightPackage")?.value).toBe(false);
      expect(initializedForm.get("groupId")?.disabled).toBeTruthy();
      expect(initializedForm.get("artifactId")?.disabled).toBeTruthy();
    });
  });
  describe("applyFormValidators", () => {
    it("should apply NFS validators when storageType is nfs", () => {
      service.applyFormValidators(form);

      expect(form.get("directoryName")?.validator).toBeDefined();
      expect(form.get("packageName")?.validator).toBeDefined();
      expect(form.get("groupId")?.validator).toBeNull();
      expect(form.get("artifactId")?.validator).toBeNull();
      expect(form.get("version")?.validator).toBeNull();
      expect(form.get("classifier")?.validator).toBeNull();

      const directoryNameControl = form.get("directoryName");
      directoryNameControl?.setValue("validDirectoryName");
      expect(directoryNameControl?.valid).toBeTruthy();

      directoryNameControl?.setValue("invalid directory name");
      expect(directoryNameControl?.invalid).toBeTruthy();
      expect(directoryNameControl?.errors).toEqual({ noSpaces: true });

      const packageNameControl = form.get("packageName");
      packageNameControl?.setValue("validPackageName");
      expect(packageNameControl?.valid).toBeTruthy();

      packageNameControl?.setValue("invalid package name");
      expect(packageNameControl?.invalid).toBeTruthy();
      expect(packageNameControl?.errors).toEqual({ noSpaces: true });
    });
    it("should apply Nexus validators when storageType is nexus3", () => {
      form.get("storageType")?.setValue(NEXUS3_STORAGE_TYPE);
      service.applyFormValidators(form);

      expect(form.get("directoryName")?.validator).toBeNull();
      expect(form.get("packageName")?.validator).toBeNull();
      expect(form.get("groupId")?.validator).toBeDefined();
      expect(form.get("artifactId")?.validator).toBeDefined();
      expect(form.get("version")?.validator).toBeDefined();
      expect(form.get("classifier")?.validator).toBeNull();

      const groupIdControl = form.get("groupId");
      groupIdControl?.enable();
      groupIdControl?.setValue("");
      expect(groupIdControl?.invalid).toBeTruthy();
      expect(groupIdControl?.errors).toEqual({ required: true });
      groupIdControl?.setValue("validGroupId");
      expect(groupIdControl?.valid).toBeTruthy();

      const artifactIdControl = form.get("artifactId");
      artifactIdControl?.enable();
      artifactIdControl?.setValue("");
      expect(artifactIdControl?.invalid).toBeTruthy();
      expect(artifactIdControl?.errors).toEqual({ required: true });
      artifactIdControl?.setValue("validArtifactId");
      expect(artifactIdControl?.valid).toBeTruthy();

      const versionControl = form.get("version");
      versionControl?.setValue("");
      expect(versionControl?.invalid).toBeTruthy();
      expect(versionControl?.errors).toEqual({ required: true });
      versionControl?.setValue("validVersion");
      expect(versionControl?.valid).toBeTruthy();
    });
  });
  describe("subscribeToDestinationStorageTypeChanges", () => {
    it("should update validators when storageType changes", () => {
      jest.spyOn(service, "applyFormValidators");
      service.subscribeToDestinationStorageTypeChanges(form);

      form.get("storageType")?.setValue(NEXUS3_STORAGE_TYPE);

      expect(service.applyFormValidators).toHaveBeenCalledWith(form);

      form.get("storageType")?.setValue(NFS_STORAGE_TYPE);

      expect(service.applyFormValidators).toHaveBeenCalledWith(form);
    });
  });
  describe("syncFinalProduct", () => {
    it("should call syncFinalProduct on FinalProductStateService with the correct request when form is valid and storageType is nfs", async () => {
      form.patchValue({
        storageType: NFS_STORAGE_TYPE,
        packageName: PACKAGE_NAME,
        directoryName: DIRECTORY_NAME,
        infraGroup: INFRA_GROUP,
        environmentDefinitions: [ENVIRONMENT_DEFINITION],
        lightPackage: true,
      });
      const promise = firstValueFrom(
        service.syncFinalProduct(FINAL_PRODUCT, form)
      );
      await expect(promise).resolves.toBeUndefined();

      expect(finalProductStateService.syncFinalProduct).toHaveBeenCalledWith(
        FINAL_PRODUCT.projectId,
        FINAL_PRODUCT.id,
        SYNC_FINAL_PRODUCT_REQUEST_NFS
      );
    });
    it("should call syncFinalProduct on FinalProductStateService with the correct request when form is valid and storageType is nexus3", async () => {
      form.patchValue({
        storageType: NEXUS3_STORAGE_TYPE,
        infraGroup: INFRA_GROUP,
        environmentDefinitions: [ENVIRONMENT_DEFINITION],
        groupId: DEFAULT_GROUP_ID,
        artifactId: DEFAULT_ARTIFACT_ID,
        version: FINAL_PRODUCT_VERSION,
        classifier: CLASSIFIER,
        lightPackage: false,
      });

      const promise = firstValueFrom(
        service.syncFinalProduct(FINAL_PRODUCT, form)
      );

      await expect(promise).resolves.toBeUndefined();
      expect(finalProductStateService.syncFinalProduct).toHaveBeenCalledWith(
        FINAL_PRODUCT.projectId,
        FINAL_PRODUCT.id,
        SYNC_FINAL_PRODUCT_REQUEST_NEXUS3
      );
    });
    it("should throw an error when form is invalid", async () => {
      form.patchValue({
        storageType: null,
      });
      const promise = firstValueFrom(
        service.syncFinalProduct(FINAL_PRODUCT, form)
      );

      await expect(promise).rejects.toBeInstanceOf(Error);
      await expect(promise).rejects.toHaveProperty(
        "message",
        "Could not submit form to sync final product: form is invalid or no final product is selected"
      );
      expect(finalProductStateService.syncFinalProduct).not.toHaveBeenCalled();
    });
    it("should throw an error when finalProduct is undefined", async () => {
      const promise = firstValueFrom(service.syncFinalProduct(undefined, form));

      await expect(promise).rejects.toBeInstanceOf(Error);
      await expect(promise).rejects.toHaveProperty(
        "message",
        "Could not submit form to sync final product: form is invalid or no final product is selected"
      );
      expect(finalProductStateService.syncFinalProduct).not.toHaveBeenCalled();
    });
  });
  describe("setClassifier", () => {
    it("should set classifier correctly when provided a valid environment definition", () => {
      const environmentDefinitions = [
        { name: "Development Environment" },
      ] as EnvironmentDefinition[];
      const mockForm = new FormGroup<SyncFinalProductForm>({
        classifier: new FormControl<string | null>(null),
      } as unknown as SyncFinalProductForm);

      service.setClassifier(mockForm, environmentDefinitions);

      expect(mockForm.get("classifier")?.value).toBe("development_environment");
    });
    it("should set classifier using all environment definition names joined by underscore", () => {
      const environmentDefinitions = [
        { name: "Development Environment" },
        { name: "Staging Environment" },
      ] as EnvironmentDefinition[];
      const mockForm = new FormGroup<SyncFinalProductForm>({
        classifier: new FormControl<string | null>(null),
      } as unknown as SyncFinalProductForm);

      service.setClassifier(mockForm, environmentDefinitions);

      expect(mockForm.get("classifier")?.value).toBe(
        "development_environment_staging_environment"
      );
    });
    it("should truncate classifier to 128 characters", () => {
      const environmentDefinitions = [
        { name: "A".repeat(100) },
        { name: "B".repeat(100) },
      ] as EnvironmentDefinition[];
      const expectedClassifier = "a".repeat(100) + "_" + "b".repeat(27);
      const mockForm = new FormGroup<SyncFinalProductForm>({
        classifier: new FormControl<string | null>(null),
      } as unknown as SyncFinalProductForm);

      service.setClassifier(mockForm, environmentDefinitions);

      expect(mockForm.get("classifier")?.value).toHaveLength(128);
      expect(mockForm.get("classifier")?.value).toBe(expectedClassifier);
    });
    it("should set classifier to null when provided an empty array", () => {
      const mockForm = new FormGroup<SyncFinalProductForm>({
        classifier: new FormControl<string | null>(null),
      } as unknown as SyncFinalProductForm);
      service.setClassifier(mockForm, []);

      expect(mockForm.get("classifier")?.value).toBeNull();
    });
  });
});
