import api from '@/utils/api'
import { generalPostRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'

export async function POST(req: Request): Promise<Response> {
    try {
        // const body = await req.json();

        // const response = await api.post('/api/admin/login', body);
        // return Response.json(response.data)
        const url = '/api/admin/login'
        return generalPostRequest(req, url)
    } catch (error: unknown) {
        return getException(error)
    }
}
