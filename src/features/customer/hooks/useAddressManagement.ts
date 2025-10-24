
// features/customer/hooks/useAddressManagement.ts
import { useState, useEffect } from 'react';
import { getRegions, getZones, getWoredas } from '../../../services/addressService';

export interface AddressData {
    regions: { id: number; name: string }[];
    zones: { id: number; name: string; regionId: number }[];
    woredas: { id: number; name: string; zoneId: number }[];
}

export interface AddressLoadingStates {
    regionLoading: boolean;
    zoneLoading: boolean;
    woredaLoading: boolean;
}

export function useAddressManagement(formData: { region: string; zone: string; }) {
    const [addressData, setAddressData] = useState<AddressData>({
        regions: [],
        zones: [],
        woredas: [],
    });
    const [loadingStates, setLoadingStates] = useState<AddressLoadingStates>({
        regionLoading: false,
        zoneLoading: false,
        woredaLoading: false,
    });

    // Load regions on component mount
    useEffect(() => {
        setLoadingStates(prev => ({ ...prev, regionLoading: true }));
        getRegions()
            .then(res => setAddressData(prev => ({ ...prev, regions: Array.isArray(res) ? res : (res.data || []) })))
            .catch(() => console.error("Failed to load regions"))
            .finally(() => setLoadingStates(prev => ({ ...prev, regionLoading: false })));
    }, []);

    // Load zones when region changes
    useEffect(() => {
        if (!formData.region) {
            setAddressData(prev => ({ ...prev, zones: [], woredas: [] }));
            return;
        }
        setLoadingStates(prev => ({ ...prev, zoneLoading: true }));
        const selectedRegion = addressData.regions.find(r => r.name === formData.region);
        if (!selectedRegion) {
            setAddressData(prev => ({ ...prev, zones: [], woredas: [] }));
            setLoadingStates(prev => ({ ...prev, zoneLoading: false }));
            return;
        }
        getZones(selectedRegion.id)
            .then(res => setAddressData(prev => ({ ...prev, zones: Array.isArray(res) ? res : (res.data || []) })))
            .catch(() => console.error("Failed to load zones"))
            .finally(() => setLoadingStates(prev => ({ ...prev, zoneLoading: false })));
    }, [formData.region, addressData.regions]);

    // Load woredas when zone changes
    useEffect(() => {
        if (!formData.zone) {
            setAddressData(prev => ({ ...prev, woredas: [] }));
            return;
        }
        setLoadingStates(prev => ({ ...prev, woredaLoading: true }));
        const selectedZone = addressData.zones.find(z => z.name === formData.zone);
        if (!selectedZone) {
            setAddressData(prev => ({ ...prev, woredas: [] }));
            setLoadingStates(prev => ({ ...prev, woredaLoading: false }));
            return;
        }
        getWoredas(selectedZone.id)
            .then(res => setAddressData(prev => ({ ...prev, woredas: Array.isArray(res) ? res : (res.data || []) })))
            .catch(() => console.error("Failed to load woredas"))
            .finally(() => setLoadingStates(prev => ({ ...prev, woredaLoading: false })));
    }, [formData.zone, addressData.zones]);

    return {
        ...addressData,
        ...loadingStates,
    };
}
