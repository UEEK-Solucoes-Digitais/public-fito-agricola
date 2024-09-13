'use client'

import PageHeader from '@/components/header/PageHeader'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import { useAdmin } from '@/context/AdminContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import getFetch from '@/utils/getFetch'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import useSWR from 'swr'

export default function Template({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const actionHref = `/dashboard/conteudos/adicionar${pathname.includes('-ma') ? '-ma' : ''}`
    const { admin } = useAdmin()
    const { data, isLoading } = useSWR(`/api/contents/categories/list`, getFetch)

    if (isLoading || !data) {
        return <ElementSkeleton />
    }

    const showButton =
        admin.access_level == 1 &&
        !pathname.includes(admin.id.toString()) &&
        !pathname.includes('adicionar') &&
        !pathname.includes('editar')
    const disabled =
        pathname.includes(admin.id.toString()) || pathname.includes('adicionar') || pathname.includes('editar')

    return (
        <ErrorBoundary fallbackComponent={<strong className='error-strong'>Erro crítico em conteúdos</strong>}>
            <PageHeader
                placeholder={`Pesquisar em "conteúdo"`}
                buttonValue={showButton ? `+ Adicionar Conteúdos` : ''}
                buttonHref={showButton ? actionHref : ''}
                disabledFunctions={disabled}
                listForFilter={data}
            />

            {children}
        </ErrorBoundary>
    )
}
