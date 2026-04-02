import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProfileStats } from "../StatModules";

// Mocks

// Mock the Lucide icons to keep the DOM output clean and avoid SVG rendering issues during tests
jest.mock("lucide-react", () => ({
  Trophy: () => <svg data-testid="trophy-icon" />,
  Star: () => <svg data-testid="star-icon" />,
  Zap: () => <svg data-testid="zap-icon" />,
}));

// Helpers

/**
 * Helper function to generate a mock profile object with default stats.
 * Allows passing overrides to easily test different mathematical states (like XP or streaks).
 * * @param {object} overrides - Specific progress or stats properties to override.
 * @return {object} A mock profile object ready to be passed as a prop.
 */
const makeProfile = (overrides: any = {}) => ({
  progress: {
    level: 1,
    experience: 0,
    ...(overrides.progress || {}),
  },
  stats: {
    streak: 0,
    completionRate: 0,
    ...(overrides.stats || {}),
  },
});

// Tests

describe("ProfileStats", () => {
  
  /**
   * Ensures the component doesn't crash if the backend returns a completely empty profile
   * without progress or stats objects, and correctly falls back to Level 1 and 0 values.
   */
  it("renders default fallback values when profile is completely empty", () => {
    render(<ProfileStats profile={{}} />);
    
    // Check fallback text values
    expect(screen.getByText("Lvl 1")).toBeInTheDocument();
    expect(screen.getByText(/100 XP.*Lvl 2/i)).toBeInTheDocument();
    
    // Check fallback stat numbers (Streak and Success Rate both default to 0)
    const zeroes = screen.getAllByText("0");
    expect(zeroes.length).toBeGreaterThanOrEqual(2); 
  });

  /**
   * Ensures that when standard data is passed in, the Streak and Success Rate 
   * cards display the exact numbers provided by the profile object.
   */
  it("renders the correct streak and success rate from the profile stats", () => {
    const profile = makeProfile({
      stats: { streak: 15, completionRate: 85 }
    });
    render(<ProfileStats profile={profile} />);
    
    expect(screen.getByText("15")).toBeInTheDocument(); // Streak
    expect(screen.getByText("85")).toBeInTheDocument(); // Success Rate
    expect(screen.getByText("Day Streak")).toBeInTheDocument();
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
  });

  /**
   * Ensures the component correctly calculates how much XP is left to the next level 
   * when the user is partially through a level (e.g., Level 3, 250 total points).
   */
  it("calculates the correct XP remainder when the user is mid-level", () => {
    const profile = makeProfile({
      progress: { level: 3, experience: 250 }
    });
    render(<ProfileStats profile={profile} />);
    
    expect(screen.getByText("Lvl 3")).toBeInTheDocument();
    expect(screen.getByText(/250\s*XP/i)).toBeInTheDocument();
    
    // 250 total points means 50 points into the current level.
    // 100 - 50 = 50 XP remaining until Level 4.
    expect(screen.getByText(/50 XP.*Lvl 4/i)).toBeInTheDocument();
  });

  /**
   * Ensures the math doesn't break when a user lands exactly on a level boundary 
   * (e.g., exactly 300 points), which should mean 0 progress into the level and 100 XP to the next.
   */
  it("calculates the correct XP remainder when points land exactly on a level boundary", () => {
    const profile = makeProfile({
      progress: { level: 4, experience: 300 }
    });
    render(<ProfileStats profile={profile} />);
    
    expect(screen.getByText("Lvl 4")).toBeInTheDocument();
    expect(screen.getByText(/300\s*XP/i)).toBeInTheDocument();
    
    // 300 total points modulo 100 is 0. 
    // 100 - 0 = 100 XP remaining until Level 5.
    expect(screen.getByText(/100 XP.*Lvl 5/i)).toBeInTheDocument();
  });

});