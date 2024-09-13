import { generalPostRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function POST(req: Request): Promise<Response> {
    try {
        const url = '/api/inputs/defensives/alter-type'
        return generalPostRequest(req, url, true)
    } catch (error: unknown) {
        return getException(error)
    }
}
