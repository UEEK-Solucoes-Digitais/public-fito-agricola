import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { admin_id: number; type: number } },
): Promise<Response> {
    try {
        let filter = ''

        if (request.nextUrl?.searchParams) {
            const filterParam = request.nextUrl.searchParams.get('filter')
            if (filterParam) {
                filter = `?filter=${filterParam}`
            }
        }

        const url = `/api/stocks/incomings/list/${params.admin_id}/${params.type}${filter}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
