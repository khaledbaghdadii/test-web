/**
 * Secondary entrypoint for Monaco-editor-dependent conflict resolution UI.
 *
 * Importing from `@mxflow/features/scm` must NOT transitively load Monaco,
 * otherwise every consumer (including pure-service consumers) pays the cost
 * and Jest/jsdom test environments break on Monaco's ESM + CSS/document APIs.
 *
 * Anything that (directly or transitively) imports `@mxflow/ui/monaco-editor`
 * belongs here, not in the main barrel.
 */
export * from "./lib/remote-cloned-repository/conflict-resolver/conflict-resolver.component";
export * from "./lib/rebase-workspace-container/rebase-workspace-container.component";
export * from "./lib/rebase-workspace-container/rebase-workspace-state.service";
export * from "./lib/conflict-file-tree-view/conflict-file-tree-view.component";
export * from "./lib/file-conflict-resolver/file-conflict-resolver.component";
export * from "./lib/conflict-resolution-workspace/conflict-resolution-workspace.component";
