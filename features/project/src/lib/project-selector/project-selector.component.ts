import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalActions } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";
import { Project } from "../project";
import { ProjectService } from "../project.service";

@Component({
  selector: "mxevolve-project-selector",
  templateUrl: "./project-selector.component.html",
  standalone: false,
})
export class ProjectSelectorComponent implements OnInit {
  projects: Project[];
  isLoading = false;

  constructor(
    private projectSelectorService: ProjectService,
    private store: Store,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.projectSelectorService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onProjectSelect(project: Project) {
    this.store.dispatch(GlobalActions.updateProject({ project }));
    this.router.navigate(["../app/", project.id], { relativeTo: this.route });
  }
}
