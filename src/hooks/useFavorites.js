import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  // Use a predictable storage key based on user ID to persist across reloads
  const storageKey = user ? `footbooking_favs_${user.id}` : null;

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      setFavorites(stored ? JSON.parse(stored) : []);
    } else {
      setFavorites([]); // Clear state if user logs out
    }
  }, [storageKey]);

  const toggleFavorite = useCallback((terrain) => {
    if (!storageKey || !terrain) return;
    
    setFavorites(prev => {
      const isFav = prev.some(f => f.id === terrain.id);
      let updated;
      
      if (isFav) {
        // Remove if it's already a favorite
        updated = prev.filter(f => f.id !== terrain.id);
      } else {
        // Keep a representation of the terrain that maps perfectly to ReservationModal's expected stadium prop
        const lightTerrain = {
          id: terrain.id,
          name: terrain.name || terrain.city,
          adress: terrain.adress || terrain.location,
          city: terrain.name || terrain.city,
          location: terrain.adress || terrain.location,
          price: terrain.price_per_hour || terrain.price || 0,
          totalPlayers: terrain.type || terrain.totalPlayers || "5 vs 5",
          fieldStadium: terrain.pelouse || terrain.fieldStadium || "Synthétique",
          notes: terrain.ratingStats?.average?.toString() || terrain.notes?.toString() || "N/A",
          proprietaire_id: terrain.proprietaire_id,
          image: terrain.image || terrain.field_images?.[0]?.url_image || "https://placehold.co/600x400?text=No+Image"
        };
        updated = [...prev, lightTerrain];
      }
      
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const isFavorite = useCallback((terrainId) => {
    return favorites.some(f => f.id === terrainId);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
