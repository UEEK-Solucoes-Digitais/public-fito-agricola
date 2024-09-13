import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
    title: 'Fatores de Interferência - Fito Agrícola',
}

export default function Layout({ children }: { children: ReactNode }) {
    return children
}
