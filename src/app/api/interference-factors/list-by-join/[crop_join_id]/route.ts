import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { crop_join_id: number } }): Promise<Response> {
    try {
        const url = `/api/interference-factors/list-by-join/${params.crop_join_id}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
