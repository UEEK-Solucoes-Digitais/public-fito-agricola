import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: number } }): Promise<Response> {
    try {
        let filter = ''
        let harvestFilter = ''

        if (request.nextUrl?.searchParams) {
            const filterParam = request.nextUrl.searchParams.get('filter')
            if (filterParam) {
                filter = `filter=${filterParam}`
            }

            const harvestFilterParam = request.nextUrl.searchParams.get('harvest_id')
            if (harvestFilterParam) {
                harvestFilter = `harvest_id=${harvestFilterParam}`
            }
        }

        const url = `/api/properties/read-linked-crops/${params.id}?${filter}&${harvestFilter}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
