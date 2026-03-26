import {
    updateUserLocation,
    updateLocationHidden,
  } from "@/app/actions/update-user-location";
  
  import { getServerSession } from "next-auth";
  import { prisma } from "@/lib/prisma";
  import { revalidatePath } from "next/cache";

  
  jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
  }));
  
  jest.mock("@/lib/prisma", () => ({
    prisma: {
      user: {
        update: jest.fn(),
      },
    },
  }));
  
  jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
  }));
  
  const mockSession = {
    user: { id: "user-1" },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });
  
  
  describe("updateUserLocation", () => {
    it("updates location successfully", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});
  
      const res = await updateUserLocation({
        latitude: 10,
        longitude: 20,
        city: "London",
        country: "UK",
        locationHidden: false,
      });
  
      expect(res).toEqual({ success: true });
  
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          location: { lat: 10, lng: 20 },
          city: "London",
          country: "UK",
          locationHidden: false,
        },
      });
  
      expect(revalidatePath).toHaveBeenCalledWith("/map");
      expect(revalidatePath).toHaveBeenCalledWith("/settings");
    });
  
    it("returns error if latitude is invalid", async () => {
      const res = await updateUserLocation({
        latitude: 999,
        longitude: 20,
        city: null,
        country: null,
        locationHidden: false,
      });
  
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Latitude must be between/);
    });
  
    it("returns error if longitude is invalid", async () => {
      const res = await updateUserLocation({
        latitude: 10,
        longitude: 999,
        city: null,
        country: null,
        locationHidden: false,
      });
  
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Longitude must be between/);
    });
  
    it("returns unauthorized if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);
  
      const res = await updateUserLocation({
        latitude: 10,
        longitude: 20,
        city: null,
        country: null,
        locationHidden: false,
      });
  
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized");
    });
  });
  
  
  describe("updateLocationHidden", () => {
    it("updates locationHidden successfully", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});
  
      const res = await updateLocationHidden(true);
  
      expect(res).toEqual({ success: true });
  
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { locationHidden: true },
      });
  
      expect(revalidatePath).toHaveBeenCalledWith("/map");
      expect(revalidatePath).toHaveBeenCalledWith("/settings");
    });
  
    it("returns error when unauthorized", async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);
  
      const res = await updateLocationHidden(false);
  
      expect(res.success).toBe(false);
      expect(res.error).toBe("Unauthorized");
    });
  
    it("returns generic error on failure", async () => {
      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error("DB failure")
      );
  
      const res = await updateLocationHidden(false);
  
      expect(res.success).toBe(false);
      expect(res.error).toBe("DB failure");
    });
  });