//tests for scheduler/src/components/profile/ProfileBio.tsx
import { render, screen } from "@testing-library/react";
import ProfileBio from "../ProfileBio";

describe("ProfileBio", () => {
  it("renders the user bio when provided", () => {
    const testBio = "This is a test biography.";
    render(<ProfileBio bio={testBio} isOwnProfile={false} />);
    
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText(testBio)).toBeInTheDocument();
  });

  it("renders 'About Me' and specific empty state for own profile", () => {
    render(<ProfileBio bio={null} isOwnProfile={true} />);
    
    expect(screen.getByText("About Me")).toBeInTheDocument();
    expect(
      screen.getByText(/No bio written yet. Click 'Edit Profile' to add one!/i)
    ).toBeInTheDocument();
  });

  it("renders 'About' and specific empty state for another user's profile", () => {
    render(<ProfileBio bio={undefined} isOwnProfile={false} />);
    
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText(/No bio yet./i)).toBeInTheDocument();
  });

  it("renders the Lucide Quote icon", () => {
    const { container } = render(<ProfileBio bio="Bio" isOwnProfile={true} />);
    const icon = container.querySelector(".lucide-quote");
    expect(icon).toBeInTheDocument();
  });
});