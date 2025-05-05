// MapboxMap.js
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MapboxMap = ({ startLocation, endLocation, stops, busLocation, enableVoice }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstance = useRef(null);
  const [currentInstruction, setCurrentInstruction] = useState("");
  const [nextStopEta, setNextStopEta] = useState(null);

  // Initialize map
  useEffect(() => {
    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [startLocation.longitude, startLocation.latitude],
      zoom: 12,
    });

    return () => mapInstance.current?.remove();
  }, [startLocation]);

  // Add markers, route, and navigation
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !busLocation) return;

    map.once("load", async () => {
      // Clear existing layers
      if (map.getSource("route")) map.removeLayer("route");
      if (map.getSource("route")) map.removeSource("route");
      if (map.getSource("navigation-route")) map.removeLayer("navigation-route-line");
      if (map.getSource("navigation-route")) map.removeSource("navigation-route");

      // Add markers
      addMarkers(map);

      // Add bus marker
      addBusMarker(map);

      // Calculate route with traffic
      await calculateRoute(map);
    });
  }, [busLocation, stops, enableVoice]);

  const addMarkers = (map) => {
    // Start marker
    new mapboxgl.Marker({ color: "green" })
      .setLngLat([startLocation.longitude, startLocation.latitude])
      .setPopup(new mapboxgl.Popup().setText("Start Location"))
      .addTo(map);

    // End marker
    new mapboxgl.Marker({ color: "red" })
      .setLngLat([endLocation.longitude, endLocation.latitude])
      .setPopup(new mapboxgl.Popup().setText("End Location"))
      .addTo(map);

    // Stop markers
    stops.forEach((stop, index) => {
      new mapboxgl.Marker({ color: "blue" })
        .setLngLat([stop.longitude, stop.latitude])
        .setPopup(new mapboxgl.Popup().setText(`Stop ${index + 1}: ${stop.name || ""}`))
        .addTo(map);
    });
  };

  const addBusMarker = (map) => {
    const busIcon = document.createElement("div");
    busIcon.className = "bus-marker";
    busIcon.innerHTML = "🚍";
    busIcon.style.fontSize = "24px";
    busIcon.style.width = "40px";
    busIcon.style.height = "40px";
    busIcon.style.textAlign = "center";

    markerRef.current = new mapboxgl.Marker(busIcon)
      .setLngLat([busLocation.longitude, busLocation.latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <strong>Bus Location</strong>
        <div>Speed: ${busLocation.speed || 0} km/h</div>
        ${nextStopEta ? `<div>Next Stop ETA: ${nextStopEta} min</div>` : ''}
      `))
      .addTo(mapInstance.current);
  };

  const calculateRoute = async (map) => {
    try {
      // Full route from start to end
      const waypoints = [
        [startLocation.longitude, startLocation.latitude],
        ...stops.map(stop => [stop.longitude, stop.latitude]),
        [endLocation.longitude, endLocation.latitude]
      ];

      // Navigation route from current location to next stop
      const nextStop = stops.find(stop => 
        calculateDistance(busLocation.latitude, busLocation.longitude, stop.latitude, stop.longitude) > 0.1
      ) || endLocation;

      const navWaypoints = [
        [busLocation.longitude, busLocation.latitude],
        [nextStop.longitude, nextStop.latitude]
      ];

      // Get full route (blue line)
      const routeResponse = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${waypoints.map(wp => wp.join(',')).join(';')}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );

      // Get navigation route (red line)
      const navResponse = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${navWaypoints.map(wp => wp.join(',')).join(';')}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`
      );

      // Draw full route
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: routeResponse.data.routes[0].geometry,
        },
      });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
        },
      });

      // Draw navigation route
      map.addSource("navigation-route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: navResponse.data.routes[0].geometry,
        },
      });

      map.addLayer({
        id: "navigation-route-line",
        type: "line",
        source: "navigation-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#ef4444",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      });

      // Get navigation instructions
      const instruction = navResponse.data.routes[0].legs[0].steps[0].maneuver.instruction;
      setCurrentInstruction(instruction);
      setNextStopEta(Math.round(navResponse.data.routes[0].duration / 60));

      // Speak instruction if voice is enabled
      if (enableVoice && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(instruction);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }

      // Center map on bus location
      map.flyTo({
        center: [busLocation.longitude, busLocation.latitude],
        zoom: 14
      });

    } catch (err) {
      console.error("Directions API error:", err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height: "500px", width: "100%" }} />
      {currentInstruction && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1
        }}>
          <strong>Next Instruction:</strong> {currentInstruction}
          {nextStopEta && <div><strong>ETA:</strong> {nextStopEta} minutes</div>}
        </div>
      )}
    </div>
  );
};

export default MapboxMap;