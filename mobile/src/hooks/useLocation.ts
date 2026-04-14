import { useState, useCallback } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export type LocationStatus = "idle" | "requesting" | "fetching" | "ready" | "denied" | "error";

export function useLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [location, setLocation] = useState<LocationData | null>(null);

  const getLocation = useCallback(async (): Promise<LocationData | null> => {
    setStatus("requesting");
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== "granted") {
        setStatus("denied");
        Alert.alert(
          "Location Permission",
          "Location access was denied. You can still proceed without GPS, but your location won't be recorded.",
          [{ text: "OK" }]
        );
        return null;
      }

      setStatus("fetching");
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let address = "";
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo) {
          address = [geo.street, geo.district, geo.city, geo.region]
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        // Reverse geocoding failed - continue without address
      }

      const result: LocationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: address || undefined,
      };

      setLocation(result);
      setStatus("ready");
      return result;
    } catch (err) {
      setStatus("error");
      Alert.alert("Location Error", "Could not get your location. You can still proceed without GPS.");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setLocation(null);
  }, []);

  return { location, status, getLocation, reset };
}
