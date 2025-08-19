// src/services/addressService.ts

export async function getRegions() {
    const response = await fetch('/api/addresses/regions');
    if (!response.ok) throw new Error('Failed to fetch regions');
    return await response.json(); // [{ id, name }]
}

export async function getZones(regionId?: number) {
    const url = regionId ? `/api/addresses/zones?regionId=${regionId}` : '/api/addresses/zones';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch zones');
    return await response.json(); // [{ id, name, regionId }]
}

export async function getWoredas(zoneId?: number) {
    const url = zoneId ? `/api/addresses/woredas?zoneId=${zoneId}` : '/api/addresses/woredas';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch woredas');
    return await response.json(); // [{ id, name, zoneId }]
}
