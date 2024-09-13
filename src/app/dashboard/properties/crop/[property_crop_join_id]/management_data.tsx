'use client'

import ElementSkeleton from '@/components/loading/ElementSkeleton'
import GeralTab from '@/components/tabs/GeralTab'
import { useSubTab } from '@/context/SubtabContext'
import dynamic from 'next/dynamic'
import { usePathname, useSearchParams } from 'next/navigation'
import { MouseEvent, useEffect } from 'react'
import styles from '../../styles.module.scss'
import { Crop } from '../../types'

const Seeds = dynamic(() => import('./management_data_pages/seeds'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const Population = dynamic(() => import('./management_data_pages/population'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const Fertilizers = dynamic(() => import('./management_data_pages/fertlizers'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const Defensives = dynamic(() => import('./management_data_pages/defensives'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const Harvest = dynamic(() => import('./management_data_pages/harvest'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

interface ManagementDataProps {
    propertyCropJoinId: number
    crop: Crop | undefined
    setCrop: any
}

const headers = [
    {
        id: 'sementes',
        name: 'Sementes',
        icon: 'ph:circles-three',
    },
    {
        id: 'populacao',
        name: 'População',
        icon: 'ph:tree-evergreen',
    },
    {
        id: 'fertilizantes',
        name: 'Fertilizantes',
        icon: 'ph:dots-six-light',
    },
    {
        id: 'defensivos',
        name: 'Defensivos',
        icon: 'ph:shield-check',
    },
    {
        id: 'colheita',
        name: 'Colheita',
        icon: 'iconoir:square-dashed',
    },
]

export default function ManagementData({ propertyCropJoinId, crop, setCrop }: ManagementDataProps) {
    const { selectedSubTab, setSelectedSubTab } = useSubTab()
    const pathname = usePathname()

    const searchParams = useSearchParams()
    const searchTab = searchParams.get('subtab')

    function getSearchTab() {
        // removendo subtab da query caso haja
        const search = window.location.search
        const searchParams = new URLSearchParams(search)
        searchParams.delete('subtab')
        return searchParams.toString()
    }

    useEffect(() => {
        if (searchTab && searchTab != null) {
            setSelectedSubTab(searchTab)
        } else if (selectedSubTab == '' || selectedSubTab == null) {
            setSelectedSubTab('sementes')
        }
    }, [crop])

    const handleChangeTab = async (e: MouseEvent<HTMLButtonElement>) => {
        const tab = (e.target as HTMLButtonElement).getAttribute('data-id')

        if (tab && tab != selectedSubTab) {
            setSelectedSubTab(tab)
        }
    }

    useEffect(() => {
        window.history.pushState(
            { filter: true },
            selectedSubTab,
            `${pathname}?${getSearchTab()}&subtab=${selectedSubTab}`,
        )
    }, [selectedSubTab])

    return (
        <>
            <div className={styles.tabMobile}>
                <GeralTab headers={headers} selectedId={selectedSubTab} onButtonClick={handleChangeTab} isDropdown />
            </div>

            <div className={styles.defaultBorderContentBox}>
                {selectedSubTab == 'sementes' && (
                    <Seeds crop={crop} propertyCropJoinId={propertyCropJoinId} setCrop={setCrop} />
                )}
                {selectedSubTab == 'populacao' && <Population propertyCropJoinId={propertyCropJoinId} />}
                {selectedSubTab == 'fertilizantes' && (
                    <Fertilizers crop={crop} propertyCropJoinId={propertyCropJoinId} />
                )}
                {selectedSubTab == 'defensivos' && <Defensives crop={crop} propertyCropJoinId={propertyCropJoinId} />}
                {selectedSubTab == 'colheita' && <Harvest crop={crop} propertyCropJoinId={propertyCropJoinId} />}
            </div>
        </>
    )
}
