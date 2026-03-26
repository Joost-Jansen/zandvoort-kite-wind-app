"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";

import type { KiteLocation } from "@/lib/locations";

type ForecastMapProps = {
  location: KiteLocation;
};

export function ForecastMap({ location }: ForecastMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const primaryMarkerRef = useRef<L.CircleMarker | null>(null);
  const haloMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center: [location.latitude, location.longitude],
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    haloMarkerRef.current = L.circleMarker([location.latitude, location.longitude], {
      radius: 24,
      color: "rgba(74, 144, 226, 0.32)",
      fillColor: "rgba(74, 144, 226, 0.12)",
      fillOpacity: 0.4,
      weight: 1,
    }).addTo(map);

    primaryMarkerRef.current = L.circleMarker([location.latitude, location.longitude], {
      radius: 10,
      color: "#ffffff",
      fillColor: "#4a90e2",
      fillOpacity: 0.9,
      weight: 3,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      primaryMarkerRef.current = null;
      haloMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const nextLatLng: L.LatLngExpression = [location.latitude, location.longitude];
    map.flyTo(nextLatLng, 10, {
      animate: true,
      duration: 1.1,
    });
    primaryMarkerRef.current?.setLatLng(nextLatLng);
    haloMarkerRef.current?.setLatLng(nextLatLng);
  }, [location]);

  return <div className="map-frame forecast-map" ref={containerRef} />;
}