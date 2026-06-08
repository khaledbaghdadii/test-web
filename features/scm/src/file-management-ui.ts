/**
 * Secondary entrypoint for Monaco-dependent file management UI.
 * Keep out of the main barrel to avoid breaking Jest/jsdom consumers.
 */
export * from "./lib/file-management-workspace/file-management-workspace.component";
