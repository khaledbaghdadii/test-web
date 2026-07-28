import { CommonModule } from "@angular/common";
import { Component, computed, inject, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Project, ProjectService } from "@mxflow/features/project";
import { Drawer } from "primeng/drawer";
import { InputText } from "primeng/inputtext";
import { Panel } from "primeng/panel";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { Skeleton } from "primeng/skeleton";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-projects-drawer",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Drawer,
    InputText,
    Panel,
    IconField,
    InputIcon,
    Skeleton,
    MxevolveIconComponent,
  ],
  templateUrl: "./projects-drawer.component.html",
  host: {
    style: "display: contents;",
  },
})
export class ProjectsDrawerComponent {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  readonly visible = model<boolean>(false);

  readonly searchTerm = signal<string>("");
  readonly projects = signal<Project[]>([]);
  readonly loading = signal<boolean>(false);

  readonly filteredProjects = computed<Project[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    let list = this.projects();

    if (term) {
      list = list.filter((project) =>
        project.name.toLowerCase().includes(term)
      );
    }

    return list;
  });

  onShow(): void {
    this.loading.set(true);
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onProjectSelect(project: Project): void {
    this.visible.set(false);
    this.router.navigate(["/app", project.id]);
  }
}
