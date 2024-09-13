import { Metadata } from 'next'
import { ReactNode } from 'react'
import LayoutComponent from './LayoutComponent'

export const metadata: Metadata = {
    title: 'Propriedades - Fito Agrícola',
}

export default function Layout({ children }: { children: ReactNode }) {
    return <LayoutComponent>{children}</LayoutComponent>
}
