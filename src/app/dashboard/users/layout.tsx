import PageHeader from '@/components/header/PageHeader'
import { Metadata } from 'next'
import { ReactNode } from 'react'
import styles from './styles.module.scss'

export const metadata: Metadata = {
    title: 'Usuários - Fito Agrícola',
}

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <PageHeader placeholder='Pesquisar em "usuários"' />

            <div className={styles.childrenWrapper}>{children}</div>
        </>
    )
}
