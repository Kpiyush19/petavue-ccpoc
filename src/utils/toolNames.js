export const TOOL_DISPLAY_NAMES = {
  list_files: "Listing files",
  read_file: "Reading file",
  write_file: "Writing file",
  edit_file: "Editing file",
  delete_file: "Deleting file",
  download_s3_file: "Downloading file",
  query_athena: "Querying database",
  query_db: "Querying database",
  query_pg: "Querying Postgres",
  execute_code: "Running code",
  save_output: "Saving output",
  replay_downstream: "Replaying steps",
  trace_lineage: "Tracing lineage",
  todo_write: "Updating tasks",
  execute_step: "Executing step",
  read_step: "Reading step",
  edit_step: "Editing step",
  update_step: "Updating step",
  mark_step: "Marking step",
  run_code: "Running code",
};

export function formatToolName(name) {
  return TOOL_DISPLAY_NAMES[name] || name.replace(/_/g, " ");
}

export default formatToolName;
