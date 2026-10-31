import React, { useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Info, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { useWardPulse } from '../../context/WardPulseContext';
import { MapLegend } from './MapLegend';

export const WardGeoMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const { 
    geoJsonData, 
    geoJsonMeta, 
    wards, 
    selectedWardId, 
    setSelectedWardId, 
    selectedWard,
    modelStatus, 
    choroplethMode, 
    setChoroplethMode,
    loadSampleGeoJson,
    theme
  } = useWardPulse();

  const isModelTrained = modelStatus === 'completed';
  const hasGeoJson = Boolean(geoJsonData && geoJsonData.features && geoJsonData.features.length > 0);

  // Wards with genuine reported coordinates in dataset
  const wardsWithCoords = useMemo(() => {
    return wards.filter(w => w.coordinates !== null);
  }, [wards]);

  // Compute bounding box
  const computedBounds = useMemo<[[number, number], [number, number]] | null>(() => {
    if (geoJsonMeta?.bounds) {
      // geoJsonMeta.bounds is [[southWestLat, southWestLng], [northEastLat, northEastLng]]
      // MapLibre expects [[southWestLng, southWestLat], [northEastLng, northEastLat]]
      const [[swLat, swLng], [neLat, neLng]] = geoJsonMeta.bounds;
      return [[swLng, swLat], [neLng, neLat]];
    }
    if (wardsWithCoords.length > 0) {
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      wardsWithCoords.forEach(w => {
        if (w.coordinates) {
          const [lat, lng] = w.coordinates;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        }
      });
      if (minLat !== Infinity) {
        return [[minLng - 0.02, minLat - 0.02], [maxLng + 0.02, maxLat + 0.02]];
      }
    }
    return null;
  }, [geoJsonMeta, wardsWithCoords]);

  // Default neutral center in London metropolitan area
  const defaultCenter: [number, number] = [-0.1265, 51.5200];

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use clean vector tile basemap supporting English labels
    const styleUrl = theme === 'dark'
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: defaultCenter,
      zoom: 12,
      attributionControl: {
        compact: false
      }
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

    map.on('load', () => {
      // Configure vector basemap layers to prefer English names
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer: any) => {
          if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            map.setLayoutProperty(layer.id, 'text-field', [
              'coalesce',
              ['get', 'name_en'],
              ['get', 'name:en'],
              ['get', 'name']
            ]);
          }
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [theme]);

  // Fit bounds when new bounds arrive
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !computedBounds) return;

    if (map.isStyleLoaded()) {
      map.fitBounds(computedBounds, { padding: 40, maxZoom: 14, duration: 1000 });
    } else {
      map.once('load', () => {
        map.fitBounds(computedBounds, { padding: 40, maxZoom: 14, duration: 1000 });
      });
    }
  }, [computedBounds]);

  // Handle GeoJSON Ward Boundaries Source and Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const updateGeoJsonLayers = () => {
      if (!map.isStyleLoaded()) return;

      // Enrich GeoJSON properties with actual ward prediction telemetry
      let enrichedGeoJson: any = null;
      if (geoJsonData && geoJsonData.features) {
        enrichedGeoJson = {
          type: 'FeatureCollection',
          features: geoJsonData.features.map(f => {
            const p = f.properties || {};
            const featId = f.id || p.ward_id || p.id || p.code;
            const featName = p.ward_name || p.name || p.ward;
            const matched = wards.find(w => 
              (featId && w.id.toLowerCase() === String(featId).toLowerCase()) ||
              (featName && w.name.toLowerCase() === String(featName).toLowerCase())
            );

            // Determine genuine color based on actual prediction or occupancy
            let color = '#3B82F6'; // Default neutral
            if (choroplethMode === 'prediction' && isModelTrained && matched?.priority) {
              if (matched.priority === 'Critical') color = '#EF4444';
              else if (matched.priority === 'Elevated') color = '#F59E0B';
              else if (matched.priority === 'Moderate') color = '#2563EB';
              else color = '#14B8A6';
            } else if (choroplethMode === 'demand' && matched) {
              const complaints = matched.recordedComplaints;
              if (complaints >= 400) color = '#DC2626';
              else if (complaints >= 300) color = '#EA580C';
              else if (complaints >= 200) color = '#0284C7';
              else color = '#059669';
            }

            return {
              ...f,
              properties: {
                ...p,
                ward_id: matched?.id || p.ward_id || f.id || 'N/A',
                ward_name: matched?.name || p.ward_name || 'Municipal Ward',
                color,
                recorded_complaints: matched?.recordedComplaints ?? null,
                predicted_demand: matched?.predictedDemand ?? null,
                priority: matched?.priority ?? null,
                is_selected: matched ? matched.id === selectedWardId : false
              }
            };
          })
        };
      }

      // Add or update source
      const source = map.getSource('ward-boundaries') as maplibregl.GeoJSONSource | undefined;
      if (source) {
        if (enrichedGeoJson) {
          source.setData(enrichedGeoJson);
        } else {
          source.setData({ type: 'FeatureCollection', features: [] });
        }
      } else if (enrichedGeoJson) {
        map.addSource('ward-boundaries', {
          type: 'geojson',
          data: enrichedGeoJson
        });

        // Fill layer
        map.addLayer({
          id: 'ward-fill',
          type: 'fill',
          source: 'ward-boundaries',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': [
              'case',
              ['boolean', ['get', 'is_selected'], false],
              0.65,
              0.35
            ]
          }
        });

        // Outline layer
        map.addLayer({
          id: 'ward-line',
          type: 'line',
          source: 'ward-boundaries',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['get', 'is_selected'], false],
              '#1E40AF',
              ['get', 'color']
            ],
            'line-width': [
              'case',
              ['boolean', ['get', 'is_selected'], false],
              3.5,
              1.8
            ]
          }
        });

        // Click interaction
        map.on('click', 'ward-fill', (e: any) => {
          if (!e.features || !e.features[0]) return;
          const props = e.features[0].properties;
          const wId = props?.ward_id;
          if (wId) {
            setSelectedWardId(wId);
          }

          // Show popup
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:inherit; font-size:12px;">
                <div style="font-weight:700; margin-bottom:4px;">${props?.ward_name || 'Municipal Ward'}</div>
                <div style="color:#64748B; font-size:11px;">Ward Code: <strong>${props?.ward_id || 'N/A'}</strong></div>
                ${props?.recorded_complaints !== null ? `<div style="margin-top:4px;">Recorded Complaints: <strong>${props?.recorded_complaints}</strong></div>` : ''}
                ${props?.predicted_demand !== null ? `<div style="color:#2563EB; font-weight:700; margin-top:2px;">Projected Demand: ${props?.predicted_demand} (${props?.priority || 'Standard'})</div>` : ''}
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseenter', 'ward-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'ward-fill', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateGeoJsonLayers();
    } else {
      map.once('load', updateGeoJsonLayers);
    }
  }, [geoJsonData, wards, selectedWardId, choroplethMode, isModelTrained, setSelectedWardId]);

  // Center on selected ward if coordinates exist
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedWard || !selectedWard.coordinates) return;
    const [lat, lng] = selectedWard.coordinates;
    map.flyTo({ center: [lng, lat], zoom: 14, speed: 1.2 });
  }, [selectedWardId, selectedWard]);

  // Render location markers when only point coordinates exist
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Only add markers if wards have coordinates
    wardsWithCoords.forEach(w => {
      if (!w.coordinates) return;
      const [lat, lng] = w.coordinates;
      const isSelected = selectedWardId === w.id;

      let color = '#2563EB';
      if (w.priority === 'Critical') color = '#EF4444';
      else if (w.priority === 'Elevated') color = '#F59E0B';
      else if (w.priority === 'Moderate') color = '#2563EB';
      else if (w.priority === 'Low') color = '#14B8A6';

      const el = document.createElement('div');
      el.className = 'custom-maplibre-pin';
      el.style.width = isSelected ? '34px' : '26px';
      el.style.height = isSelected ? '34px' : '26px';
      el.style.backgroundColor = color;
      el.style.borderRadius = '50%';
      el.style.border = isSelected ? '3px solid #ffffff' : '2px solid #ffffff';
      el.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#ffffff';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s ease';
      el.innerHTML = '📍';

      el.addEventListener('click', () => {
        setSelectedWardId(w.id);
      });

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family:inherit; font-size:12px;">
          <div style="font-weight:700;">${w.name}</div>
          <div style="color:#64748B; font-size:11px;">Ward Code: ${w.id}</div>
          <div style="margin-top:4px;">Complaints: <strong>${w.recordedComplaints}</strong></div>
          ${w.predictedDemand !== null ? `<div style="color:#2563EB; font-weight:700;">Projected: ${w.predictedDemand}</div>` : ''}
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [wardsWithCoords, selectedWardId, setSelectedWardId]);

  // Smoothly center and highlight selected ward when chosen from predictions or directory
  useEffect(() => {
    if (!selectedWardId || !selectedWard || !selectedWard.coordinates || !mapInstanceRef.current) return;
    const [lat, lng] = selectedWard.coordinates;
    mapInstanceRef.current.flyTo({
      center: [lng, lat],
      zoom: 13,
      speed: 1.2
    });
  }, [selectedWardId, selectedWard]);

  // Reset view to bounds
  const handleResetBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || !computedBounds) return;
    map.fitBounds(computedBounds, { padding: 40, maxZoom: 14, duration: 800 });
  };

  return (
    <div className="relative w-full h-full min-h-[580px] rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
      {/* MapLibre GL Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '580px' }}
      />

      {/* Floating Map Legend */}
      <MapLegend
        isModelTrained={isModelTrained}
        hasGeoJson={hasGeoJson}
        hasPointMarkers={wardsWithCoords.length > 0}
        choroplethMode={choroplethMode}
        onModeChange={setChoroplethMode}
      />

      {/* Zoom / Reset View Control */}
      {computedBounds && (
        <button
          onClick={handleResetBounds}
          className="absolute top-16 left-3 z-20 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
          title="Fit view to all wards"
          aria-label="Fit view to all wards"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {/* Empty State Banner: When No GeoJSON Exists */}
      {!hasGeoJson && (
        <div className="absolute top-4 left-14 z-20 max-w-sm p-4 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-lg space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[var(--primary)] border border-blue-100 dark:border-blue-900/40 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text-main)]">
                {wardsWithCoords.length > 0 
                  ? 'Displaying Actual Reported GPS Coordinates'
                  : 'Vector Basemap Active (English Labels)'}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1">
                {wardsWithCoords.length > 0
                  ? 'Location pins represent exact GPS coordinates from the municipal dataset. Ward boundary polygons have not been provided.'
                  : 'No GeoJSON ward boundaries provided. The map displays genuine vector tiles with English labels without fabricated polygons.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">
              {wardsWithCoords.length > 0 ? `${wardsWithCoords.length} Facility Locations` : '0 Polygons'}
            </span>
            <button
              onClick={loadSampleGeoJson}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample District GeoJSON</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-[var(--text-main)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            MapLibre GL Vector Basemap (English)
          </span>
          <span>&bull;</span>
          <span>
            {hasGeoJson ? (
              <strong className="text-[var(--text-main)]">{geoJsonMeta?.featureCount || 0} Official Ward Polygons</strong>
            ) : (
              <span>No Boundary Polygons</span>
            )}
          </span>
          {wardsWithCoords.length > 0 && (
            <>
              <span>&bull;</span>
              <span>{wardsWithCoords.length} Facility Pins</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedWard && (
            <span className="text-[var(--text-main)] font-semibold">
              Selected: {selectedWard.name} ({selectedWard.id})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
