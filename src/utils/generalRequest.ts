import api from '@/utils/api';
import FormData from 'form-data';
import { cookies } from 'next/headers';
import { checkExpire } from './checkExpire';
import { getToken } from './getToken';
import uploadFile from './uploadFile';

export const maxDuration = 30000

export const generalGetRequest = async (url: string): Promise<Response> => {
    try {
        const expires = cookies().get('fito_auth_expire')?.value

        let token

        if (checkExpire(expires)) {
            // if(url.includes("/api/admin/read")){
            //     const redirectUrl = new URL('/login', process.env.BASE_URL);
            //     const response = NextResponse.redirect(redirectUrl);

            //     response.cookies.delete('fito_auth_token');
            //     response.cookies.delete('fito_auth_expire');
            //     return response;
            // }
            token = await getToken()
        } else {
            token = cookies().get('fito_auth_token')?.value
        }

        const cookieHectare = cookies().get('fito_hectare')?.value
        // const harvestCookie = cookies().get('cookie_harvest')?.value

        const config = {
            headers: { Authorization: `Bearer ${token}` },
        }

        if (cookieHectare && cookieHectare == 'alq') {
            // checando se a url já possui query
            url += url.includes('?') ? `&convert_to_alq=${true}` : `?convert_to_alq=${true}`
        }

        const response = await api.get(url, config)

        return new Response(JSON.stringify(response.data), {
            headers: { 'Content-Type': 'application/json' },
            status: response.status,
        })
    } catch (error: any) {
        console.error(error)
        // Tratar erro
        return new Response(JSON.stringify({ error: error?.response?.data?.msg ?? 'Erro ao enviar a requisição' }), {
            headers: { 'Content-Type': 'application/json' },
            status: error?.response?.data?.status ?? 500,
        })
    }
}

export const generalPostRequest = async (req: Request, url: string, put = false): Promise<Response> => {
    try {
        const expires = cookies().get('fito_auth_expire')?.value
        let token

        if (checkExpire(expires)) {
            token = await getToken()
        } else {
            token = cookies().get('fito_auth_token')?.value
        }
        const cookieHectare = cookies().get('fito_hectare')?.value

        const contentType = req.headers.get('content-type')
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }

        let body
        let hasHarvestId = false

        if (contentType?.includes('multipart/form-data')) {
            const originalFormData = await req.formData()
            body = new FormData()

            for (const [key, value] of originalFormData.entries()) {
                if (key == 'harvest_id') {
                    hasHarvestId = true
                }

                if (
                    typeof value !== 'string' &&
                    value !== null &&
                    typeof value !== 'undefined' &&
                    typeof value !== 'number'
                ) {
                    const encodeName = originalFormData.get('noEncoding') ? false : true;

                    const file = await uploadFile(value, originalFormData.get('pathToUpload') as string, encodeName);
                    body.append(key, file?.fileName ?? '');
                } else {
                    body.append(key, value)
                }
            }
        } else {
            body = await req.json()
        }

        if (cookieHectare && cookieHectare == 'alq') {
            url += url.includes('?') ? `&convert_to_alq=${true}` : `?convert_to_alq=${true}`
        }

        const response = put ? await api.put(url, body, config) : await api.post(url, body, config)

        return new Response(JSON.stringify(response.data), {
            headers: { 'Content-Type': 'application/json' },
            status: response.status,
        })
    } catch (error: any) {
        console.error(error)
        // Tratar erro
        return new Response(JSON.stringify({ error: error?.response?.data?.msg ?? 'Erro ao enviar a requisição' }), {
            headers: { 'Content-Type': 'application/json' },
            status: error?.response?.data?.status ?? 500,
        })
    }
}
