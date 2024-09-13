import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { admin_id: string } }): Promise<Response> {
    try {
        const url = `/api/contents/read-items-form/${params.admin_id}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
