import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function GET(
    _request: Request,
    { params }: { params: { property_crop_join_id: number } },
): Promise<Response> {
    try {
        const url = `/api/properties/monitoring/list/${params.property_crop_join_id}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
