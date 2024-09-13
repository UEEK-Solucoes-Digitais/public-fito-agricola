import api from '@/utils/api'
import { getException } from '@/utils/request'

export async function POST(req: Request): Promise<Response> {
    try {
        const body = await req.json()

        const response = await api.post('/api/admin/update-password', body)
        return Response.json(response.data)
    } catch (error: unknown) {
        return getException(error)
    }
}
