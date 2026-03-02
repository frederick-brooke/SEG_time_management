import { render, screen } from "@testing-library/react";
import ProfilePageClient from "./ProfilePageClient";

// 1. Mock Next.js and React features so they don't break the test
jest.mock("next/link", () => ({ children, href }: any) => (
  <a href={href}>{children}</a>
));
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: () => ({ pending: false }),
}));
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useTransition: () => [false, jest.fn()],
}));

// Mock the Sidebar components so they don't cause context errors
jest.mock("../../components/animate-ui/components/radix/sidebar", () => ({
  SidebarProvider: ({ children }: any) => <div>{children}</div>,
  SidebarInset: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("../../components/app-sidebar", () => ({
  AppSidebar: () => <nav>Sidebar</nav>,
}));
jest.mock("../../components/site-header", () => ({
  SiteHeader: () => <header>Header</header>,
}));

// 2. Fake Profile Data
const mockProfile = {
  id: "123",
  username: "testuser",
  fname: "Test",
  lname: "User",
  bio: "Hello world!",
  createdAt: "2023-01-01T00:00:00.000Z",
  stats: {
    streak: 12,
    friendCount: 5,
    completedTasks: 40,
    totalTasks: 50,
    completionRate: 80,
  },
  friends: [],
  receivedRequests: [],
};

describe("ProfilePageClient Component", () => {
  it("renders the user information and stats correctly", () => {
    render(
      <ProfilePageClient profile={mockProfile} isOwnProfile={false} rank={3} />,
    );

    // Check names and bio
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("Hello world!")).toBeInTheDocument();

    // Check Stats
    expect(screen.getByText("12")).toBeInTheDocument(); // Streak
    expect(screen.getByText("Day Streak")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument(); // Completion Rate

    // Check Rank link
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText(/on leaderboard/i)).toBeInTheDocument();
  });

  it("shows the Edit Profile form only if it is the users own profile", () => {
    const { rerender } = render(
      <ProfilePageClient profile={mockProfile} isOwnProfile={true} />,
    );

    // Should see the edit form
    expect(screen.getByText("Edit Profile Details")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test")).toBeInTheDocument(); // First name input

    // Rerender as someone else's profile
    rerender(<ProfilePageClient profile={mockProfile} isOwnProfile={false} />);

    // Form should disappear
    expect(screen.queryByText("Edit Profile Details")).not.toBeInTheDocument();
  });
});
