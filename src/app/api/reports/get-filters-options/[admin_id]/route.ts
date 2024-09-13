import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { admin_id: number } }): Promise<Response> {
    try {
        let withQuery = ''

        if (request.nextUrl?.searchParams) {
            const filterParam = request.nextUrl.searchParams.get('with')

            if (filterParam) {
                withQuery = `?with=${filterParam}`
            }
        }

        const url = `/api/reports/get-filters-options/${params.admin_id}${withQuery}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
