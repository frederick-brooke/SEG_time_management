/**
 * Wellbeing timer API
 * Stores a temporary in-memory countdown end time for the current server instance
 */

import { NextResponse } from "next/server"

let endTime = null;

/**
 * Starts or updates the wellbeing timer.
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
 * @returns {Promise<NextResponse>} JSON response with endTime
 */
export async function GET(){
    return NextResponse.json({ endTime });
}
