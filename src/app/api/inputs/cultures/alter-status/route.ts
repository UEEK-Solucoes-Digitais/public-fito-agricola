import { generalPostRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function POST(req: Request): Promise<Response> {
    try {
        const url = '/api/inputs/cultures/alter-status'
        return generalPostRequest(req, url, true)
    } catch (error: unknown) {
        return getException(error)
    }
}
