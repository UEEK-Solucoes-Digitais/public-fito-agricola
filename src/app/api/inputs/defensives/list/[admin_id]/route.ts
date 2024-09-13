import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { admin_id: number } }): Promise<Response> {
    try {
        let filter = ''
        let page = ''

        if (request.nextUrl?.searchParams) {
            const filterParam = request.nextUrl.searchParams.get('filter')
            const pageParam = request.nextUrl.searchParams.get('page')

            if (filterParam) {
                filter = `filter=${filterParam}`
            }
            if (pageParam) {
                page = `page=${pageParam}`
            }
        }

        const url = `/api/inputs/defensives/list/${params.admin_id}?${filter}&${page}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
