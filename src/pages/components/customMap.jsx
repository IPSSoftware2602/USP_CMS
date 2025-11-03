import React, { useState, useEffect, useRef } from "react";

const CustomMap = ({ 
  mapType = "roadmap", 
  initialLocation = { lat: 3.1390, lng: 101.6869 }
}) => {
  const [markerLocation, setMarkerLocation] = useState(initialLocation);
  const mapContainerRef = useRef(null);
  const iframeRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    if (initialLocation.lat && initialLocation.lng) {
      setMarkerLocation(initialLocation);
    }
  }, [initialLocation]);

  const getMapUrl = () => {
    const baseUrl = "https://www.google.com/maps/embed/v1/place";
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    let mapTypeParam = "";
    if (mapType === "satellite") {
      mapTypeParam = "&maptype=satellite";
    } else {
      mapTypeParam = "&maptype=roadmap";
    }
    
    return `${baseUrl}?key=${apiKey}&q=${markerLocation.lat},${markerLocation.lng}&zoom=15${mapTypeParam}`;
  };

  const handleIframeLoad = () => {
    setMapLoaded(true);
  };

  return (
    <div 
      ref={mapContainerRef}
      className="w-full h-full relative" 
    >
      <iframe
        ref={iframeRef}
        title="Google Map"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "0px"}}
        loading="lazy"
        src={getMapUrl()}
        onLoad={handleIframeLoad}
      />
    
    </div>
  );
};

export default CustomMap;