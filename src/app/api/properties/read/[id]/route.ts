import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: number } }): Promise<Response> {
    try {
        let filter = ''
        let harvestFilter = ''
        let readSimpleFilter = ''
        let readMiminum = ''
        let adminId = ''

        if (request.nextUrl?.searchParams) {
            const filterParam = request.nextUrl.searchParams.get('filter')
            if (filterParam) {
                filter = `?filter=${filterParam}`
            }

            const harvestParam = request.nextUrl.searchParams.get('harvest_id')
            if (harvestParam) {
                harvestFilter = (filterParam ? '&' : '?') + `harvest_id=${harvestParam}`
            }

            const readSimpleParam = request.nextUrl.searchParams.get('read_simple')
            if (readSimpleParam) {
                readSimpleFilter = (filterParam || harvestParam ? '&' : '?') + `read_simple=${readSimpleParam}`
            }

            const readMiminumParam = request.nextUrl.searchParams.get('read_minimum')
            if (readMiminumParam) {
                readMiminum =
                    (filterParam || harvestParam || readSimpleParam ? '&' : '?') + `read_minimum=${readMiminumParam}`
            }

            const adminIdParam = request.nextUrl.searchParams.get('admin_id')
            if (adminIdParam) {
                adminId =
                    (filterParam || harvestParam || readSimpleParam || readMiminumParam ? '&' : '?') +
                    `admin_id=${adminIdParam}`
            }
        }
        const url = `/api/properties/read/${params.id}${filter}${harvestFilter}${readSimpleFilter}${readMiminum}${adminId}`

        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
