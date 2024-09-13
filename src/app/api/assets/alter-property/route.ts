import { generalPostRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function POST(req: Request): Promise<Response> {
    try {
        const url = '/api/assets/alter-property'
        return generalPostRequest(req, url, true)
    } catch (error: unknown) {
        return getException(error)
    }
}
