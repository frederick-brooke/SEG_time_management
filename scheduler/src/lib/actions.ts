// scheduler/src/lib/actions.ts
'use server';

import prisma from "lib/prisma";
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth";

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
