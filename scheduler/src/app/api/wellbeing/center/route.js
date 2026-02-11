import { NextResponse } from "next/server";

const quote_link = "http://api.forismatic.com/api/1.0/"     
const max_length = 150;     //quotes longer than 200 characters are rejected
const max_attempts = 5;     //If more than 5 unsuccessful tries then show default instead

//accesses and returns the random quote from the external API 
async function fetchQuote(key) {
    const params = new URLSearchParams({
        //stores the parameter values needed to access the quote
        method: "getQuote", 
        format: "json",
        lang: "en",
    });

    if(key !== undefined) {
        params.append("key", key);  //constraint for access key definition
    }

    const res = await fetch(`${quote_link}?${params.toString()}`, {
        cache: "no-store",  //get fresh data by disabling cache for each request
    });

    if(!res.ok){
        return null;    //check and return null if the request failed
    }

    const text = await res.text();  //extracts raw data from returned response body

    try{
        return JSON.parse(text);   
    }
    catch{
        return null;    //returns null and failure if JSON parsing invalid
    }
}
//GET request for the quotes and enforces condition checking on it 
export async function GET() {
    let key = Math.floor(Math.random() * 100000); //generates random key

    //set 5 max attempts to fetch a valid quote
    for(let attempt = 0; attempt < max_attempts; attempt++){
        const data = await fetchQuote(key);   //fetch data using current key
        if (!data || !data.quoteText) {
            key++;      //if incorrect format then skip to the next key
            continue;   
        }       

        const quote = data.quoteText || ""; //extracts the needed quote data

        if(quote.length <= max_length){
            //must be less than 200 characters in length otherwise it is rejected
            return NextResponse.json({quote});
        }
        key++;  //look at the next quote in order until it meets conditions or attempts run out
    }

    const quote = 'You can do this!';     //default fallback quote if nothing else works
    return new Response(
        JSON.stringify({quote}),        //converts default quote into JSON string and returns it
        {
            headers: { "Content-Type" : "application/json"}
        }
    );
}