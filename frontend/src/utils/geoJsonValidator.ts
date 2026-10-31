import type { FeatureCollection, Feature, Geometry } from 'geojson';

export interface GeoJsonValidationResult {
  isValid: boolean;
  error?: string;
  data: FeatureCollection | null;
  featureCount: number;
  polygonCount: number;
  propertiesList: string[];
  bounds: [[number, number], [number, number]] | null; // [[southWestLat, southWestLng], [northEastLat, northEastLng]]
}

/**
 * Validates a GeoJSON string or parsed object for real geospatial ward boundaries.
 * Strictly verifies structure, geometry types, and coordinate ranges.
 */
export function validateGeoJson(raw: string | object): GeoJsonValidationResult {
  let parsed: any;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (e: any) {
      return {
        isValid: false,
        error: `Malformed JSON: ${e.message || 'Syntax error'}`,
        data: null,
        featureCount: 0,
        polygonCount: 0,
        propertiesList: [],
        bounds: null
      };
    }
  } else {
    parsed = raw;
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      isValid: false,
      error: 'GeoJSON must be a valid JSON object.',
      data: null,
      featureCount: 0,
      polygonCount: 0,
      propertiesList: [],
      bounds: null
    };
  }

  // Handle single Feature by wrapping into FeatureCollection
  let features: Feature<Geometry, any>[] = [];
  if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
    features = parsed.features;
  } else if (parsed.type === 'Feature' && parsed.geometry) {
    features = [parsed];
  } else {
    return {
      isValid: false,
      error: 'Invalid GeoJSON: Root object must be of type "FeatureCollection" with a features array, or a valid "Feature".',
      data: null,
      featureCount: 0,
      polygonCount: 0,
      propertiesList: [],
      bounds: null
    };
  }

  if (features.length === 0) {
    return {
      isValid: false,
      error: 'GeoJSON FeatureCollection contains 0 features.',
      data: null,
      featureCount: 0,
      polygonCount: 0,
      propertiesList: [],
      bounds: null
    };
  }

  let polygonCount = 0;
  const propKeys = new Set<string>();
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const updateBounds = (lng: number, lat: number): boolean => {
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      return false;
    }
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    return true;
  };

  for (let i = 0; i < features.length; i++) {
    const feat = features[i];
    if (!feat || feat.type !== 'Feature') {
      return {
        isValid: false,
        error: `Feature at index ${i} is missing 'type: "Feature"'.`,
        data: null,
        featureCount: features.length,
        polygonCount: 0,
        propertiesList: [],
        bounds: null
      };
    }

    if (!feat.geometry || !feat.geometry.type) {
      return {
        isValid: false,
        error: `Feature at index ${i} is missing a valid 'geometry' definition.`,
        data: null,
        featureCount: features.length,
        polygonCount: 0,
        propertiesList: [],
        bounds: null
      };
    }

    if (feat.properties && typeof feat.properties === 'object') {
      Object.keys(feat.properties).forEach(k => propKeys.add(k));
    }

    const gType = feat.geometry.type;
    const coords: any = (feat.geometry as any).coordinates;

    if (gType === 'Polygon') {
      polygonCount++;
      if (!Array.isArray(coords) || coords.length === 0) {
        return {
          isValid: false,
          error: `Polygon feature at index ${i} has empty or invalid coordinate rings.`,
          data: null,
          featureCount: features.length,
          polygonCount,
          propertiesList: Array.from(propKeys),
          bounds: null
        };
      }
      for (const ring of coords) {
        if (!Array.isArray(ring) || ring.length < 3) {
          return {
            isValid: false,
            error: `Polygon feature at index ${i} linear ring has fewer than 3 coordinates.`,
            data: null,
            featureCount: features.length,
            polygonCount,
            propertiesList: Array.from(propKeys),
            bounds: null
          };
        }
        for (const pt of ring) {
          if (!Array.isArray(pt) || pt.length < 2 || !updateBounds(pt[0], pt[1])) {
            return {
              isValid: false,
              error: `Polygon feature at index ${i} contains invalid coordinate [${pt}]. Latitude must be -90 to 90, longitude -180 to 180.`,
              data: null,
              featureCount: features.length,
              polygonCount,
              propertiesList: Array.from(propKeys),
              bounds: null
            };
          }
        }
      }
    } else if (gType === 'MultiPolygon') {
      polygonCount++;
      if (!Array.isArray(coords)) {
        return {
          isValid: false,
          error: `MultiPolygon at index ${i} has invalid coordinates.`,
          data: null,
          featureCount: features.length,
          polygonCount,
          propertiesList: Array.from(propKeys),
          bounds: null
        };
      }
      for (const poly of coords) {
        for (const ring of poly) {
          for (const pt of ring) {
            if (!Array.isArray(pt) || pt.length < 2 || !updateBounds(pt[0], pt[1])) {
              return {
                isValid: false,
                error: `MultiPolygon at index ${i} contains out-of-bounds coordinates.`,
                data: null,
                featureCount: features.length,
                polygonCount,
                propertiesList: Array.from(propKeys),
                bounds: null
              };
            }
          }
        }
      }
    } else if (gType === 'Point') {
      if (!Array.isArray(coords) || coords.length < 2 || !updateBounds(coords[0], coords[1])) {
        return {
          isValid: false,
          error: `Point feature at index ${i} has invalid coordinates.`,
          data: null,
          featureCount: features.length,
          polygonCount,
          propertiesList: Array.from(propKeys),
          bounds: null
        };
      }
    }
  }

  const validBounds: [[number, number], [number, number]] | null = 
    minLat !== Infinity && maxLat !== -Infinity && minLng !== Infinity && maxLng !== -Infinity
      ? [[minLat, minLng], [maxLat, maxLng]]
      : null;

  const validFeatureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features
  };

  return {
    isValid: true,
    data: validFeatureCollection,
    featureCount: features.length,
    polygonCount,
    propertiesList: Array.from(propKeys),
    bounds: validBounds
  };
}
