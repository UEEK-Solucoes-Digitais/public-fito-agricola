'use client'

import { useTab } from '@/context/TabContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { ReactNode, Suspense } from 'react'
import styles from './styles.module.scss'

const Navbar = dynamic(() => import('@/components/navbar'), {
    ssr: false,
})

export default function Layout({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const { selectedTab } = useTab()

    return (
        <div className={styles.contentWrapper} suppressHydrationWarning>
            <Suspense fallback={null}>
                <Navbar />
            </Suspense>

            <div
                className={clsx(styles.main, {
                    [styles.dashboardPage]: pathname == '/dashboard' || selectedTab == 'mapa-lavoura',
                    [styles.exportPage]: pathname.includes('exportar-graficos') || pathname.includes('webview-graph'),
                    [styles.darkSchema]: pathname.includes('/dashboard/conteudo'),
                })}>
                <ErrorBoundary fallbackComponent={<strong className='error-strong'>Erro ao carregar conteúdo</strong>}>
                    {children}
                </ErrorBoundary>
            </div>
        </div>
    )
}
