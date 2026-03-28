/**
 * Testing for modules/[moduleId] page.
 */

import { render, screen } from "@testing-library/react";
import ModuleDetailPage from "../page";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { 
  getModuleDetails, 
  getModuleEvents, 
  getModuleTasks, 
  getModuleTasksWithProgress 
} from "@/app/actions/module";


// Mocks

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => { throw new Error("NEXT_REDIRECT"); }),
}));

jest.mock("@/app/actions/module", () => ({
  getModuleDetails: jest.fn(),
  getModuleEvents: jest.fn(),
  getModuleTasks: jest.fn(),
  getModuleTasksWithProgress: jest.fn(),
}));

jest.mock("../ModuleDetailClient", () => ({
  __esModule: true,
  default: ({ events, tasks, tasksWithProgress }: any) => (
    <div data-testid="module-detail-client">
      Events: {events?.length || 0} | 
      Tasks: {tasks?.length || 0} | 
      ProgressTasks: {tasksWithProgress?.length || 0}
    </div>
  ),
}));


// Tests

describe("ModuleDetailPage (Server Component)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockParams = Promise.resolve({ moduleId: "mod123" });

  it("redirects to /login if no session or email is found", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);

    await expect(ModuleDetailPage({ params: mockParams })).rejects.toThrow("NEXT_REDIRECT");
    
    expect(redirect).toHaveBeenCalledWith("/login");
    expect(getModuleDetails).not.toHaveBeenCalled(); 
  });

  it("renders 'Module not found' UI if module does not exist", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "student@lunar.com" },
    });
    
    (getModuleDetails as jest.Mock).mockResolvedValueOnce(null);

    const ui = await ModuleDetailPage({ params: mockParams });
    render(ui);

    expect(screen.getByText("Module not found")).toBeInTheDocument();
    expect(getModuleEvents).not.toHaveBeenCalled();
  });

  it("fetches advanced progress data when user is an OWNER", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "prof@lunar.com" },
    });
    
    (getModuleDetails as jest.Mock).mockResolvedValueOnce({ userRole: "OWNER" });
    (getModuleEvents as jest.Mock).mockResolvedValueOnce([{ id: "e1" }]);
    (getModuleTasksWithProgress as jest.Mock).mockResolvedValueOnce([{ id: "t1" }, { id: "t2" }]);

    const ui = await ModuleDetailPage({ params: mockParams });
    render(ui);

    expect(getModuleEvents).toHaveBeenCalledWith("mod123");
    expect(getModuleTasksWithProgress).toHaveBeenCalledWith("mod123");
    expect(getModuleTasks).not.toHaveBeenCalled(); 

    expect(screen.getByTestId("module-detail-client")).toBeInTheDocument();
    expect(screen.getByText("Events: 1 | Tasks: 0 | ProgressTasks: 2")).toBeInTheDocument();
  });

  it("fetches standard task data when user is a standard MEMBER", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: "student@lunar.com" },
    });
    
    (getModuleDetails as jest.Mock).mockResolvedValueOnce({ userRole: "MEMBER" });
    (getModuleEvents as jest.Mock).mockResolvedValueOnce([{ id: "e1" }]);
    (getModuleTasks as jest.Mock).mockResolvedValueOnce([{ id: "t1" }]);

    const ui = await ModuleDetailPage({ params: mockParams });
    render(ui);

    expect(getModuleEvents).toHaveBeenCalledWith("mod123");
    expect(getModuleTasks).toHaveBeenCalledWith("mod123");
    expect(getModuleTasksWithProgress).not.toHaveBeenCalled(); 

    expect(screen.getByTestId("module-detail-client")).toBeInTheDocument();
    expect(screen.getByText("Events: 1 | Tasks: 1 | ProgressTasks: 0")).toBeInTheDocument();
  });
});