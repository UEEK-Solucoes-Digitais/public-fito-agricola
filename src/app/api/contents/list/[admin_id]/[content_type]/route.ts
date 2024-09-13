import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { admin_id: string; content_type: string } },
): Promise<Response> {
    try {
        let filter = ''
        let page = ''

        if (request.nextUrl?.searchParams) {
            const filterParam = request.nextUrl.searchParams.get('filter')
            const pageParam = request.nextUrl.searchParams.get('page')

            // TODO: corrigir essa busca que não está funcionando
            if (filterParam) {
                filter = `?filter=${filterParam}`
            }
            if (pageParam) {
                page = `?page=${pageParam}`
            }
        }

        const url = `/api/contents/list/${params.admin_id}/${params.content_type}${filter}${page}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
