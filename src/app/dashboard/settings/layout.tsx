import PageHeader from '@/components/header/PageHeader'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Configurações - Fito Agrícola',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <PageHeader placeholder='Pesquisar' disabledFunctions />
            {children}
        </>
    )
}
