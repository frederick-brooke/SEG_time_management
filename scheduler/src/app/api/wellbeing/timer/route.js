import { NextResponse } from "next/server"
//backend handling of the wellbeing page

let endTime = null;     //reference the selected database later

export async function POST(req){
    const { durationMs } = await req.json();

    endTime = Date.now() + durationMs;

    return NextResponse.json({ endTime });
}

export async function GET(){
    return NextResponse.json({ endTime });
}
