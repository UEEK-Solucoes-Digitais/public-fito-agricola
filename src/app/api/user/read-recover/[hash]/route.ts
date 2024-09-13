import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function GET(_request: Request, { params }: { params: { hash: string } }): Promise<Response> {
    try {
        const url = `/api/admin/read-hash/${params.hash}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
