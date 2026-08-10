import {
  projectSortFields,
  projectStatuses,
  type ProjectListState,
  type ProjectSortField,
  type SortDirection,
  type StatusFilter,
} from "../../domain/project";

export const defaultProjectListState: ProjectListState = {
  search: "",
  status: "All statuses",
  sort: "updatedAt",
  direction: "desc",
  page: 1,
};

function isStatus(value: string | null): value is StatusFilter {
  return value === "All statuses" || projectStatuses.some((item) => item === value);
}

function isSortField(value: string | null): value is ProjectSortField {
  return projectSortFields.some((item) => item === value);
}

function isDirection(value: string | null): value is SortDirection {
  return value === "asc" || value === "desc";
}

export function readProjectListState(searchParams: URLSearchParams): ProjectListState {
  const status = searchParams.get("status");
  const sort = searchParams.get("sort");
  const direction = searchParams.get("direction");
  const rawPage = Number(searchParams.get("page"));

  return {
    search: searchParams.get("q") ?? "",
    status: isStatus(status) ? status : defaultProjectListState.status,
    sort: isSortField(sort) ? sort : defaultProjectListState.sort,
    direction: isDirection(direction)
      ? direction
      : defaultProjectListState.direction,
    page: Number.isInteger(rawPage) && rawPage > 0
      ? rawPage
      : defaultProjectListState.page,
  };
}

export function writeProjectListState(state: ProjectListState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.search.trim()) params.set("q", state.search.trim());
  if (state.status !== defaultProjectListState.status) {
    params.set("status", state.status);
  }
  if (state.sort !== defaultProjectListState.sort) params.set("sort", state.sort);
  if (state.direction !== defaultProjectListState.direction) {
    params.set("direction", state.direction);
  }
  if (state.page > 1) params.set("page", String(state.page));

  return params;
}
