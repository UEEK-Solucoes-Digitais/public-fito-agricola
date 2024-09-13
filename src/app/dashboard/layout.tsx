import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { ReactNode, Suspense } from 'react'
import Loading from './loading'

const LayoutComponent = dynamic(() => import('./LayoutComponent'), {
    ssr: false,
})

export const metadata: Metadata = {
    title: 'Dashboard - Fito Agrícola',
}

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<Loading />}>
            <LayoutComponent>{children}</LayoutComponent>
        </Suspense>
    )
}
