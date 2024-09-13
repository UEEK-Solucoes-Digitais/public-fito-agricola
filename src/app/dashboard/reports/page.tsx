'use client'

import PageHeader from '@/components/header/PageHeader'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import TableHeader from '@/components/tables/TableHeader'
import GeralTab from '@/components/tabs/GeralTab'
import { useTab } from '@/context/TabContext'
import { useNotification } from '@/context/ToastContext'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import html2canvas from 'html2canvas'
import Cookies from 'js-cookie'
import dynamic from 'next/dynamic'
import { usePathname, useSearchParams } from 'next/navigation'
import { FC, MouseEvent, useEffect, useRef, useState } from 'react'
import { ApplicationTable } from './application-table'
import { CultureTab } from './culture-tab'
import { DiseasesTable } from './diseases-table'
import { GeralTableComponent } from './geral-table'
import { InputsTable } from './inputs-table'
import { MonitoringTable } from './monitoring-table'
import { PestsTable } from './pests-table'
import { ProductivityGraph } from './productivity-graph'
import { ProductivityTable } from './productivity-table'
import styles from './productivity.module.scss'
import { RainGaugeTable } from './rain-gauge-table'
import { SeedTable } from './seeds-table'
import { WeedsTable } from './weeds-table'

const GeralFilter = dynamic(() => import('@/components/forms/reports/GeralFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const PestsFilter = dynamic(() => import('@/components/forms/reports/PestsFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const WeedFilter = dynamic(() => import('@/components/forms/reports/WeedFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const DiseaseFilter = dynamic(() => import('@/components/forms/reports/DiseaseFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const InputsFilter = dynamic(() => import('@/components/forms/reports/InputsFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const SeedsFilter = dynamic(() => import('@/components/forms/reports/SeedsFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const ApplicationFilter = dynamic(() => import('@/components/forms/reports/ApplicationFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const RainGaugeFilter = dynamic(() => import('@/components/forms/reports/RainGaugeFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const MonitoringFilter = dynamic(() => import('@/components/forms/reports/MonitoringFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const ProductivityFilter = dynamic(() => import('@/components/forms/reports/ProductivityFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const CultureFilter = dynamic(() => import('@/components/forms/reports/CultureFilter'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

// geral, pragas, daninhas, doenças, insumos, sementes, aplicação, pluviômetro, monitoramentos, produtividade, cultivares
const headers = [
    {
        id: 'report:geral',
        name: 'Geral',
    },
    {
        id: 'report:pragas',
        name: 'Pragas',
    },
    {
        id: 'report:daninhas',
        name: 'Daninhas',
    },
    {
        id: 'report:doencas',
        name: 'Doenças',
    },
    {
        id: 'report:insumos',
        name: 'Insumos',
    },
    {
        id: 'report:sementes',
        name: 'Sementes',
    },
    {
        id: 'report:aplicacao',
        name: 'Fungicidas',
    },
    {
        id: 'report:pluviometro',
        name: 'Pluviômetro',
    },
    {
        id: 'report:monitoramentos',
        name: 'Monitoramentos',
    },
    {
        id: 'report:produtividade',
        name: 'Produtividade',
    },
    {
        id: 'report:cultura',
        name: 'Cultura',
    },
]

const Report: FC = () => {
    const { setToast } = useNotification()

    const pathname = usePathname()
    const { selectedTab, setSelectedTab } = useTab()
    const searchParams = useSearchParams()
    const searchTab = searchParams.get('tab')
    const cookieHarvest = Cookies.get('cookie_harvest')

    const [currentQuery, setCurrentQuery] = useState('')
    const [filterQuery, setFilterQuery] = useState('')

    const [urlQuery, setUrlQuery] = useState('')

    const divRef = useRef<HTMLDivElement | null>(null)

    const handleChangeTab = (e: MouseEvent<HTMLButtonElement>) => {
        const tab = (e.target as HTMLInputElement).getAttribute('data-id')

        if (tab !== selectedTab) {
            // setFilterQuery('');
            // setCurrentQuery('');
            setSelectedTab(tab)
        }
    }

    async function exportImage(name: string) {
        setToast({ text: `Gerando imagem`, state: 'loading' })
        if (divRef?.current) {
            divRef.current.classList.add('toExport')
            divRef.current.style.background = '#fff'
            divRef.current.style.padding = '15px'

            const canvas = await html2canvas(divRef.current)
            const image = canvas.toDataURL('image/png', 1.0)
            download(image, `relatorio-${name}.png`)

            // Remove a classe após a geração da imagem
            divRef.current.classList.remove('toExport')
            divRef.current.style.background = 'transparent'
            divRef.current.style.padding = '0'

            setToast({ text: `Imagem gerada com sucesso`, state: 'success' })
        } else {
            setToast({ text: `Não foi possível gerar a imagem`, state: 'danger' })
        }
    }

    // Função auxiliar para disparar o download
    const download = (href: string, name: string) => {
        const link = document.createElement('a')
        link.href = href
        link.download = name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    async function reportFile(type: number) {
        try {
            if (!urlQuery) {
                setToast({ text: 'Verifique se uma das abas está selecionada', state: 'warning' })
                return
            }

            const exportParam = urlQuery.includes('?')
                ? `&export=true&export_type=${type}`
                : `?export=true&export_type=${type}`
            const newUrl = `${urlQuery}${exportParam}`

            setToast({ text: `Requisitando arquivo, isso pode demorar alguns minutos`, state: 'loading' })

            const response = await axios.get(newUrl)

            if (response.data.status == 200 && response.data.file_dump) {
                // checkFile(response.data.file_dump);
                const fileUrl = response.data.file_dump
                setToast({ text: `O download será iniciado em instantes`, state: 'success' })

                if (typeof window !== 'undefined') {
                    window.open(fileUrl, '_blank')
                }
            } else {
                setToast({ text: response.data.msg || 'Não foi possível iniciar o download', state: 'danger' })
            }
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const handleSetCurrentQuery = () => {
        let query = filterQuery

        if (
            !query.includes('harvests_id') &&
            cookieHarvest != null &&
            cookieHarvest !== 'null' &&
            cookieHarvest !== 'undefined' &&
            cookieHarvest !== ''
        ) {
            query = query + `${query.includes('?') ? '&' : '?'}harvests_id=${cookieHarvest}`
            setFilterQuery(query)
        }

        setCurrentQuery(query)
    }

    useEffect(() => {
        if (
            !filterQuery.includes('harvests_id') &&
            cookieHarvest != null &&
            cookieHarvest !== 'null' &&
            cookieHarvest !== 'undefined' &&
            cookieHarvest !== ''
        ) {
            setFilterQuery(filterQuery + `${filterQuery.includes('?') ? '&' : '?'}harvests_id=${cookieHarvest}`)
            setCurrentQuery(currentQuery + `${filterQuery.includes('?') ? '&' : '?'}harvests_id=${cookieHarvest}`)
        }

        if (searchTab) {
            setSelectedTab(`report:${searchTab}`)
        } else {
            if (!selectedTab) {
                setSelectedTab(`report:geral`)
                window.history.pushState({ filter: true }, selectedTab, `${pathname}?tab=geral`)
            }
        }
    }, [])

    return (
        <>
            <PageHeader showOptions={false} disabledFunctions={true} />

            <TableHeader
                title='Relatórios'
                description='Relatórios disponíveis. Algumas tabelas ultrapassam o limite da tela, sendo necessário arrastar a barra para o lado'
                titleIcon='ph:chart-pie-slice'
                filter
                onFilterButtonClick={() => handleSetCurrentQuery()}
                buttonActionName={selectedTab !== 'report:cultura' ? `Exportar XLSX` : 'Exportar PNG'}
                secondButtonActionName={selectedTab !== 'report:cultura' ? `Exportar PDF` : ''}
                onButtonAction={() => (selectedTab !== 'report:cultura' ? reportFile(1) : exportImage('cultura'))}
                onSecondButtonAction={() => reportFile(2)}
                thirdButtonActionName={selectedTab !== 'report:monitoramentos' ? '' : 'Exportar PNG'}
                onThirdButtonAction={
                    selectedTab !== 'report:monitoramentos' ? undefined : () => exportImage('monitoramentos')
                }>
                {selectedTab == 'report:geral' && (
                    <GeralFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:pragas' && (
                    <PestsFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:daninhas' && (
                    <WeedFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:doencas' && (
                    <DiseaseFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:insumos' && (
                    <InputsFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:sementes' && (
                    <SeedsFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:aplicacao' && (
                    <ApplicationFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:pluviometro' && (
                    <RainGaugeFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:monitoramentos' && (
                    <MonitoringFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:produtividade' && (
                    <ProductivityFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}

                {selectedTab == 'report:cultura' && (
                    <CultureFilter currentQuery={filterQuery} setCurrentQuery={setFilterQuery} />
                )}
            </TableHeader>

            <div className={styles.reportTab}>
                <GeralTab
                    headers={headers}
                    selectedId={selectedTab}
                    onButtonClick={handleChangeTab}
                    variant='buttons'
                    isSwiper
                    isDropdown
                />
            </div>

            {selectedTab == 'report:geral' && <GeralTableComponent currentQuery={currentQuery} setUrl={setUrlQuery} />}
            {selectedTab == 'report:pragas' && <PestsTable currentQuery={currentQuery} setUrl={setUrlQuery} />}
            {selectedTab == 'report:daninhas' && <WeedsTable currentQuery={currentQuery} setUrl={setUrlQuery} />}
            {selectedTab == 'report:doencas' && <DiseasesTable currentQuery={currentQuery} setUrl={setUrlQuery} />}
            {selectedTab == 'report:insumos' && <InputsTable currentQuery={currentQuery} setUrl={setUrlQuery} />}
            {selectedTab == 'report:sementes' && <SeedTable currentQuery={currentQuery} setUrl={setUrlQuery} />}
            {selectedTab == 'report:aplicacao' && (
                <ApplicationTable currentQuery={currentQuery} setUrl={setUrlQuery} />
            )}
            {selectedTab == 'report:pluviometro' && (
                <RainGaugeTable currentQuery={currentQuery} setUrl={setUrlQuery} />
            )}
            {selectedTab == 'report:monitoramentos' && (
                <div ref={divRef} style={{ boxShadow: 'none' }}>
                    <MonitoringTable currentQuery={currentQuery} setUrl={setUrlQuery} />
                </div>
            )}
            {selectedTab == 'report:produtividade' && (
                <>
                    <div
                        ref={divRef}
                        style={{
                            boxShadow: 'none',
                            borderRadius: '20px',
                        }}>
                        <ProductivityGraph currentQuery={currentQuery} setUrl={setUrlQuery} />
                    </div>
                    <div style={{ marginTop: '30px' }}>
                        <ProductivityTable currentQuery={currentQuery} setUrl={setUrlQuery} />
                    </div>
                </>
            )}
            {selectedTab == 'report:cultura' && (
                <div ref={divRef} style={{ backgroundColor: '#ffffff', boxShadow: 'none', borderRadius: '20px' }}>
                    <CultureTab currentQuery={currentQuery} setUrl={setUrlQuery} />
                </div>
            )}
        </>
    )
}

export default Report
