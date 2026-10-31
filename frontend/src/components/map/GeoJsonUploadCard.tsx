import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Layers, 
  FileCheck, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { useWardPulse } from '../../context/WardPulseContext';

export const GeoJsonUploadCard: React.FC = () => {
  const { 
    geoJsonData, 
    geoJsonMeta, 
    uploadGeoJson, 
    loadOfficialGeoJson,
    clearGeoJson 
  } = useWardPulse();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await uploadGeoJson(file);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await uploadGeoJson(file);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--primary)]" />
          <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
            GeoJSON Ward Boundary Layer
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {!geoJsonData ? (
            <button
              onClick={loadOfficialGeoJson}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--primary-light)] text-[var(--primary)] border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Official BBMP Wards (wards.geojson)</span>
            </button>
          ) : (
            <button
              onClick={clearGeoJson}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove Layer</span>
            </button>
          )}
        </div>
      </div>

      {geoJsonData && geoJsonMeta ? (
        <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                {geoJsonMeta.fileName}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                {geoJsonMeta.featureCount} Ward Polygons verified &bull; Properties: {geoJsonMeta.propertiesList.slice(0, 4).join(', ')}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              Real Polygons Plotted
            </span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-[var(--border-color)] hover:border-[var(--primary)] rounded-lg p-3 text-center cursor-pointer bg-[var(--bg-card-subtle)]/40 hover:bg-[var(--bg-card-subtle)] transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".geojson,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[var(--primary)]">
              {loading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-[var(--text-main)]">
                {loading ? 'Validating GeoJSON topology...' : 'Upload Municipal GeoJSON (.geojson, .json)'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Drag and drop or click to browse. Validates spatial topology automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {successMsg && !geoJsonData && (
        <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <FileCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
