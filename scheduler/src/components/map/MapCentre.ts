import { Friend, MapEvent } from "@/lib/map";
import { calcCenter } from "@/lib/map/utils";

interface CalcCenterProps {
  mode: "friends" | "events";
  friends: Friend[];
  events: MapEvent[];
  userLocation?: [number, number];
}

export function calcMapCenter({ mode, friends, events, userLocation }: CalcCenterProps): [number, number] {
  if (mode === "friends") {
    const points = [
      ...(userLocation ? [userLocation] : []),
      ...friends.filter((f) => f.location).map((f) => [f.location!.lat, f.location!.lng] as [number, number]),
    ];
    return points.length ? calcCenter(points) : [0, 0];
  } else {
    const points = events.flatMap((e) => {
      const pts: [number, number][] = [];
      if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
      if (e.destinationCoords) pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
      return pts;
    });
    return points.length ? calcCenter(points) : [0, 0];
  }
}