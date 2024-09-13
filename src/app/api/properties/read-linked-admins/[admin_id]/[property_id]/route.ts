import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(
    _request: NextRequest,
    { params }: { params: { admin_id: number; property_id: number } },
): Promise<Response> {
    try {
        const url = `/api/properties/read-linked-admins/${params.admin_id}/${params.property_id}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
