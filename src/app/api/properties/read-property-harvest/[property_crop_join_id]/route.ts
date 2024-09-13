import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { property_crop_join_id: number } },
): Promise<Response> {
    try {
        let withDrawArea = ''
        let adminId = ''

        if (request.nextUrl?.searchParams) {
            const withDrawAreaParam = request.nextUrl.searchParams.get('with_draw_area')
            if (withDrawAreaParam) {
                withDrawArea = `?with_draw_area=${withDrawAreaParam}`
            }
        }

        if (request.nextUrl?.searchParams) {
            const adminIdParam = request.nextUrl.searchParams.get('admin_id')
            if (adminIdParam) {
                if (withDrawArea) {
                    adminId = `&admin_id=${adminIdParam}`
                } else {
                    adminId = `?admin_id=${adminIdParam}`
                }
            }
        }

        const url = `/api/properties/read-property-harvest/${params.property_crop_join_id}${withDrawArea}${adminId}`
        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
