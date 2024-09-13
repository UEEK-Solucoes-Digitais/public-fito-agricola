import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function GET(_request: Request, { params }: { params: { id: number } }): Promise<Response> {
    try {
        const url = `/api/admin/read/${params.id}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
