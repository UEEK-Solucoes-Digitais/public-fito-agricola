import PageHeader from '@/components/header/PageHeader'
import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
    title: 'Linha do Tempo - Fito Agrícola',
}

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <PageHeader placeholder='Pesquisar' disabledFunctions />
            {children}
        </>
    )
}
