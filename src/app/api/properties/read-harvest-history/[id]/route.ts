import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: number } }): Promise<Response> {
    try {
        let filter = ''

        if (request.nextUrl?.searchParams) {
            const filterParam = request.nextUrl.searchParams.get('filter')
            if (filterParam) {
                filter = `?filter=${filterParam}`
            }
        }

        const url = `/api/properties/read-harvest-history/${params.id}${filter}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
