import React, { useEffect, useState } from "react";
import { getRegions, getZones, getWoredas } from "../../../../services/addressService";
import Field from '../../../../components/Field';
import { Loader2, MapPin, Home } from 'lucide-react';

export type AddressProps = {
  formData: {
    region: string;
    zone: string;
    wereda: string;
    houseNumber: string;
  };
  errors: {
    region?: string;
    zone?: string;
    wereda?: string;
    houseNumber?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

const StepAddress: React.FC<AddressProps> = ({ formData, errors, onChange }) => {
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [zones, setZones] = useState<{ id: number; name: string; regionId: number }[]>([]);
  const [woredas, setWoredas] = useState<{ id: number; name: string; zoneId: number }[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [zoneLoading, setZoneLoading] = useState(false);
  const [woredaLoading, setWoredaLoading] = useState(false);

  useEffect(() => {
    setRegionLoading(true);
    getRegions()
      .then(res => setRegions(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => console.error("Failed to load regions"))
      .finally(() => setRegionLoading(false));
  }, []);

  useEffect(() => {
    if (!formData.region) {
      setZones([]);
      return;
    }
    setZoneLoading(true);
    const selectedRegion = regions.find(r => r.name === formData.region);
    if (!selectedRegion) {
      setZones([]);
      setZoneLoading(false);
      return;
    }
    getZones(selectedRegion.id)
      .then(res => setZones(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => console.error("Failed to load zones"))
      .finally(() => setZoneLoading(false));
  }, [formData.region, regions]);

  useEffect(() => {
    if (!formData.zone) {
      setWoredas([]);
      return;
    }
    setWoredaLoading(true);
    const selectedZone = zones.find(z => z.name === formData.zone);
    if (!selectedZone) {
      setWoredas([]);
      setWoredaLoading(false);
      return;
    }
    getWoredas(selectedZone.id)
      .then(res => setWoredas(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => console.error("Failed to load woredas"))
      .finally(() => setWoredaLoading(false));
  }, [formData.zone, zones]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Reset dependent fields when parent field changes
    if (name === "region") {
      onChange({ target: { name: "zone", value: "" } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
      onChange({ target: { name: "wereda", value: "" } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    } else if (name === "zone") {
      onChange({ target: { name: "wereda", value: "" } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
    }
    onChange(e);
  };

  const LoadingState = ({ message }: { message: string }) => (
    <div className="flex items-center gap-2 text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-fuchsia-100 p-2 rounded-lg">
          <MapPin className="h-5 w-5 text-fuchsia-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Address Information</h2>
          <p className="text-gray-600 text-sm">Provide your complete address details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Region */}
        <Field label="Region / City Administration *" error={errors.region}>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {regionLoading ? (
              <LoadingState message="Loading regions..." />
            ) : (
              <select
                className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                name="region"
                value={formData.region || ""}
                onChange={handleSelectChange}
              >
                <option value="">Select your region</option>
                {regions.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            )}
          </div>
        </Field>

        {/* Zone */}
        <Field label="Zone *" error={errors.zone}>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {zoneLoading ? (
              <LoadingState message="Loading zones..." />
            ) : (
              <select
                className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                name="zone"
                value={formData.zone || ""}
                onChange={handleSelectChange}
                disabled={!formData.region || zoneLoading}
              >
                <option value="">Select your zone</option>
                {zones.map(z => (
                  <option key={z.id} value={z.name}>{z.name}</option>
                ))}
              </select>
            )}
          </div>
        </Field>

        {/* Wereda */}
        <Field label="Wereda / Kebele *" error={errors.wereda}>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {woredaLoading ? (
              <LoadingState message="Loading woredas..." />
            ) : (
              <select
                className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                name="wereda"
                value={formData.wereda || ""}
                onChange={handleSelectChange}
                disabled={!formData.zone || woredaLoading}
              >
                <option value="">Select your woreda</option>
                {woredas.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            )}
          </div>
        </Field>

        {/* House Number */}
        <Field label="House Number *" error={errors.houseNumber}>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="houseNumber"
              className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
              value={formData.houseNumber}
              onChange={onChange}
              placeholder="Enter house number"
            />
          </div>
        </Field>
      </div>
    </div>
  );
};

export default StepAddress;