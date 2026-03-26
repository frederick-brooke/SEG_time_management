import { render, screen, fireEvent } from "@testing-library/react";
import { AvatarCard } from "../ShopCards";
import type { ShopItem } from "../shop.types";

// Mock the image catalogue to prevent actual image requests
jest.mock("@/lib/shop-catalogue", () => ({
  AVATAR_IMAGES: {
    avatar1: "/mock-avatar-1.png",
  },
}));

describe("AvatarCard Component", () => {
  const mockItem: ShopItem = {
    id: "item-1",
    name: "Cosmic Voyager",
    description: "A traveler of the stars.",
    type: "AVATAR",
    price: 500,
    value: "avatar1",
    icon: "🚀",
    rarity: "legendary",
    owned: false,
    canAfford: true,
  };

  const mockProps = {
    equippedAvatar: null,
    onPurchase: jest.fn(),
    onEquip: jest.fn(),
    onUnequip: jest.fn(),
    isPending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders item details and price correctly", () => {
    render(<AvatarCard item={mockItem} {...mockProps} />);
    
    expect(screen.getByText("Cosmic Voyager")).toBeInTheDocument();
    expect(screen.getByText("A traveler of the stars.")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument(); // Price
    expect(screen.getByText("Legendary")).toBeInTheDocument(); // Rarity badge
  });

  it("renders 'Buy' button when item is not owned and affordable", () => {
    render(<AvatarCard item={mockItem} {...mockProps} />);
    
    const buyButton = screen.getByRole("button", { name: /buy/i });
    expect(buyButton).toBeEnabled();
    
    fireEvent.click(buyButton);
    expect(mockProps.onPurchase).toHaveBeenCalledWith(mockItem.id);
  });

  it("renders 'Too expensive' disabled button when user cannot afford it", () => {
    render(<AvatarCard item={{ ...mockItem, canAfford: false }} {...mockProps} />);
    
    const button = screen.getByRole("button", { name: /too expensive/i });
    expect(button).toBeDisabled();
  });

  it("renders 'Equip' button when item is owned but not equipped", () => {
    render(<AvatarCard item={{ ...mockItem, owned: true }} {...mockProps} />);
    
    const equipButton = screen.getByRole("button", { name: /equip/i });
    expect(screen.getByText("Owned")).toBeInTheDocument(); // Badge
    
    fireEvent.click(equipButton);
    expect(mockProps.onEquip).toHaveBeenCalledWith(mockItem.id);
  });

  it("renders 'Unequip' button when item is currently equipped", () => {
    render(<AvatarCard item={{ ...mockItem, owned: true }} {...mockProps} equippedAvatar="avatar1" />);
    
    const unequipButton = screen.getByRole("button", { name: /unequip/i });
    expect(screen.getByText(/equipped/i)).toBeInTheDocument(); // Badge
    
    fireEvent.click(unequipButton);
    expect(mockProps.onUnequip).toHaveBeenCalled();
  });

  it("disables all actions when isPending is true", () => {
    render(<AvatarCard item={mockItem} {...mockProps} isPending={true} />);
    
    const buyButton = screen.getByRole("button", { name: /buy/i });
    expect(buyButton).toBeDisabled();
  });
});