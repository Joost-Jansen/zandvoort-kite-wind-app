"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";

import type { KiteLocation } from "@/lib/locations";

type ForecastMapProps = {
  location: KiteLocation;
  windKnots: number;
  directionDegrees: number;
};

const HEAT_PATCHES = [
  { x: -0.62, y: -0.52, scale: 0.95, pulse: 0 },
  { x: -0.3, y: -0.36, scale: 0.72, pulse: 0.6 },
  { x: 0.08, y: -0.34, scale: 0.82, pulse: 1.1 },
  { x: 0.42, y: -0.26, scale: 0.7, pulse: 1.7 },
  { x: -0.52, y: -0.02, scale: 0.88, pulse: 0.8 },
  { x: -0.08, y: 0.02, scale: 0.78, pulse: 1.5 },
  { x: 0.34, y: 0.08, scale: 0.92, pulse: 2.1 },
  { x: -0.66, y: 0.34, scale: 0.84, pulse: 0.3 },
  { x: -0.22, y: 0.34, scale: 0.74, pulse: 1.3 },
  { x: 0.14, y: 0.38, scale: 0.68, pulse: 1.9 },
  { x: 0.48, y: 0.36, scale: 0.7, pulse: 2.5 },
  { x: 0.74, y: 0.12, scale: 0.76, pulse: 2.9 },
];

function getNormalizedStrength(windKnots: number) {
  return Math.min(Math.max((windKnots - 8) / 20, 0.15), 1);
}

function getPalette(windKnots: number) {
  if (windKnots >= 24) {
    return {
      washTop: "rgba(66, 134, 213, 0.58)",
      washBottom: "rgba(15, 63, 118, 0.7)",
      cool: "rgba(90, 198, 255, 0.7)",
      mid: "rgba(128, 233, 112, 0.88)",
      hot: "rgba(255, 225, 104, 0.98)",
      line: "rgba(247, 255, 197, 0.98)",
    };
  }

  if (windKnots >= 19) {
    return {
      washTop: "rgba(67, 138, 214, 0.48)",
      washBottom: "rgba(19, 74, 128, 0.6)",
      cool: "rgba(96, 203, 255, 0.62)",
      mid: "rgba(116, 221, 126, 0.82)",
      hot: "rgba(244, 218, 118, 0.86)",
      line: "rgba(242, 250, 195, 0.88)",
    };
  }

  if (windKnots >= 15) {
    return {
      washTop: "rgba(73, 145, 221, 0.36)",
      washBottom: "rgba(22, 84, 138, 0.5)",
      cool: "rgba(102, 206, 255, 0.48)",
      mid: "rgba(118, 218, 150, 0.66)",
      hot: "rgba(229, 212, 132, 0.68)",
      line: "rgba(231, 242, 192, 0.74)",
    };
  }

  return {
    washTop: "rgba(75, 143, 214, 0.24)",
    washBottom: "rgba(27, 88, 140, 0.36)",
    cool: "rgba(103, 199, 246, 0.34)",
    mid: "rgba(121, 205, 171, 0.42)",
    hot: "rgba(214, 203, 148, 0.42)",
    line: "rgba(223, 236, 192, 0.52)",
  };
}

