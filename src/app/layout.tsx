import clsx from 'clsx'
import { Metadata, Viewport } from 'next'
import { Inter, Ubuntu } from 'next/font/google'
import { ReactNode } from 'react'
import LayoutComponent from './LayoutComponent'

import '@styles/main.scss'

export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamic = 'force-dynamic'

interface ExtendedMetadata extends Metadata {
    splashScreens: {
        rel: string
        media: string
        href: string
    }[]
}

const inter = Inter({
    weight: ['200', '300', '400', '500', '600', '700', '800'],
    style: ['normal'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
    preload: true,
})

const ubuntu = Ubuntu({
    weight: ['400', '500', '700'],
    style: ['normal'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-ubuntu',
    preload: true,
})

export const viewport: Viewport = {
    themeColor: [{ media: '(prefers-color-scheme: light)', color: 'black' }], // white
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export const metadata: ExtendedMetadata = {
    title: 'Fito Agrícola',
    description:
        'A Fito Agrícola é um sistema de gerenciamento inovador para agricultores. Otimize suas lavouras e propriedades com ferramentas de controle de solo, clima e produção. Torne a agricultura mais eficaz e sustentável com Fito Agrícola hoje!',
    manifest: '/manifest.json',
    generator: 'Next.js',
    icons: [
        { rel: 'apple-touch-icon', url: 'assets/icons/icon-96x96.png' },
        { rel: 'icon', url: 'assets/icons/icon-96x96.png' },
    ],
    splashScreens: [
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_15_Pro__iPhone_15__iPhone_14_Pro_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_11_Pro_Max__iPhone_XS_Max_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_11__iPhone_XR_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/4__iPhone_SE__iPod_touch_5th_generation_and_later_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/12.9__iPad_Pro_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/11__iPad_Pro__10.5__iPad_Pro_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/10.9__iPad_Air_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/10.5__iPad_Air_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/10.2__iPad_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_landscape.png',
        },
        {
            rel: 'apple-touch-startup-image',
            media: 'screen and (device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
            href: 'assets/splashscreens/8.3__iPad_Mini_landscape.png',
        },
    ],
    applicationName: 'Fito Agrícola',
    authors: {
        name: 'UEEK Soluções Digitais',
        url: 'https://ueek.digital',
    },
    metadataBase: new URL('https://new.fitoagricola.com.br/'),
    publisher: 'UEEK Soluções Digitais',
    openGraph: {
        title: 'Fito Agricola',
        siteName: 'Fito Agricola',
        images: [
            {
                url: '/opengraph-image.png',
                width: 1341,
                height: 724,
            },
        ],
        locale: 'pt_BR',
        type: 'website',
    },
    itunes: {
        appId: '6503173424',
    },
    appLinks: {
        ios: {
            app_name: 'Fito Agricola',
            app_store_id: '6503173424',
            url: 'https://itunes.apple.com/app/id6503173424',
        },
        iphone: {
            app_name: 'Fito Agricola',
            app_store_id: '6503173424',
            url: 'https://itunes.apple.com/app/id6503173424',
        },
        android: {
            app_name: 'Fito Agricola',
            package: 'com.fitoagricola.app',
            url: 'https://play.google.com/store/apps/details?id=com.fitoagricola',
        },
    },
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang='pt-BR' className={clsx(inter.className, inter.variable, ubuntu.variable)} suppressHydrationWarning>
            <body>
                <LayoutComponent>{children}</LayoutComponent>
            </body>
        </html>
    )
}
