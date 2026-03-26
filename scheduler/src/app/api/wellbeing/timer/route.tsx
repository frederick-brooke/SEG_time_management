import { NextResponse } from "next/server"
//backend handling of the wellbeing page

let endTime = null;     //reference the selected database later

/**
 * Starts or updates the wellbeing timer.
 *
 * Behavior:
 * - Accepts a duration in milliseconds
 * - Calculates and stores the timer end time
 *
 * @param {Request} req - Incoming request containing durationMs
 * @returns {Promise<NextResponse>} JSON response with calculated endTime
 */

export async function POST(req){
    const { durationMs } = await req.json();

    endTime = Date.now() + durationMs;

    return NextResponse.json({ endTime });
}

/**
 * Retrieves the current timer end time.
 *
 * Behavior:
 * - Returns the stored endTime
 * - If no timer is set, returns null
 *
 * @returns {Promise<NextResponse>} JSON response with endTime
 */
export async function GET(){
    return NextResponse.json({ endTime });
}