export function ForecastMap({ location, windKnots, directionDegrees }: ForecastMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  useEffect(() => {
    const map = mapRef.current;
    const canvas = canvasRef.current;

    if (!map || !canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;

    const strength = getNormalizedStrength(windKnots);
    const activeHeatPatchCount = windKnots >= 24 ? 12 : windKnots >= 19 ? 9 : windKnots >= 15 ? 7 : 4;
    const activeFlowLineCount = windKnots >= 24 ? 36 : windKnots >= 19 ? 28 : windKnots >= 15 ? 18 : 8;
    const palette = getPalette(windKnots);
    const lineRows = 6;
    const lineColumns = 6;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(bounds.width));
      const nextHeight = Math.max(1, Math.round(bounds.height));
      const nextPixelRatio = window.devicePixelRatio || 1;

      if (nextWidth === width && nextHeight === height && nextPixelRatio === devicePixelRatio) {
        return;
      }

      width = nextWidth;
      height = nextHeight;
      devicePixelRatio = nextPixelRatio;
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const drawFrame = (time: number) => {
      resizeCanvas();
      context.clearRect(0, 0, width, height);

      const anchor = map.latLngToContainerPoint([location.latitude, location.longitude]);
      const fieldRadius = Math.min(width, height) * (0.34 + strength * 0.22);

      const wash = context.createLinearGradient(0, 0, 0, height);
      wash.addColorStop(0, palette.washTop);
      wash.addColorStop(1, palette.washBottom);
      context.globalAlpha = 0.4 + strength * 0.26;
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);

      HEAT_PATCHES.forEach((patch, index) => {
        const x = anchor.x + patch.x * fieldRadius * 1.7 + Math.sin(time / 1500 + patch.pulse) * 6;
        const y = anchor.y + patch.y * fieldRadius * 1.4 + Math.cos(time / 1800 + patch.pulse) * 5;
        const radius = fieldRadius * patch.scale * (0.68 + Math.sin(time / 1700 + patch.pulse) * 0.06 + strength * 0.12);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        const activeAlpha = index < activeHeatPatchCount ? 0.92 : 0.24;

        gradient.addColorStop(0, palette.hot.replace(/0?\.\d+\)$/, `${Math.min(1, activeAlpha)})`));
        gradient.addColorStop(0.42, palette.mid.replace(/0?\.\d+\)$/, `${Math.min(1, activeAlpha * 0.92)})`));
        gradient.addColorStop(0.76, palette.cool.replace(/0?\.\d+\)$/, `${Math.min(1, activeAlpha * 0.72)})`));
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        context.globalAlpha = 0.42 + strength * 0.34;
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });

      const lineAngle = (directionDegrees * Math.PI) / 180;
      const speed = 26 + strength * 52;
      const lineLength = 34 + strength * 46;
      const thickness = 1.2 + strength * 2.4;

      context.lineCap = "round";

      for (let index = 0; index < lineRows * lineColumns; index += 1) {
        const column = index % lineColumns;
        const row = Math.floor(index / lineColumns);
        const active = index < activeFlowLineCount;
        const baseX = ((column + 0.5) / lineColumns) * width;
        const baseY = ((row + 0.65) / lineRows) * height;
        const travel = ((time / 1000) * speed + index * 31) % (width * 0.34);
        const x = baseX - width * 0.18 + travel;
        const y = baseY + (column % 2 === 0 ? -8 : 8);

        context.save();
        context.translate(x, y);
        context.rotate(lineAngle);
        context.globalAlpha = active ? 0.42 + strength * 0.44 : 0.08 + strength * 0.06;
        context.strokeStyle = palette.line;
        context.lineWidth = thickness;
        context.beginPath();
        context.moveTo(-lineLength / 2, 0);
        context.lineTo(lineLength / 2, 0);
        context.stroke();

        if (active) {
          context.fillStyle = palette.line;
          context.beginPath();
          context.moveTo(lineLength / 2 + 7, 0);
          context.lineTo(lineLength / 2 - 5, -4 - strength * 2.2);
          context.lineTo(lineLength / 2 - 5, 4 + strength * 2.2);
          context.closePath();
          context.fill();
        }

        context.restore();
      }

      const centerGlow = context.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, fieldRadius * 0.7);
      centerGlow.addColorStop(0, `rgba(255, 244, 180, ${0.16 + strength * 0.12})`);
      centerGlow.addColorStop(0.4, `rgba(120, 222, 138, ${0.18 + strength * 0.12})`);
      centerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.globalAlpha = 1;
      context.fillStyle = centerGlow;
      context.beginPath();
      context.arc(anchor.x, anchor.y, fieldRadius * 0.72, 0, Math.PI * 2);
      context.fill();

      animationFrame = window.requestAnimationFrame(drawFrame);
    };

    const refreshFrame = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(drawFrame);
    };

    resizeCanvas();
    map.on("move zoom resize", refreshFrame);
    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      map.off("move zoom resize", refreshFrame);
    };
  }, [directionDegrees, location, windKnots]);

  return (
    <div className="map-frame forecast-map-shell">
      <div className="forecast-map" ref={containerRef} />
      <canvas className="forecast-map-overlay" ref={canvasRef} />
    </div>
  );
}