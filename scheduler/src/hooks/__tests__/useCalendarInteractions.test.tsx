// useCalendarInteractions.test.ts
import { renderHook } from "@testing-library/react";
import { useCalendarInteractions } from "../useCalendarInteractions";
import { useUndoDelete } from "../use-calendar-interactions-helpers/useUndoDelete";
import { useEventSearch } from "../use-calendar-interactions-helpers/useEventSearch";
import { useEventDelete } from "../use-calendar-interactions-helpers/useEventDelete";
import { useTaskDelete } from "../use-calendar-interactions-helpers/useTaskDelete";
import { useTaskEdit } from "../use-calendar-interactions-helpers/useTaskEdit";

jest.mock("../use-calendar-interactions-helpers/useUndoDelete");
jest.mock("../use-calendar-interactions-helpers/useEventSearch");
jest.mock("../use-calendar-interactions-helpers/useEventDelete");
jest.mock("../use-calendar-interactions-helpers/useTaskDelete");
jest.mock("../use-calendar-interactions-helpers/useTaskEdit");

const mockUseUndoDelete = useUndoDelete as jest.Mock;
const mockUseEventSearch = useEventSearch as jest.Mock;
const mockUseEventDelete = useEventDelete as jest.Mock;
const mockUseTaskDelete = useTaskDelete as jest.Mock;
const mockUseTaskEdit = useTaskEdit as jest.Mock;

const UNDO_VALUES = { showUndo: false, handleUndo: jest.fn(), triggerUndo: jest.fn(), dismissUndo: jest.fn() };
const SEARCH_VALUES = { searchQuery: "", searchResults: [], showSearchResults: false, handleSearch: jest.fn(), clearSearch: jest.fn(), showSearchResultsFor: jest.fn() };
const TASK_EDIT_VALUES = { isTaskEditOpen: false, setIsTaskEditOpen: jest.fn(), taskFormData: {}, setTaskFormData: jest.fn(), openTaskEdit: jest.fn(), submitTaskEdit: jest.fn() };
const DELETE_EVENT_FN = jest.fn();
const DELETE_TASK_FN = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseUndoDelete.mockReturnValue(UNDO_VALUES);
  mockUseEventSearch.mockReturnValue(SEARCH_VALUES);
  mockUseEventDelete.mockReturnValue(DELETE_EVENT_FN);
  mockUseTaskDelete.mockReturnValue(DELETE_TASK_FN);
  mockUseTaskEdit.mockReturnValue(TASK_EDIT_VALUES);
});

function setup() {
  const refreshEvents = jest.fn().mockResolvedValue([]);
  const refreshTasks = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() =>
    useCalendarInteractions([], refreshEvents, refreshTasks),
  );
  return { result, refreshEvents, refreshTasks };
}

// ── sub-hook wiring ────

describe("sub-hook wiring", () => {
  it("passes refreshEvents to useUndoDelete", () => {
    const { refreshEvents } = setup();
    expect(mockUseUndoDelete).toHaveBeenCalledWith(refreshEvents);
  });

  it("passes refreshEvents and triggerUndo to useEventDelete", () => {
    const { refreshEvents } = setup();
    expect(mockUseEventDelete).toHaveBeenCalledWith(refreshEvents, UNDO_VALUES.triggerUndo);
  });

  it("passes refreshTasks to useTaskDelete", () => {
    const { refreshTasks } = setup();
    expect(mockUseTaskDelete).toHaveBeenCalledWith(refreshTasks);
  });

  it("passes refreshTasks to useTaskEdit", () => {
    const { refreshTasks } = setup();
    expect(mockUseTaskEdit).toHaveBeenCalledWith(refreshTasks);
  });

  it("calls useEventSearch with no arguments", () => {
    setup();
    expect(mockUseEventSearch).toHaveBeenCalledWith();
  });
});

// ── return value ───────

describe("return value", () => {
  it("exposes undo values", () => {
    const { result } = setup();
    expect(result.current.showUndo).toBe(UNDO_VALUES.showUndo);
    expect(result.current.handleUndo).toBe(UNDO_VALUES.handleUndo);
    expect(result.current.dismissUndo).toBe(UNDO_VALUES.dismissUndo);
  });

  it("does not expose triggerUndo", () => {
    const { result } = setup();
    expect(result.current).not.toHaveProperty("triggerUndo");
  });

  it("exposes search values", () => {
    const { result } = setup();
    expect(result.current.searchQuery).toBe(SEARCH_VALUES.searchQuery);
    expect(result.current.handleSearch).toBe(SEARCH_VALUES.handleSearch);
    expect(result.current.clearSearch).toBe(SEARCH_VALUES.clearSearch);
  });

  it("exposes deleteEvent and deleteTask", () => {
    const { result } = setup();
    expect(result.current.deleteEvent).toBe(DELETE_EVENT_FN);
    expect(result.current.deleteTask).toBe(DELETE_TASK_FN);
  });

  it("exposes task edit values", () => {
    const { result } = setup();
    expect(result.current.isTaskEditOpen).toBe(TASK_EDIT_VALUES.isTaskEditOpen);
    expect(result.current.openTaskEdit).toBe(TASK_EDIT_VALUES.openTaskEdit);
    expect(result.current.submitTaskEdit).toBe(TASK_EDIT_VALUES.submitTaskEdit);
  });
});