/**
 * Event Mutations
 *
 * Handles updates and deletions for both single occurrences and full recurring
 * series, keeping the local Prisma database and Google Calendar in sync.
 */

import { prisma } from "@/lib/prisma";
import { getGoogleCalendarClient } from "@/lib/calendar/googleCalendar";
import { resetEventNotificationGuards } from "@/app/actions/calendar/calendarNotifications";

async function patchGoogleInstance(
	event: any,
	isoException: string,
	body: any,
	userId: string,
): Promise<string | null> {
	if (!event.googleEventId) return null;
	try {
		const calendar = await getGoogleCalendarClient(userId);
		if (!calendar) return null;
		const instanceId = `${event.googleEventId}_${isoException.replace(/[-:]/g, "").split(".")[0]}Z`;
		const gRes = await calendar.events.patch({
			calendarId: "primary",
			eventId: instanceId,
			requestBody: {
				summary: body.title || event.title,
				description: body.description || event.description,
				start: { dateTime: new Date(body.start).toISOString() },
				end: { dateTime: new Date(body.end).toISOString() },
			},
		});
		return gRes.data.id || null;
	} catch (err) {
		console.error("Google Instance Update Failed:", err);
		return null;
	}
}

async function createExceptionEvent(
	event: any,
	body: any,
	userId: string,
	googleEventId: string | null,
) {
	const {
		start,
		end,
		title,
		description,
		category,
		startCoords,
		destCoords,
		startLocationName,
		destLocationName,
		transportMode,
		travelDuration,
	} = body;
	return prisma.event.create({
		data: {
			title: title || event.title,
			description: description || event.description,
			start: new Date(start),
			end: new Date(end),
			userId,
			// Use the new category from the edit form, fall back to master event's category
			category: category || event.category,
			googleEventId,
			allDay: event.allDay,
			startCoords: startCoords ?? event.startCoords,
			destinationCoords: destCoords ?? event.destinationCoords,
			travelDuration: travelDuration
				? Math.round(travelDuration)
				: event.travelDuration,
			transportMode: transportMode || event.transportMode,
			startLocationName: startLocationName || event.startLocationName,
			destLocationName: destLocationName || event.destLocationName,
		},
	});
}

function calcSeriesTimes(
	event: any,
	body: any,
): { updatedSeriesStart: Date; updatedSeriesEnd: Date } {
	const newDateReq = new Date(body.start);
	const newEndDateReq = new Date(body.end);
	const originalMasterStart = new Date(event.start);
	const duration = newEndDateReq.getTime() - newDateReq.getTime();
	const updatedSeriesStart = new Date(originalMasterStart);
	updatedSeriesStart.setHours(
		newDateReq.getHours(),
		newDateReq.getMinutes(),
		0,
		0,
	);
	const updatedSeriesEnd = new Date(updatedSeriesStart.getTime() + duration);
	return { updatedSeriesStart, updatedSeriesEnd };
}

function patchGoogleSeries(
	updated: any,
	updatedSeriesStart: Date,
	updatedSeriesEnd: Date,
	userId: string,
): void {
	if (!updated.googleEventId) return;
	(async () => {
		try {
			const calendar = await getGoogleCalendarClient(userId);
			if (!calendar) return;
			const isAllDay =
				updated.allDay ||
				(updatedSeriesStart.getHours() === 0 &&
					updatedSeriesStart.getMinutes() === 0 &&
					updatedSeriesEnd.getHours() === 0 &&
					updatedSeriesEnd.getMinutes() === 0);
			const start = isAllDay
				? {
						date: updatedSeriesStart.toISOString().split("T")[0],
						timeZone: "UTC",
					}
				: {
						dateTime: updatedSeriesStart.toISOString(),
						timeZone: "UTC",
					};
			const end = isAllDay
				? {
						date: updatedSeriesEnd.toISOString().split("T")[0],
						timeZone: "UTC",
					}
				: { dateTime: updatedSeriesEnd.toISOString(), timeZone: "UTC" };
			await calendar.events.patch({
				calendarId: "primary",
				eventId: updated.googleEventId!,
				requestBody: {
					summary: updated.title,
					description: updated.description || "",
					start,
					end,
				},
			});
		} catch (err) {
			console.error("Google Series Update Failed:", err);
		}
	})();
}

export async function handleSingleInstanceUpdate(
	event: any,
	body: any,
	userId: string,
) {
	const isoException = new Date(body.originalDate).toISOString();
	await prisma.event.update({
		where: { id: event.id },
		data: { exceptions: { push: isoException } },
	});
	const googleEventId = await patchGoogleInstance(
		event,
		isoException,
		body,
		userId,
	);
	return createExceptionEvent(event, body, userId, googleEventId);
}

export async function handleSeriesUpdate(
	event: any,
	body: any,
	userId: string,
) {
	const {
		id,
		category,
		startCoords,
		destCoords,
		startLocationName,
		destLocationName,
		transportMode,
		travelDuration,
		title,
		description,
	} = body;
	const { updatedSeriesStart, updatedSeriesEnd } = calcSeriesTimes(
		event,
		body,
	);

	const updated = await prisma.event.update({
		where: { id },
		data: {
			title: title || undefined,
			description: description || undefined,
			// Save the updated category — this was previously missing
			category: category || undefined,
			start: updatedSeriesStart,
			end: updatedSeriesEnd,
			startCoords: startCoords ?? null,
			destinationCoords: destCoords ?? null,
			travelDuration: travelDuration ? Math.round(travelDuration) : null,
			startLocationName: startLocationName ?? null,
			destLocationName: destLocationName ?? null,
			transportMode,
			travelNotifiedAt: null,
			eventNotifiedAt: null,
		},
	});

	patchGoogleSeries(updated, updatedSeriesStart, updatedSeriesEnd, userId);
	return updated;
}
