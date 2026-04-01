import { render, screen, waitFor, act } from "@testing-library/react";


// Mocks

let mockHighlightParam: string | null = null;

const useSessionMock = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: (...a: any[]) => useSessionMock(...a),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (key: string) => key === "highlight" ? mockHighlightParam : null }),
}));

jest.mock("@tabler/icons-react", () =>
  new Proxy({}, { get: () => () => null })
);

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/landing/HeroSection", () => ({
  StarField: () => <div data-testid="star-field" />,
}));

jest.mock("@/components/tasks/ToDoList", () => ({
  ToDoList: ({ userId, exams, highlightId }: any) => (
    <div>
      <div data-testid="todo-list">ToDoList</div>
      <div data-testid="todo-user-id">{userId}</div>
      <div data-testid="todo-exam-count">{exams?.length ?? 0}</div>
      {highlightId && <div data-testid="todo-highlight">{highlightId}</div>}
    </div>
  ),
}));

const getMyExamsMock = jest.fn();

jest.mock("@/app/actions/examActions", () => ({
  getMyExams: (...a: any[]) => getMyExamsMock(...a),
}));

import TasksPage from "../page";

function setAuth(status = "authenticated", id = "u1") {
  useSessionMock.mockReturnValue({
    data: status === "authenticated" ? { user: { id } } : null,
    status,
  });
}


// Tests

describe("TasksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockHighlightParam = null;
    getMyExamsMock.mockResolvedValue([]);
    setAuth();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Loading state

  it("renders the loading state while session status is loading", () => {
    useSessionMock.mockReturnValue({ data: null, status: "loading" });
    render(<TasksPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // Unauthenticated state

  it("renders the login prompt when session is null", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<TasksPage />);
    expect(screen.getByText("Please log in to view your tasks.")).toBeInTheDocument();
  });

  it("renders the login prompt when session has no user", () => {
    useSessionMock.mockReturnValue({ data: {}, status: "authenticated" });
    render(<TasksPage />);
    expect(screen.getByText("Please log in to view your tasks.")).toBeInTheDocument();
  });

  // Authenticated render

  it("renders ToDoList when authenticated", async () => {
    render(<TasksPage />);
    expect(await screen.findByTestId("todo-list")).toBeInTheDocument();
  });

  it("passes the correct userId to ToDoList", async () => {
    setAuth("authenticated", "user-99");
    render(<TasksPage />);
    expect(await screen.findByTestId("todo-user-id")).toHaveTextContent("user-99");
  });

  it("renders the StarField background element", async () => {
    render(<TasksPage />);
    expect(await screen.findByTestId("star-field")).toBeInTheDocument();
  });

  // Exam fetching

  it("fetches exams and passes them to ToDoList", async () => {
    getMyExamsMock.mockResolvedValue([{ id: "e1" }, { id: "e2" }]);
    render(<TasksPage />);
    await waitFor(() =>
      expect(screen.getByTestId("todo-exam-count")).toHaveTextContent("2")
    );
  });

  it("passes an empty exam list when no exams are returned", async () => {
    getMyExamsMock.mockResolvedValue([]);
    render(<TasksPage />);
    await waitFor(() =>
      expect(screen.getByTestId("todo-exam-count")).toHaveTextContent("0")
    );
  });

  it("does not call getMyExams when session user id is absent", async () => {
    useSessionMock.mockReturnValue({ data: { user: { id: null } }, status: "authenticated" });
    render(<TasksPage />);
    await screen.findByTestId("todo-list");
    expect(getMyExamsMock).not.toHaveBeenCalled();
  });

  // Highlight param

  it("passes highlightId to ToDoList when the highlight search param is set", async () => {
    mockHighlightParam = "task-42";
    render(<TasksPage />);
    expect(await screen.findByTestId("todo-highlight")).toHaveTextContent("task-42");
  });

  it("clears highlightId after 3 seconds", async () => {
    jest.useRealTimers();
    mockHighlightParam = "task-42";
    render(<TasksPage />);
    expect(await screen.findByTestId("todo-highlight")).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByTestId("todo-highlight")).not.toBeInTheDocument(),
      { timeout: 4000 }
    );
  });

  it("does not set highlightId when no highlight param is present", async () => {
    mockHighlightParam = null;
    render(<TasksPage />);
    await screen.findByTestId("todo-list");
    expect(screen.queryByTestId("todo-highlight")).not.toBeInTheDocument();
  });
});