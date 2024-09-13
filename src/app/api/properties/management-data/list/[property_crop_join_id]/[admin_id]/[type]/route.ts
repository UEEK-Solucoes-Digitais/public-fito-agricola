import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function GET(
    _request: Request,
    { params }: { params: { property_crop_join_id: number; admin_id: number; type: string } },
): Promise<Response> {
    try {
        const url = `/api/properties/management-data/list/${params.property_crop_join_id}/${params.admin_id}/${params.type}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
