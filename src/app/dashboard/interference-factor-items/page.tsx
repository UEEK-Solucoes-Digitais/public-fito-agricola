'use client'

import PageHeader from '@/components/header/PageHeader'
import TableSkeleton from '@/components/loading/TableSkeleton'
import TableHeader from '@/components/tables/TableHeader'
import GeralTab from '@/components/tabs/GeralTab'
import { useAdmin } from '@/context/AdminContext'
import { useTab } from '@/context/TabContext'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { MouseEvent, useEffect, useState } from 'react'

const Diseases = dynamic(() => import('./disease'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Pests = dynamic(() => import('./pest'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Weeds = dynamic(() => import('./weed'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const headers = [
    {
        id: 'interference:daninhas',
        name: 'Daninhas',
    },
    {
        id: 'interference:doencas',
        name: 'Doenças',
    },
    {
        id: 'interference:pragas',
        name: 'Pragas',
    },
]

export default function Page() {
    const { admin } = useAdmin()
    const searchParams = useSearchParams()
    const searchTab = searchParams.get('tab')

    const [toggleCultureNewRow, setToggleCultureNewRow] = useState(false)
    const [toggleDefensiveNewRow, setToggleDefensiveNewRow] = useState(false)
    const [toggleFertilizerNewRow, setToggleFertilizerNewRow] = useState(false)
    const { selectedTab, setSelectedTab } = useTab()

    const selectedHeader = headers.find((h) => h.id == selectedTab)
    const buttonText = selectedHeader?.name ?? ''

    const handleAdd = () => {
        switch (selectedTab) {
            case 'interference:daninhas':
                setToggleCultureNewRow((state) => !state)
                break
            case 'interference:doencas':
                setToggleDefensiveNewRow((state) => !state)
                break
            case 'interference:pragas':
                setToggleFertilizerNewRow((state) => !state)
                break
        }
    }

    const handleChangeTab = (e: MouseEvent<HTMLButtonElement>) => {
        const tab = (e.target as HTMLInputElement).getAttribute('data-id')
        setSelectedTab(tab)
    }

    useEffect(() => {
        if (!selectedTab) {
            if (searchTab) {
                setSelectedTab(`interference:${searchTab}`)
            } else {
                setSelectedTab(`interference:daninhas`)
            }
        }
    }, [])

    return (
        <>
            <PageHeader placeholder={`Pesquisar em "${buttonText}"`} />

            <TableHeader
                title='Fatores de interferência'
                description='Confira abaixo a sua lista completa de fatores de interferência. Adicione novos clicando no botão acima à direita.'
                titleIcon='ph:intersect'
                buttonActionName={admin.access_level == 1 ? `+ Adicionar ${buttonText}` : ''}
                onButtonAction={admin.access_level == 1 ? handleAdd : undefined}
            />

            <GeralTab headers={headers} selectedId={selectedTab} onButtonClick={handleChangeTab} />

            {selectedTab == 'interference:daninhas' && (
                <Weeds toggleNewRow={toggleCultureNewRow} setToggleNewRow={setToggleCultureNewRow} />
            )}
            {selectedTab == 'interference:doencas' && (
                <Diseases toggleNewRow={toggleDefensiveNewRow} setToggleNewRow={setToggleDefensiveNewRow} />
            )}
            {selectedTab == 'interference:pragas' && (
                <Pests toggleNewRow={toggleFertilizerNewRow} setToggleNewRow={setToggleFertilizerNewRow} />
            )}
        </>
    )
}
