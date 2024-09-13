import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest): Promise<Response> {
    try {
        let queryString = ''

        if (request.nextUrl?.searchParams) {
            const searchParams = request.nextUrl.searchParams

            for (const [key, value] of searchParams.entries()) {
                queryString += `${key}=${value}&`
            }
        }

        const url = `/api/properties/read-crops-by-property-and-harvest?${queryString}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
