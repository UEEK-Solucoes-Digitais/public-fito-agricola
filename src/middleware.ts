import { NextResponse } from 'next/server'
import { checkExpire } from './utils/checkExpire'

// const redirectFromAuth = (path: string, tokenExpired: boolean, newUrl: any) => {
//     if (tokenExpired && path !== '/login') {
//         newUrl.pathname = '/login';
//         return newUrl;
//     }

//     if (!tokenExpired && (path == '/login' || path == '/')) {
//         newUrl.pathname = '/dashboard';
//         return newUrl;
//     }

//     return false;
// }

export async function middleware(req: any) {
    const expire = req.cookies.get('fito_auth_expire')

    const tokenExpired = !expire || checkExpire(expire.value)
    // const tokenExpired = checkExpire(expire);
    const path = req.nextUrl.pathname

    if (
        tokenExpired &&
        path !== '/login' &&
        path !== '/politica-de-privacidade' &&
        path !== '/termos-de-uso' &&
        !path.startsWith('/recuperar-senha') &&
        !path.startsWith('/dashboard/exportar-graficos') &&
        !path.startsWith('/webview-graph') &&
        !path.startsWith('/recover-password')
    ) {
        const redirectUrl = new URL('/login', req.url)
        const response = NextResponse.redirect(redirectUrl)

        response.cookies.delete('fito_auth_token')
        response.cookies.delete('fito_auth_expire')
        return response
    } else if (!tokenExpired && (path == '/' || path == '/login')) {
        const redirectUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|assets|.well-known|exportar-graficos).*)'],
}
