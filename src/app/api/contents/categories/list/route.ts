import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function GET(): Promise<Response> {
    try {
        const url = `/api/contents/categories/list`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
