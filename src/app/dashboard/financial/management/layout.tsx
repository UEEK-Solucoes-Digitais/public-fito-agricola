import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Gestão - Fito Agrícola',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
