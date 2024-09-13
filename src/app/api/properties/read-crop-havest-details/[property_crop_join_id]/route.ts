import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { property_crop_join_id: number } },
): Promise<Response> {
    try {
        let rainGaugefilter = ''
        let diseaseFilter = ''
        let costs = ''
        let type = ''

        if (request.nextUrl?.searchParams) {
            const rainGaugefilterParam = request.nextUrl.searchParams.get('start_date_rain_gauge')
            if (rainGaugefilterParam) {
                rainGaugefilter = `start_date_rain_gauge=${rainGaugefilterParam}&end_date_rain_gauge=${request.nextUrl.searchParams.get(
                    'end_date_rain_gauge',
                )}&`
            }

            const diseaseFilterParam = request.nextUrl.searchParams.get('start_date_disease')
            if (diseaseFilterParam) {
                diseaseFilter = `start_date_disease=${diseaseFilterParam}&end_date_disease=${request.nextUrl.searchParams.get(
                    'end_date_disease',
                )}&`
            }

            const costsParam = request.nextUrl.searchParams.get('start_date_costs')
            if (costsParam) {
                costs = `costs=${costsParam}&`
            }

            const typeParam = request.nextUrl.searchParams.get('type')
            if (typeParam) {
                type = `type=${typeParam}&`
            }
        }

        const url = `/api/properties/read-crop-havest-details/${params.property_crop_join_id}?${rainGaugefilter}${diseaseFilter}${costs}${type}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
