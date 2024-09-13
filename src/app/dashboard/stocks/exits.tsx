import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralTable from '@/components/tables/GeralTable'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import { FC, Suspense, useEffect, useState } from 'react'
import useSWR from 'swr'

const tableHeaders = ['Produto', 'Classe', 'Quantidade utilizada', 'Propriedade', 'Lavoura', 'Safra', 'Criado em', '']

interface InputsRowsProps {
    searchQuery?: string
}

function InputsRows({ searchQuery }: InputsRowsProps) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    const getType = (type: number) => {
        if (type == 1) {
            return 'Semente'
        } else if (type == 2) {
            return 'Defensivo'
        } else {
            return 'Fertilizante'
        }
    }

    const { searchPage } = useSearch()
    const { data, isLoading, error } = useSWR(
        `/api/stocks/exits/list/${admin.id}?filter=${searchPage}&page=${activePage}${searchQuery}`,
        getFetch,
    )

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de saídas`, state: 'danger' })
            }
        }
    }, [error])

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 100))
        }
    }, [data])

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {data &&
                data.exits &&
                data.exits.map((entry: any, index: number) => (
                    <TableRow key={index} gridColumns={`repeat(${tableHeaders.length - 1}, 1fr) 0.01fr`}>
                        <div data-type='content'>
                            <p
                                title={`${entry.stock?.product?.name} ${
                                    entry.stock?.product_variant ? `- ${entry.stock?.product_variant}` : ''
                                }`}>
                                {entry?.stock.product.name}{' '}
                                {entry.stock?.product_variant ? `- ${entry.stock?.product_variant}` : ''}
                            </p>
                        </div>

                        <div data-type='content'>
                            <p title={getType(entry?.stock.product.type)}>{getType(entry?.stock.product.type)}</p>
                        </div>

                        <div data-type='content'>
                            <p
                                title={`${formatNumberToBR(entry?.quantity)}`}>{`${formatNumberToBR(entry?.quantity)}`}</p>
                        </div>

                        <div data-type='content'>
                            <p title={entry?.crop_join.property.name}>{entry?.crop_join.property.name}</p>
                        </div>

                        <div data-type='content'>
                            <p title={`${entry?.crop_join.crop.name} ${entry?.crop_join.subharvest_name ?? ''}`}>
                                {entry?.crop_join.crop.name} {entry?.crop_join.subharvest_name ?? ''}
                            </p>
                        </div>

                        <div data-type='content'>
                            <p title={entry?.crop_join.harvest.name}>{entry?.crop_join.harvest.name}</p>
                        </div>

                        <div data-type='content'>
                            <p>{entry.created_at}</p>
                        </div>

                        <div></div>
                    </TableRow>
                ))}

            <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

            {!data ||
                !data.exits ||
                (data.exits.length == 0 && <TableRow emptyString='Nenhuma saída encontrada' columnsCount={1} />)}
        </>
    )
}

const Exits: FC<InputsRowsProps> = ({ searchQuery }) => {
    return (
        <GeralTable headers={tableHeaders} gridColumns={`repeat(${tableHeaders.length - 1}, 1fr) 0.01fr`}>
            <Suspense fallback={<TableSkeleton />}>
                <ErrorBoundary
                    fallbackComponent={<strong className='error-strong'>Erro crítico ao carregar a tabela</strong>}>
                    <InputsRows searchQuery={searchQuery} />
                </ErrorBoundary>
            </Suspense>
        </GeralTable>
    )
}

export default Exits
