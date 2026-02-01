import { NextResponse } from "next/server";

const quote_link = "http://api.forismatic.com/api/1.0/" 
const max_length = 200;
const max_attempts = 5;

async function fetchQuote(key) {
    const params = new URLSearchParams({
        method: "getQuote",
        format: "json",
        lang: "en",
    });

    if(key !== undefined) {
        params.append("key", key);
    }

    const res = await fetch(`${quote_link}?${params.toString()}`, {
        cache: "no-store",
    });

    if(!res.ok){
        return null;
    }

    return res.json();
}

export async function GET() {
    let key = Math.floor(Math.random() * 100000);

    for(let attempt = 0; attempt < max_attempts; attempt++){
        const data = await fetchQuote(key);
        const quote = data.quoteText || "";

        if(quote.length <= max_length){
            return NextResponse.json({quote});
        }
        key++;
    }

    return NextResponse.json({
        quote: "You can do this!"
    });
}