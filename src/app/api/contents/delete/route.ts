import { generalPostRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function POST(req: Request): Promise<Response> {
    try {
        const url = '/api/contents/delete'
        return generalPostRequest(req, url, true)
    } catch (error: unknown) {
        return getException(error)
    }
}
