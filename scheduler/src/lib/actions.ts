'use server';

/**
 * Server actions for calendar events
 *
 * Handles creation of events and triggers cache revalidation
 * for calendar views after database updates.
 */

import prisma from "lib/prisma";
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth";

/**
 * Creates a new calendar event for the logged-in user.
 *
 * Extracts event data from FormData, saves it to the database,
 * and revalidates the calendar page cache.
 *
 * @param formData - Form data containing title, description, start, and end
 * @returns Success or error response object
 */
export async function addEventAction(formData: FormData) {
	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const startStr = formData.get('start') as string;
	const endStr = formData.get('end') as string;

	if (!title || !startStr || !endStr) return { error: "Missing fields" };

  	const session = await getServerSession();
	const userId = session.user.id;

	try {
		await prisma.event.create({
		data: {
				title,
				description,
				start: new Date(startStr),
				end: new Date(endStr),
				allDay: false,
				category: "GENERAL",
				user: {
				connect: { id: userId },
				},
			},
		});
		
		revalidatePath('/calendar');
		return { success: true };
	} catch (error) {
		console.error("Database Error:", error);
		return { error: "Failed to create event" };
	}
}
