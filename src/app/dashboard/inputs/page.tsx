'use client'

import PageHeader from '@/components/header/PageHeader'
import TableSkeleton from '@/components/loading/TableSkeleton'
import TableHeader from '@/components/tables/TableHeader'
import GeralTab from '@/components/tabs/GeralTab'
import { useAdmin } from '@/context/AdminContext'
import { useTab } from '@/context/TabContext'
import useDebounce from '@/utils/debounce'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { MouseEvent, useEffect, useState } from 'react'
import { mutate } from 'swr'

const Cultures = dynamic(() => import('./(modules)/cultures'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Defensives = dynamic(() => import('./(modules)/defensives'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Fertilizers = dynamic(() => import('./(modules)/fertilizers'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const headers = [
    {
        id: 'input:culturas',
        name: 'Culturas',
    },
    {
        id: 'input:defensivos',
        name: 'Defensivos',
    },
    {
        id: 'input:fertilizantes',
        name: 'Fertilizantes',
    },
]

export default function Page() {
    const searchParams = useSearchParams()
    const searchTab = searchParams.get('tab')

    const [toggleCultureNewRow, setToggleCultureNewRow] = useState(false)
    const [toggleDefensiveNewRow, setToggleDefensiveNewRow] = useState(false)
    const [toggleFertilizerNewRow, setToggleFertilizerNewRow] = useState(false)
    const { selectedTab, setSelectedTab } = useTab()

    const { admin } = useAdmin()
    const selectedHeader = headers.find((h) => h.id == selectedTab)
    const buttonText = selectedHeader?.name ?? ''

    const handleAdd = () => {
        switch (selectedTab) {
            case 'input:culturas':
                setToggleCultureNewRow((state) => !state)
                break
            case 'input:defensivos':
                setToggleDefensiveNewRow((state) => !state)
                break
            case 'input:fertilizantes':
                setToggleFertilizerNewRow((state) => !state)
                break
        }
    }

    const handleChangeTab = (e: MouseEvent<HTMLButtonElement>) => {
        const tab = (e.target as HTMLInputElement).getAttribute('data-id')
        setSelectedTab(tab)
    }

    const [search] = useState('')
    const debouncedSearch = useDebounce(search, 500)

    useEffect(() => {
        switch (selectedTab) {
            case 'input:cultures':
                mutate(`/api/inputs/cultures/list/${debouncedSearch}`)
                break
            case 'input:defensives':
                mutate(`/api/inputs/defensives/list/${debouncedSearch}`)
                break
            case 'input:fertilizers':
                mutate(`/api/inputs/fertilizers/list/${debouncedSearch}`)
                break
        }
    }, [debouncedSearch, selectedTab])

    useEffect(() => {
        if (!selectedTab) {
            if (searchTab) {
                setSelectedTab(`input:${searchTab}`)
            } else {
                setSelectedTab(`input:culturas`)
            }
        }
    }, [])

    return (
        <>
            <PageHeader placeholder={`Pesquisar em "${buttonText}"`} />

            <TableHeader
                title='Insumos'
                description='Confira abaixo a sua lista completa de insumos. Adicione novos clicando no botão acima à direita.'
                buttonActionName={admin.access_level == 1 ? `+ Adicionar ${buttonText}` : ''}
                onButtonAction={admin.access_level == 1 ? handleAdd : undefined}
            />

            <GeralTab headers={headers} selectedId={selectedTab} onButtonClick={handleChangeTab} />

            {selectedTab == 'input:culturas' && (
                <Cultures toggleNewRow={toggleCultureNewRow} setToggleNewRow={setToggleCultureNewRow} />
            )}
            {selectedTab == 'input:defensivos' && (
                <Defensives toggleNewRow={toggleDefensiveNewRow} setToggleNewRow={setToggleDefensiveNewRow} />
            )}
            {selectedTab == 'input:fertilizantes' && (
                <Fertilizers toggleNewRow={toggleFertilizerNewRow} setToggleNewRow={setToggleFertilizerNewRow} />
            )}
        </>
    )
}
