import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

type MapViewProps = {
  latitude: number;
  longitude: number;
  onRegionChange?: (region: { latitude: number; longitude: number }) => void;
  markers?: Array<{ latitude: number; longitude: number }>;
  interactive?: boolean;
};

const MoveHandler = ({
  onRegionChange,
}: {
  onRegionChange?: (region: { latitude: number; longitude: number }) => void;
}) => {
  useMapEvents({
    moveend: (event) => {
      const center = event.target.getCenter();
      onRegionChange?.({ latitude: center.lat, longitude: center.lng });
    },
  });
  return null;
};

const MapView = ({
  latitude,
  longitude,
  onRegionChange,
  markers,
  interactive = true,
}: MapViewProps) => {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      zoomControl={interactive}
      dragging={interactive}
      scrollWheelZoom={interactive}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onRegionChange ? <MoveHandler onRegionChange={onRegionChange} /> : null}
      {markers?.map((marker, index) => (
        <Marker key={`${marker.latitude}-${index}`} position={[marker.latitude, marker.longitude]} />
      ))}
    </MapContainer>
  );
};

export default MapView;
