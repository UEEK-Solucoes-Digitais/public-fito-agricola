'use client'

import ToastNotification from '@/components/notifications/ToastNotification'
import { AddButtonProvider } from '@/context/AddButtonContext'
import { AdminProvider } from '@/context/AdminContext'
import { SearchProvider } from '@/context/SearchContext'
import { SearchPropertyProvider } from '@/context/SearchPropertyContext'
import { SidebarContextProvider } from '@/context/SidebarContext'
import { SubTabProvider } from '@/context/SubtabContext'
import { TabProvider } from '@/context/TabContext'
import { NotificationProvider } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import NextTopLoader from 'nextjs-toploader'
import { ReactNode } from 'react'

export default function LayoutComponent({ children }: { children: ReactNode }) {
    const pathname = usePathname()

    return (
        <ErrorBoundary>
            <NotificationProvider>
                <AdminProvider>
                    <TabProvider>
                        <SubTabProvider>
                            <SearchProvider>
                                <SearchPropertyProvider>
                                    <SidebarContextProvider>
                                        <AddButtonProvider>
                                            <NextTopLoader
                                                color='#8ABB6E'
                                                initialPosition={0.08}
                                                crawlSpeed={200}
                                                height={4}
                                                crawl
                                                showSpinner={false}
                                                easing='ease'
                                                speed={200}
                                                shadow='0 0 10px #064E43,0 0 5px #064E43'
                                            />

                                            <main
                                                className={clsx({
                                                    'login-page':
                                                        pathname == '/login' ||
                                                        pathname.includes('termos') ||
                                                        pathname.includes('politica'),
                                                    'webview-page': pathname.includes('webview'),
                                                })}>
                                                {children}

                                                <ToastNotification />
                                            </main>
                                        </AddButtonProvider>
                                    </SidebarContextProvider>
                                </SearchPropertyProvider>
                            </SearchProvider>
                        </SubTabProvider>
                    </TabProvider>
                </AdminProvider>
            </NotificationProvider>
        </ErrorBoundary>
    )
}
