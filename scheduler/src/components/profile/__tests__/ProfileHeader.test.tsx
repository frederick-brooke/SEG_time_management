import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileHeader from "../ProfileHeader";
import { sendFriendRequest, removeFriend, cancelSentRequest } from "@/app/actions/profile/friends";

jest.mock("@/app/actions/profile/friends", () => ({
  sendFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
  cancelSentRequest: jest.fn(),
}));

jest.mock("@/components/profile/UserAvatar", () => ({
  __esModule: true,
  default: () => <div data-testid="user-avatar" />,
}));

jest.mock("@/components/admin/report-modal", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="report-modal">
      <button onClick={onClose}>Close Report</button>
    </div>
  ),
}));

describe("ProfileHeader", () => {
  const mockProfile = {
    id: "user-123",
    username: "lunar_traveler",
    fname: "Neil",
    lname: "Armstrong",
    pfp: "moon.jpg",
    createdAt: "1969-07-20T20:17:00.000Z",
    friendStatus: "NONE",
  };

  const defaultProps = {
    profile: mockProfile,
    isOwnProfile: false,
    onEditToggle: jest.fn(),
    level: 10,
    xpBarWidth: 75,
    xpToNext: 250,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn();
  });

  it("renders basic profile information and joined date", () => {
    render(<ProfileHeader {...defaultProps} />);
    expect(screen.getByText("Neil Armstrong")).toBeInTheDocument();
    expect(screen.getByText("@lunar_traveler")).toBeInTheDocument();
    expect(screen.getByText("Joined 20/07/1969")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("250 XP left until next level")).toBeInTheDocument();
  });

  it("shows edit button only on own profile", () => {
    const { rerender } = render(<ProfileHeader {...defaultProps} isOwnProfile={true} />);
    expect(screen.getByTitle("Edit Profile")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Edit Profile"));
    expect(defaultProps.onEditToggle).toHaveBeenCalled();

    rerender(<ProfileHeader {...defaultProps} isOwnProfile={false} />);
    expect(screen.queryByTitle("Edit Profile")).not.toBeInTheDocument();
  });

  it("handles Add Friend action", async () => {
    render(<ProfileHeader {...defaultProps} />);
    const addBtn = screen.getByRole("button", { name: /Add Friend/i });
    fireEvent.click(addBtn);
    await waitFor(() => expect(sendFriendRequest).toHaveBeenCalledWith("user-123"));
  });

  it("handles Remove Friend action with confirmation", async () => {
    const profile = { ...mockProfile, friendStatus: "FRIENDS" };
    (window.confirm as jest.Mock).mockReturnValue(true);
    render(<ProfileHeader {...defaultProps} profile={profile} />);
    
    fireEvent.click(screen.getByText("Remove"));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(removeFriend).toHaveBeenCalledWith("user-123"));
  });

  it("aborts Remove Friend action if confirmation is declined", async () => {
    const profile = { ...mockProfile, friendStatus: "FRIENDS" };
    (window.confirm as jest.Mock).mockReturnValue(false);
    render(<ProfileHeader {...defaultProps} profile={profile} />);
    
    fireEvent.click(screen.getByText("Remove"));
    expect(removeFriend).not.toHaveBeenCalled();
  });

  it("handles Cancel Sent Request action", async () => {
    const profile = { ...mockProfile, friendStatus: "REQUEST_SENT" };
    render(<ProfileHeader {...defaultProps} profile={profile} />);
    
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(cancelSentRequest).toHaveBeenCalledWith("user-123"));
  });

  it("shows status for received requests", () => {
    const profile = { ...mockProfile, friendStatus: "REQUEST_RECEIVED" };
    render(<ProfileHeader {...defaultProps} profile={profile} />);
    expect(screen.getByText("Wants to be Friends")).toBeInTheDocument();
  });

  it("opens and closes the report modal", () => {
    render(<ProfileHeader {...defaultProps} />);
    fireEvent.click(screen.getByText(/Report/i));
    expect(screen.getByTestId("report-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Report"));
    expect(screen.queryByTestId("report-modal")).not.toBeInTheDocument();
  });

  it("renders username as fallback if fname is missing", () => {
    const profile = { ...mockProfile, fname: "" };
    render(<ProfileHeader {...defaultProps} profile={profile} />);
    expect(screen.getByText("lunar_traveler Armstrong")).toBeInTheDocument();
  });
});