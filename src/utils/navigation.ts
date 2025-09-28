import React from "react";
import { Linking, Platform } from "react-native";
import { Fault } from '@/src/types/faults';
import { GOOGLE_MAPS_API_KEY } from '@/src/lib/constants';


/**
 * Opens the device's maps application to navigate to the specified fault's coordinates.
 * 
 * @param {Fault} fault - The fault object containing coordinates to navigate to.
 */
 
export const openMapsToFault = (fault: Fault) => {
    const { latitude, longitude } = fault.coordinates;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${latitude},${longitude}`
        : `google.navigation:q=${latitude},${longitude}`;
    Linking.openURL(url).catch(err => {
    console.warn('Could not open map:', err);});
  };

  

export async function getTravelTime( 
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): Promise<number | null> {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.routes && data.routes.length > 0) {
    return data.routes[0].legs[0].duration.value; // in seconds
  }

  return null;
}