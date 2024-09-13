import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: {
            property_crop_join_id: number
            filter_rain_gauge: number
            last_plant_rain_gauge: string
            end_rain_gauge: string
        }
    },
): Promise<Response> {
    try {
        const url = `/api/properties/filter-rain-gauge/${params.property_crop_join_id}/${params.filter_rain_gauge}/${params.last_plant_rain_gauge}/${params.end_rain_gauge}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
