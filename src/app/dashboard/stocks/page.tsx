'use client'

import Property from '@/@types/Property'
import PageHeader from '@/components/header/PageHeader'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import TableHeader from '@/components/tables/TableHeader'
import GeralTab from '@/components/tabs/GeralTab'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import useDebounce from '@/utils/debounce'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { ChangeEvent, MouseEvent, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import Loading from '../loading'
import { Crop } from '../properties/types'
import styles from './styles.module.scss'
import { TabTypes } from './types'

const Products = dynamic(() => import('./products'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Incoming = dynamic(() => import('./incoming'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Exits = dynamic(() => import('./exits'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const headers = [
    {
        id: '1',
        name: 'Produtos em estoque',
    },
    {
        id: '2',
        name: 'Entradas',
    },
    {
        id: '3',
        name: 'Saídas',
    },
]

interface FilterOptions {
    properties_id: string[]
    crops_id: string[]
    harvests_id: string[]
    product_type: string
    products_id: string[]
    not_show_zero: string
}

export default function Page() {
    const [tab, setTab] = useState<TabTypes>(1)
    const [search, setSearch] = useState('')
    const [showProductModal, setShowProductModal] = useState(false)
    const [showIncomingModal, setIncomingModal] = useState(false)
    const { admin } = useAdmin()
    const { setToast } = useNotification()
    const [query, setQuery] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebounce(search, 500)

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        properties_id: [],
        crops_id: [],
        harvests_id: [],
        product_type: '',
        products_id: [],
        not_show_zero: '0',
    })

    const { data, isLoading } = useSWR(`/api/reports/get-filters-options/${admin.id}?with=products`, getFetch)

    const handleSetTab = (e: MouseEvent<HTMLButtonElement>) => {
        const id = (e.target as HTMLInputElement).getAttribute('data-id')

        if (id) {
            const numericId = parseInt(id)
            if (numericId == 1 || numericId == 2 || numericId == 3) {
                setTab(numericId as TabTypes)
            }
        }
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
        setFilterOptions({ ...filterOptions, [name]: value })
    }

    const handleInputArrayChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = event.target

        if (value != '0') {
            const values = filterOptions[name as keyof FilterOptions]
            if (!values.includes(value)) {
                setFilterOptions({ ...filterOptions, [name]: [...values, value.toString()] })
            }
        }
    }

    const removeItem = (name: string, item: string) => {
        const values = filterOptions[name as keyof FilterOptions]

        if (Array.isArray(values)) {
            const index = values.indexOf(item.toString())

            if (index > -1) {
                values.splice(index, 1)
            }
        }

        setFilterOptions({
            ...filterOptions,
            [name]: values,
        })
    }

    const filterStock = () => {
        setSearchQuery(query)
    }

    async function reportFile(type: number) {
        try {
            setToast({ text: `Requisitando arquivo, isso pode demorar alguns minutos`, state: 'loading' })

            const response = await axios.get(
                `/api/reports/list/${admin.id}/stocks?tab=${tab}&properties_id=${filterOptions.properties_id.join(',')}&product_type=${filterOptions.product_type}
                &products_id=${filterOptions.products_id.join(',')}&crops_id=${filterOptions.crops_id.join(',')}&export=true&export_type=${type}`,
            )

            if (response.data.status == 200 && response.data.file_dump) {
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

    useEffect(() => {
        setQuery('')
        if (filterOptions.properties_id.length > 0) {
            setQuery((prev) => `${prev}&properties_id=${filterOptions.properties_id.join(',')}`)
        } else {
            setQuery((prev) => `${prev}`)
        }

        if (filterOptions.crops_id.length > 0) {
            setQuery((prev) => `${prev}&crops_id=${filterOptions.crops_id.join(',')}`)
        } else {
            setQuery((prev) => `${prev}`)
        }

        if (filterOptions.harvests_id.length > 0) {
            setQuery((prev) => `${prev}&harvests_id=${filterOptions.harvests_id.join(',')}`)
        } else {
            setQuery((prev) => `${prev}`)
        }

        if (filterOptions.product_type) {
            setQuery((prev) => `${prev}&product_type=${filterOptions.product_type}`)
        } else {
            setQuery((prev) => `${prev}`)
        }

        if (filterOptions.products_id.length > 0) {
            setQuery((prev) => `${prev}&products_id=${filterOptions.products_id.join(',')}`)
        } else {
            setQuery((prev) => `${prev}`)
        }
        if (filterOptions.not_show_zero == '1') {
            setQuery((prev) => `${prev}&not_show_zero=${filterOptions.not_show_zero}`)
        } else {
            setQuery((prev) => `${prev}`)
        }
    }, [filterOptions])

    useEffect(() => {
        setShowProductModal(false)
        setIncomingModal(false)
        setSearch('')

        switch (tab) {
            case 1:
                mutate(`/api/stocks/products/list/${admin.id}/${debouncedSearch}?page=1${query}`)
                break
            case 2:
                mutate(`/api/stocks/incoming/list/${admin.id}/${debouncedSearch}?page=1${query}`)
                break
            case 3:
                mutate(`/api/stocks/exits/list/${admin.id}/${debouncedSearch}?page=1${query}`)
                break
        }
    }, [debouncedSearch, tab, admin.id])

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <PageHeader placeholder={`Pesquisar em "Produtos"`} />

            <TableHeader
                title='Estoque'
                titleIcon='ph:warehouse'
                // buttonActionName='+ Adicionar produto'
                // onButtonAction={() => setShowProductModal((state) => !state)}
                buttonActionName={tab == 2 ? 'Registrar entrada' : ''}
                onButtonAction={() => setIncomingModal((state) => !state)}
                secondButtonActionName='Exportar PDF'
                thirdButtonActionName='Exportar XLSX'
                onSecondButtonAction={() => reportFile(2)}
                onThirdButtonAction={() => reportFile(1)}
                filter
                onFilterButtonClick={filterStock}>
                <div className={styles.filterGroup}>
                    <GeralInput
                        name='properties_id'
                        label='Propriedade'
                        type='select'
                        onChange={handleInputArrayChange}>
                        <option value='0'>Selecione</option>

                        {data &&
                            data.properties.map((property: Property) => (
                                <option key={property.id} value={property.id}>
                                    {property.name}
                                </option>
                            ))}
                    </GeralInput>

                    <div className={styles.filterOptions}>
                        {data &&
                            data.properties.map(
                                (property: Property) =>
                                    filterOptions.properties_id.includes(property.id.toString()) && (
                                        <div key={property.id} className={styles.filterOptionItem}>
                                            {property.name}

                                            <button onClick={() => removeItem('properties_id', property.id.toString())}>
                                                <IconifyIcon icon='ph:x' />
                                            </button>
                                        </div>
                                    ),
                            )}
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <GeralInput name='crops_id' label='Lavoura' type='select' onChange={handleInputArrayChange}>
                        <option value='0'>Selecione</option>

                        {data &&
                            data.crops.map(
                                (crop: Crop) =>
                                    filterOptions.properties_id.length == 0 ||
                                    (crop.property_id &&
                                        filterOptions.properties_id.includes(crop.property_id.toString()) && (
                                            <option key={crop.id} value={crop.id}>
                                                {crop.name}
                                            </option>
                                        )),
                            )}
                    </GeralInput>

                    <div className={styles.filterOptions}>
                        {data &&
                            data.crops.map(
                                (crop: Crop) =>
                                    filterOptions.crops_id.includes(crop.id.toString()) && (
                                        <div key={crop.id} className={styles.filterOptionItem}>
                                            {crop.name}

                                            <button onClick={() => removeItem('crops_id', crop.id.toString())}>
                                                <IconifyIcon icon='ph:x' />
                                            </button>
                                        </div>
                                    ),
                            )}
                    </div>
                </div>

                <GeralInput
                    name='product_type'
                    label='Classe'
                    type='select'
                    onChange={handleInputChange}
                    defaultValue={filterOptions.product_type}>
                    <option value='0'>Selecione</option>
                    <option value='4'>Adjuvante</option>
                    <option value='5'>Biológico</option>
                    <option value='3'>Fertilizantes</option>
                    <option value='6'>Fertilizante foliar</option>
                    <option value='7'>Fungicida</option>
                    <option value='8'>Herbicida</option>
                    <option value='9'>Inseticida</option>
                    <option value='1'>Sementes</option>
                </GeralInput>

                <div className={styles.filterGroup}>
                    <GeralInput name='products_id' label='Produtos' type='select' onChange={handleInputArrayChange}>
                        <option value='0'>Selecione</option>

                        {data &&
                            data.products
                                .filter((item: any) => {
                                    if (filterOptions.product_type == '0') {
                                        return true
                                    }

                                    if (parseInt(filterOptions.product_type) < 4) {
                                        return item.type == parseInt(filterOptions.product_type)
                                    } else {
                                        return item.object_type == parseInt(filterOptions.product_type) - 3
                                    }
                                })
                                .map((product: any) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                    </GeralInput>

                    <div className={styles.filterOptions}>
                        {data &&
                            data.products.map(
                                (product: any) =>
                                    filterOptions.products_id.includes(product.id.toString()) && (
                                        <div key={product.id} className={styles.filterOptionItem}>
                                            {product.name}

                                            <button onClick={() => removeItem('products_id', product.id.toString())}>
                                                <IconifyIcon icon='ph:x' />
                                            </button>
                                        </div>
                                    ),
                            )}
                    </div>
                </div>

                {tab == 1 && (
                    <GeralInput
                        variant='switch'
                        value='1'
                        name='not_show_zero'
                        type='checkbox'
                        label='Esconder estoque zerado'
                        on={1}
                        onChange={() => {
                            setFilterOptions({
                                ...filterOptions,
                                not_show_zero: filterOptions.not_show_zero == '1' ? '0' : '1',
                            })
                        }}
                    />
                )}
            </TableHeader>

            <ErrorBoundary fallbackComponent={<strong className='error-strong'>Erro crítico ao carregar bloco</strong>}>
                <>
                    <GeralTab headers={headers} selectedId={tab} onButtonClick={handleSetTab} />

                    {(tab == 1 || showProductModal) && (
                        <Products
                            showProductModal={showProductModal}
                            setShowProductModal={setShowProductModal}
                            onlyModal={tab != 1 && showProductModal}
                            tab={tab}
                            searchQuery={searchQuery}
                        />
                    )}

                    {tab == 2 && (
                        <Incoming
                            showIncomingModal={showIncomingModal}
                            setIncomingModal={setIncomingModal}
                            searchQuery={searchQuery}
                            filterOptions={data}
                        />
                    )}

                    {tab == 3 && <Exits searchQuery={searchQuery} />}
                </>
            </ErrorBoundary>
        </>
    )
}
