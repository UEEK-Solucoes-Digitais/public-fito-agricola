import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { type: number } }): Promise<Response> {
    try {
        const url = `/api/contents/list-access-type/${params.type}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
