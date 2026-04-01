'use server'

/**
 * Location service (server actions)
 *
 * Handles updating and managing a user's geolocation data
 * including coordinates, optional city/country metadata,
 * and privacy controls for location visibility.
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Input payload for updating a user's location.
 */
export interface UpdateUserLocationInput {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  locationHidden: boolean;
}

/**
 * Updates the authenticated user's location data.
 *
 * Validates coordinates, stores geolocation and metadata,
 * and updates privacy setting for location visibility.
 *
 * @param input - User location payload
 * @returns Success state or error message
 */
export async function updateUserLocation(input: UpdateUserLocationInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const { latitude, longitude, city, country, locationHidden } = input;

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error("Invalid coordinates");
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error("Longitude must be between -180 and 180");
    }

    // Update user location
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        location: {
          lat: latitude,
          lng: longitude,
        },
        city: city || null,
        country: country || null,
        locationHidden,
      },
    });

    // Revalidate relevant paths
    revalidatePath("/map");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update location";
    return { success: false, error: message };
  }
}

/**
 * Updates only the user's location visibility setting.
 *
 * @param locationHidden - Whether the user hides their location
 * @returns Success state or error message
 */
export async function updateLocationHidden(locationHidden: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { locationHidden },
    });

    revalidatePath("/map");
    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update location visibility";
    return { success: false, error: message };
  }
}
