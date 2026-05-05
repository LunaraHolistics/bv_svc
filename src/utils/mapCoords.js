// src/utils/mapCoords.js

/**
 * Converte coordenadas geográficas para percentuais da imagem do mapa
 * @param {number} lat - Latitude do pin
 * @param {number} lng - Longitude do pin  
 * @param {Object} bounds - Limites geográficos da imagem do mapa
 * @param {Object} bounds.north - Latitude máxima
 * @param {Object} bounds.south - Latitude mínima
 * @param {Object} bounds.east - Longitude máxima
 * @param {Object} bounds.west - Longitude mínima
 * @returns {Object} { x: number (0-100), y: number (0-100) }
 */
export function latLngToPercent(lat, lng, bounds) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100 // Invertido: Y cresce para baixo
  
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  }
}

/**
 * Obter bounds do mapa a partir de 2 pontos de referência no MyMaps
 * Dica: No Google MyMaps, clique em 2 cantos opostos do condomínio e anote as coordenadas
 */
export function getMapBoundsFromMyMaps(northEast, southWest) {
  return {
    north: northEast.lat,
    south: southWest.lat,
    east: northEast.lng,
    west: southWest.lng
  }
}