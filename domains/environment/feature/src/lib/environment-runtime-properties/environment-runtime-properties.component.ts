import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Select, SelectChangeEvent } from "primeng/select";
import { PrimeTemplate, TreeNode } from "primeng/api";
import { Tag } from "primeng/tag";
import { Tooltip } from "primeng/tooltip";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  MxflowSpinnerModule,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { CopyToClipboardComponent } from "@mxevolve/shared/ui/primitive";
import {
  RuntimePropertiesDocumentationService,
  RuntimePropertiesRequestType,
  RuntimePropertyNode,
  RuntimePropertyTreeNodeData,
} from "@mxevolve/domains/environment/data-access";
import { TreeTableModule } from "primeng/treetable";
import { Subject, takeUntil } from "rxjs";
import { InputText } from "primeng/inputtext";
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { ButtonDirective, ButtonIcon } from "primeng/button";

interface RequestTypeOption {
  label: string;
  value: string;
}

@Component({
  selector: "mxevolve-environment-runtime-properties",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Select,
    PrimeTemplate,
    Tag,
    Tooltip,
    CardContainerModule,
    HeaderTitleModule,
    MxflowSpinnerModule,
    TableEmptyMessageComponent,
    ErrorAlertComponent,
    CopyToClipboardComponent,
    TreeTableModule,
    InputText,
    InputIcon,
    IconField,
    ButtonDirective,
    ButtonIcon,
  ],
  templateUrl: "./environment-runtime-properties.component.html",
})
export class EnvironmentRuntimePropertiesComponent
  implements OnInit, OnDestroy
{
  private readonly route = inject(ActivatedRoute);
  private readonly runtimePropertiesDocumentationService = inject(
    RuntimePropertiesDocumentationService
  );

  private readonly destroy$ = new Subject<void>();
  private readonly PROJECT_ID = "projectId";
  private projectId: string | null = null;

  readonly requestTypeOptions: RequestTypeOption[] = [
    { label: "Deployment", value: RuntimePropertiesRequestType.DEPLOYMENT },
    { label: "Cleaning", value: RuntimePropertiesRequestType.CLEANING },
    {
      label: "Configuration Audit",
      value: RuntimePropertiesRequestType.CONFIG_AUDIT,
    },
    {
      label: "Import Configuration",
      value: RuntimePropertiesRequestType.IMPORT_CONFIG,
    },
  ];

  readonly selectedRequestType = signal<string | null>(null);
  readonly properties = signal<RuntimePropertyNode[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly allExpanded = signal(false);

  readonly runtimePropertiesNodes = computed<
    TreeNode<RuntimePropertyTreeNodeData>[]
  >(() => {
    const expanded = this.allExpanded();
    return this.properties().map((property) =>
      this.toTreeNode(property, "", false, expanded)
    );
  });

  ngOnInit(): void {
    this.projectId =
      this.route.snapshot.pathFromRoot
        .find((value) => value.paramMap.has(this.PROJECT_ID))
        ?.paramMap.get(this.PROJECT_ID) ?? null;
  }

  private fetchProperties(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (this.selectedRequestType()) {
      this.runtimePropertiesDocumentationService
        .getRuntimePropertiesDocumentation(
          this.projectId!,
          this.selectedRequestType()!
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (documentation) => {
            this.properties.set(documentation.properties);
            this.isLoading.set(false);
          },
          error: (error: Error) => {
            this.errorMessage.set(error.message);
            this.isLoading.set(false);
          },
        });
    }
  }

  private toTreeNode(
    node: RuntimePropertyNode,
    parentPath = "",
    isListElement = false,
    expanded = false
  ): TreeNode<RuntimePropertyTreeNodeData> {
    const currentName = node.kind === "LIST" ? `${node.name}[]` : node.name;

    const path = this.resolvePath(isListElement, parentPath, currentName);

    const { children, isElementChild } = this.resolveChildren(node);

    return {
      label: node.name,
      data: {
        ...node,
        path,
        isListElement,
        deprecatedValue: node.deprecated ? "deprecated" : "",
      },
      expanded,
      leaf: !children || children.length === 0,
      children: children?.map((child) =>
        this.toTreeNode(child, path, isElementChild, expanded)
      ),
    };
  }

  private resolvePath(
    isListElement: boolean,
    parentPath: string,
    currentName: string
  ) {
    if (parentPath) {
      if (isListElement) {
        return parentPath;
      } else {
        return `${parentPath}.${currentName}`;
      }
    }
    return currentName;
  }

  private resolveChildren(node: RuntimePropertyNode): {
    children: RuntimePropertyNode[] | undefined;
    isElementChild: boolean;
  } {
    if (node.children) {
      return { children: node.children, isElementChild: false };
    }
    if (node.element) {
      return { children: [node.element], isElementChild: true };
    }
    return { children: undefined, isElementChild: false };
  }

  onRequestTypeChange(event: SelectChangeEvent): void {
    this.selectedRequestType.set(event.value);
    this.fetchProperties();
  }

  toggleExpandAll(): void {
    this.allExpanded.set(!this.allExpanded());
  }

  onClear() {
    this.isLoading.set(false);
    this.errorMessage.set(null);
    this.properties.set([]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
