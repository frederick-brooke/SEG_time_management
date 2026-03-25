"use client";

import React, { useEffect, useState } from "react";
import { LunarCard } from "../ui/lunar-card";
import { A } from "@faker-js/faker/dist/airline-Dz1uGqgJ";

export function CalendarEvents() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getEvents() {
            try {
                const res = await fetch("/api/calendar/events");
                const data = await res.json();

                const now = new Date();
                const weekOut = new Date();
                weekOut.setDate(now.getDate() + 7);

                const filtered = data
                    .filter((e: any) => new Date(e.start) >= now && new Date(e.start) <= weekOut)
                    .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .slice(0, 5);

                setEvents(filtered);
            } catch (err) {
                console.error("Calendar fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        }
        getEvents();
    }, []);

    if (isLoading) return <div className="p-4 text-white/20 text-[10px] animate-pulse">Loading data</div>

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                Upcoming Events
            </h2>

            <div className="lunar-scroll-area">
                {events.length === 0 ? (
                    <p className="lunar-form-subtitle">
                        No events scheduled
                    </p>
                ) : (
                    <div className="space-y-3">
                        {events.map((event: any, i) => (
                            <div key={i} className="group p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="lunar-label">{event.title}</p>
                                        <p className="lunar-form-subtitle">
                                            {new Date(event.start).toLocaleDateString([], {weekday: 'short', day: 'numeric'})} @ {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                        </p>
                                    </div>
                                    {event.category && (
                                        <span className="lunar-button-ghost">
                                            {event.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
