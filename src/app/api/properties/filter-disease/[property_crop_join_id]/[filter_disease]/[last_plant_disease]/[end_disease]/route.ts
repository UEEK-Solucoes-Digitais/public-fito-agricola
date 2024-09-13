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
            filter_disease: number
            last_plant_disease: string
            end_disease: string
        }
    },
): Promise<Response> {
    try {
        const url = `/api/properties/filter-disease/${params.property_crop_join_id}/${params.filter_disease}/${params.last_plant_disease}/${params.end_disease}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
