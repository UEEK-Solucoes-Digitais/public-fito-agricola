import api from '@/utils/api'
import { getException } from '@/utils/request'

export async function POST(req: Request): Promise<Response> {
    try {
        const { token } = await req.json()

        const config = {
            headers: { Authorization: `Bearer ${token}` },
        }

        const response = await api.get('/api/admin/verify-token', config)

        return Response.json(response.data)
    } catch (error: unknown) {
        return getException(error)
    }
}
