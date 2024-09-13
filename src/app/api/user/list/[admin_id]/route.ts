import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { admin_id: number } }): Promise<Response> {
    try {
        let properties = ''
        let page = ''
        let filter = ''
        let filterType = ''

        if (request.nextUrl?.searchParams) {
            const propertiesParam = request.nextUrl.searchParams.get('properties')
            const pageParam = request.nextUrl.searchParams.get('page')
            const filterParam = request.nextUrl.searchParams.get('filter')
            const filterTypeParam = request.nextUrl.searchParams.get('filterType')

            if (propertiesParam) {
                properties = `?properties=true`
            }
            if (pageParam) {
                // TODO: Adicionar verificação em todas as rotas de páginação. Caso exista algum outro SearchParam o page deve vir como &page=, caso contrário, deve iniciar com ?page=
                page = `&page=${pageParam}`
            }

            if (filterParam) {
                filter = `&filter=${filterParam}`
            }

            if (filterTypeParam) {
                filterType = `&filterType=${filterTypeParam}`
            }
        }

        const url = `/api/admin/list/${params.admin_id}${properties}${page}${filter}${filterType}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
