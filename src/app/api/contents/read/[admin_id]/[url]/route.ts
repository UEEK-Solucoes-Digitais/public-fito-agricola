import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(
    _request: NextRequest,
    { params }: { params: { url: number; admin_id: number } },
): Promise<Response> {
    try {
        const url = `/api/contents/read/${params.admin_id}/${params.url}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
