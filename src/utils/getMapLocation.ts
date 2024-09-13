import { Client } from '@googlemaps/google-maps-services-js'
import WriteLog from './logger'

export const getLocationName = async (latitude: number, longitude: number) => {
    const client = new Client({})
    try {
        const response = await client.reverseGeocode({
            params: {
                latlng: { latitude, longitude },
                key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
            },
        })
        return response.data.results[0].formatted_address
    } catch (error) {
        WriteLog(error, `error`)
        return null
    }
}
