import { NextResponse } from "next/server";

const quote_link = "http://api.forismatic.com/api/1.0/"     
const max_length = 150;     // Quotes longer than 200 characters are rejected
const max_attempts = 5;     // If more than 5 unsuccessful tries then show default instead

/**
 * Fetches a random quote from the external Forismatic API.
 *
 * Behavior:
 * - Builds query parameters dynamically
 * - Disables caching to ensure fresh quotes
 * - Safely parses JSON response (handles malformed responses)
 *
 * @param {number} [key] - Optional key to influence quote selection
 * @returns {Promise<{ quoteText?: string } | null>} Parsed quote data or null on failure
 */
async function fetchQuote(key) {
    const params = new URLSearchParams({
        // Stores the parameter values needed to access the quote
        method: "getQuote", 
        format: "json",
        lang: "en",
    });

    if(key !== undefined) {
        params.append("key", key);  // Constraint for access key definition
    }

    // Get fresh data by disabling cache for each request
    const res = await fetch(`${quote_link}?${params.toString()}`, {
        cache: "no-store",
    });

    if(!res.ok) {
        return null;
    }

    const text = await res.text();

    try {
        return JSON.parse(text);   
    }
    catch {
        return null;
    }
}

/**
 * Retrieves a random quote with validation constraints.
 *
 * Behavior:
 * - Attempts multiple fetches (up to max_attempts)
 * - Skips invalid or malformed responses
 * - Enforces maximum quote length
 * - Falls back to a default quote if all attempts fail
 *
 * @returns {Promise<Response>} JSON response containing a valid quote
 */
export async function GET() {
    let key = Math.floor(Math.random() * 100000); // Generates random key

    // Set 5 max attempts to fetch a valid quote
    for(let attempt = 0; attempt < max_attempts; attempt++){
        const data = await fetchQuote(key);
        if (!data || !data.quoteText) {
            key++;
            continue;   
        }       

        const quote = data.quoteText || "";

        if(quote.length <= max_length){
            // Must be less than 200 characters in length otherwise it is rejected
            return NextResponse.json({quote});
        }
        key++;
    }

    // Default fallback quote
    const quote = 'You can do this!';
    return new Response(
        JSON.stringify({quote}),
        {
            headers: { "Content-Type" : "application/json"}
        }
    );
}