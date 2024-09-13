import { generalPostRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function POST(req: Request): Promise<Response> {
    try {
        const url = '/api/properties/link-crops'
        return generalPostRequest(req, url)
    } catch (error: unknown) {
        return getException(error)
    }
}
