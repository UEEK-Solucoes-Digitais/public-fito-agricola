import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Anos agrícolas - Fito Agrícola',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
