import LevelTarget from '@/components/elements/LevelTarget'
import GeralTable from '@/components/tables/GeralTable'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import tableStyles from '@/components/tables/styles.module.scss'
import { useAdmin } from '@/context/AdminContext'
import { getNumber } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { FC, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import Loading from '../loading'
import { ReportTableProps } from './types.d'

export const ApplicationTable: FC<ReportTableProps> = ({ currentQuery, setUrl }) => {
    const headers = [
        '#',
        'Propriedade',
        'Plantio',
        'Ano agrícola',
        'Cultura',
        'Cultivar',
        'Lavoura',
        'N•',
        'DAP',
        'DAE',
        'Data',
        'DEPPA',
        'DEPUA',
        'DAA',
        'Estádio',
        '',
    ]
    const style = `0.2fr 1.2fr 0.8fr 0.6fr 0.5fr 1fr 1fr 0.3fr repeat(2, 0.45fr) 0.8fr repeat(2, 0.5fr) 0.45fr 1.2fr 0.01fr`

    const { admin } = useAdmin()

    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)
    let pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

    const { data, isLoading } = useSWR(`/api/reports/list/${admin.id}/application${currentQuery}${pageParam}`, getFetch)

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        setActivePage(1)
        pageParam = currentQuery.includes('?') ? `&page=${activePage}` : `?page=${activePage}`

        const url = `/api/reports/list/${admin.id}/application${currentQuery}${pageParam}`
        setUrl(url)
        mutate(url)
    }, [currentQuery])

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 20))
        }
    }, [data])

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <GeralTable
                headers={headers}
                gridColumns={style}
                customClasses={[
                    tableStyles.reportTable,
                    tableStyles.clickableRow,
                    tableStyles.withPaddingTop,
                    tableStyles.relativePosition,
                ]}>
                <div className={tableStyles.applicationExposition}></div>
                {data && data.reports ? (
                    data.reports.map((item: any, index: number) => (
                        <TableRow
                            key={item?.id ?? index + 1}
                            gridColumns={style}
                            href={`/dashboard/propriedades/lavoura/${item?.id}`}
                            customClasses={item?.application_number % 2 == 0 ? [tableStyles.sort] : []}>
                            <div data-type='content'>
                                <p>{activePage > 1 ? getNumber(index, activePage) : index + 1}</p>
                            </div>

                            <div data-type='content'>
                                <p title={item.property?.name}>{item.property?.name}</p>
                            </div>

                            <div data-type='content'>
                                <p title={item.date_plant}>{item.date_plant}</p>
                            </div>

                            <div data-type='content'>
                                <p title={item.harvest.name}>{item.harvest.name}</p>
                            </div>

                            <div data-type='content'>
                                <div
                                    title={item.culture_table.replaceAll('<br>', '')}
                                    dangerouslySetInnerHTML={{ __html: item.culture_table }}></div>
                            </div>

                            <div data-type='content'>
                                <div
                                    title={item.culture_code_table.replaceAll('<br>', '')}
                                    dangerouslySetInnerHTML={{ __html: item.culture_code_table }}></div>
                            </div>

                            <div data-type='content'>
                                <p title={`${item.crop?.name} ${item.subharvest_name ?? ''}`}>
                                    {item.crop?.name ?? '--'} {item.subharvest_name ?? ''}
                                </p>
                            </div>

                            <div data-type='content'>
                                <p title={item.application_number}>{item.application_number ?? '--'}</p>
                            </div>

                            <div data-type='content'>
                                <p title={item.plant_table}>
                                    {item.plant_table != '--' ? (
                                        <LevelTarget defaultLevel={false} color={1} text={item.plant_table} />
                                    ) : (
                                        item.plant_table
                                    )}
                                </p>
                            </div>

                            <div data-type='content'>
                                <p title={item.emergency_table}>
                                    {item.emergency_table != '--' ? (
                                        <LevelTarget defaultLevel={false} color={1} text={item.emergency_table} />
                                    ) : (
                                        item.emergency_table
                                    )}
                                </p>
                            </div>

                            <div data-type='content'>
                                <p title={item.application_date_table}>{item.application_date_table ?? '--'}</p>
                            </div>

                            <div data-type='content'>
                                <p title={item.days_between_plant_and_first_application}>
                                    {item.days_between_plant_and_first_application != '--' ? (
                                        <LevelTarget
                                            defaultLevel={false}
                                            color={1}
                                            text={item.days_between_plant_and_first_application}
                                        />
                                    ) : (
                                        item.days_between_plant_and_first_application
                                    )}
                                </p>
                            </div>

                            <div data-type='content'>
                                <p title={item.days_between_plant_and_last_application}>
                                    {item.days_between_plant_and_last_application != '--' ? (
                                        <LevelTarget
                                            defaultLevel={false}
                                            color={1}
                                            text={item.days_between_plant_and_last_application}
                                        />
                                    ) : (
                                        item.days_between_plant_and_last_application
                                    )}
                                </p>
                            </div>

                            <div data-type='content'>
                                <p title={item.application_table}>
                                    {item.application_table != '--' ? (
                                        <LevelTarget defaultLevel={false} color={1} text={item.application_table} />
                                    ) : (
                                        item.application_table
                                    )}
                                </p>
                            </div>

                            <div data-type='content'>
                                <p title={item.stage_table}>{item.stage_table}</p>
                            </div>
                        </TableRow>
                    ))
                ) : (
                    <p>Nenhum dado encontrado</p>
                )}

                <TablePagination
                    alignLeft={true}
                    pages={pageNumbers}
                    onPageChange={handlePageChange}
                    active={activePage}
                />
            </GeralTable>
        </>
    )
}
