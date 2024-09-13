import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { admin_id: number } }): Promise<Response> {
    try {
        let propertyFilter = ''
        let harvestFilter = ''
        let cropFilter = ''

        if (request.nextUrl?.searchParams) {
            const harvestParam = request.nextUrl.searchParams.get('harvest_id')
            if (harvestParam) {
                harvestFilter = `?harvest_id=${harvestParam}`
            }

            const propertyParam = request.nextUrl.searchParams.get('property_id')
            if (propertyParam) {
                propertyFilter = `&property_id=${propertyParam}`
            }

            const cropParam = request.nextUrl.searchParams.get('crop_id')
            if (cropParam) {
                cropFilter = `&crop_id=${cropParam}`
            }
        }

        const url = `/api/dashboard/search/${params.admin_id}${harvestFilter}${propertyFilter}${cropFilter}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
