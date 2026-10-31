import type { FeatureCollection } from 'geojson';

/**
 * Valid sample GeoJSON FeatureCollection containing 10 contiguous municipal ward boundaries.
 * Coordinates are formatted as [longitude, latitude] in WGS84 per GeoJSON specification.
 */
export const SAMPLE_DISTRICT_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "W-101",
      properties: {
        ward_id: "W-101",
        ward_name: "Central Commercial District",
        name_en: "Central Commercial District",
        zone: "Central Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 2.14,
        established: 1998
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1345, 51.5190],
            [-0.1280, 51.5240],
            [-0.1195, 51.5215],
            [-0.1240, 51.5155],
            [-0.1345, 51.5190]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-102",
      properties: {
        ward_id: "W-102",
        ward_name: "North Industrial Hub",
        name_en: "North Industrial Hub",
        zone: "North Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 1.85,
        established: 2002
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1280, 51.5240],
            [-0.1230, 51.5310],
            [-0.1140, 51.5280],
            [-0.1195, 51.5215],
            [-0.1280, 51.5240]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-103",
      properties: {
        ward_id: "W-103",
        ward_name: "Westside Residential Enclave",
        name_en: "Westside Residential Enclave",
        zone: "West Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 1.92,
        established: 2005
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1440, 51.5160],
            [-0.1370, 51.5230],
            [-0.1280, 51.5240],
            [-0.1345, 51.5190],
            [-0.1440, 51.5160]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-104",
      properties: {
        ward_id: "W-104",
        ward_name: "East Market Corridor",
        name_en: "East Market Corridor",
        zone: "East Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 2.30,
        established: 1995
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1195, 51.5215],
            [-0.1140, 51.5280],
            [-0.1030, 51.5245],
            [-0.1080, 51.5180],
            [-0.1195, 51.5215]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-105",
      properties: {
        ward_id: "W-105",
        ward_name: "Old Town Heritage Sector",
        name_en: "Old Town Heritage Sector",
        zone: "South Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 1.65,
        established: 1985
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1345, 51.5190],
            [-0.1240, 51.5155],
            [-0.1280, 51.5090],
            [-0.1390, 51.5120],
            [-0.1345, 51.5190]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-106",
      properties: {
        ward_id: "W-106",
        ward_name: "Metro Transit & Waterfront",
        name_en: "Metro Transit & Waterfront",
        zone: "South Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 2.65,
        established: 2008
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1240, 51.5155],
            [-0.1080, 51.5180],
            [-0.1120, 51.5100],
            [-0.1280, 51.5090],
            [-0.1240, 51.5155]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-107",
      properties: {
        ward_id: "W-107",
        ward_name: "Northwest Civic Quarter",
        name_en: "Northwest Civic Quarter",
        zone: "North Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 1.72,
        established: 2010
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1370, 51.5230],
            [-0.1320, 51.5300],
            [-0.1230, 51.5310],
            [-0.1280, 51.5240],
            [-0.1370, 51.5230]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-108",
      properties: {
        ward_id: "W-108",
        ward_name: "Northeast Logistics Park",
        name_en: "Northeast Logistics Park",
        zone: "North Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 2.10,
        established: 2006
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1230, 51.5310],
            [-0.1170, 51.5370],
            [-0.1070, 51.5330],
            [-0.1140, 51.5280],
            [-0.1230, 51.5310]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-109",
      properties: {
        ward_id: "W-109",
        ward_name: "Southwest Green Suburb",
        name_en: "Southwest Green Suburb",
        zone: "West Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 2.45,
        established: 2015
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1440, 51.5160],
            [-0.1345, 51.5190],
            [-0.1390, 51.5120],
            [-0.1480, 51.5090],
            [-0.1440, 51.5160]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "W-110",
      properties: {
        ward_id: "W-110",
        ward_name: "Eastern Tech Park & Extension",
        name_en: "Eastern Tech Park & Extension",
        zone: "East Zone",
        jurisdiction: "City Municipal Corporation",
        area_sq_km: 1.95,
        established: 2019
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1080, 51.5180],
            [-0.1030, 51.5245],
            [-0.0930, 51.5210],
            [-0.0980, 51.5140],
            [-0.1080, 51.5180]
          ]
        ]
      }
    }
  ]
};
