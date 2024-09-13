import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { admin_id: number } }): Promise<Response> {
    try {
        let queryString = ''

        if (request.nextUrl?.searchParams) {
            const searchParams = request.nextUrl.searchParams

            for (const [key, value] of searchParams.entries()) {
                queryString += `${key}=${value}&`
            }
        }

        const url = `/api/crops-ground/list/${params.admin_id}?${queryString}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
