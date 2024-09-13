import { generalGetRequest } from '@/utils/generalRequest'
import { getException } from '@/utils/request'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: number } }): Promise<Response> {
    try {
        const url = `/api/financial/management/banks/read/${params.id}`

        return generalGetRequest(url)
    } catch (error: unknown) {
        return getException(error)
    }
}
