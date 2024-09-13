import { generalPostRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function POST(req: Request, { params }: { params: { type: string } }): Promise<Response> {
    try {
        const url = `/api/properties/management-data/delete/${params.type}`
        return generalPostRequest(req, url, true)
    } catch (error: unknown) {
        return getException(error)
    }
}
