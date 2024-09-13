'use client'

import TableHeader from '@/components/tables/TableHeader'
import GeralTab from '@/components/tabs/GeralTab'
import ErrorBoundary from '@/document/ErrorBoundary'
import useDebounce from '@/utils/debounce'
import { ChangeEvent, MouseEvent, useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'

import Property from '@/@types/Property'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import { useAdmin } from '@/context/AdminContext'
import getFetch from '@/utils/getFetch'
import { TabTypes } from './types'

import Loading from '@/app/loading'
import PageHeader from '@/components/header/PageHeader'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import { useNotification } from '@/context/ToastContext'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import styles from './styles.module.scss'

// Lazy Components
const People = dynamic(() => import('./people/people'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Suppliers = dynamic(() => import('./suppliers/suppliers'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Accounts = dynamic(() => import('./accounts/accounts'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Clients = dynamic(() => import('./clients/clients'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})

const Banks = dynamic(() => import('./banks/banks'), {
    ssr: false,
    loading: () => <TableSkeleton />,
})




interface FilterOptions {
    properties_id: string[]
    crops_id: string[]
    harvests_id: string[]
    product_type: string
    products_id: string[]
    not_show_zero: string
}

export default function Page() {
    const [showDeleteUserModal, setShowDeleteUserModal] = useState<boolean>(false);
    const [deleteRoute, setDeleteRoute] = useState<string>('');
    const [mutateRoute, setMutateRoute] = useState<string>('');
    const [deleteId, setDeleteId] = useState<number>(0);
    const [deleteName, setDeleteName] = useState<string>('');
    const [tab, setTab] = useState<TabTypes>(1);
    const [search, setSearch] = useState<string>('');
    const { admin } = useAdmin();
    const { setToast } = useNotification();
    const [formModal, setFormModal] = useState<boolean>(false);
    const [query, setQuery] = useState<string>('');
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState<string>('');
    const preSelectedTab = searchParams.get('tab');

    const headers = admin.access_level == 1 ? [
        {
            id: '1',
            name: 'Pessoas',
        },
        {
            id: '2',
            name: 'Fornecedores',
        },
        {
            id: '3',
            name: 'Contas bancárias',
        },
        {
            id: '4',
            name: 'Clientes',
        },
        {
            id: '5',
            name: 'Bancos',
        },
        
    ] :  [
        {
            id: '1',
            name: 'Pessoas',
        },
        {
            id: '2',
            name: 'Fornecedores',
        },
        {
            id: '3',
            name: 'Contas bancárias',
        },
        {
            id: '4',
            name: 'Clientes',
        },
    ];

    useEffect(() => {
        if (preSelectedTab) {
            setTab(Number(preSelectedTab) as TabTypes)
        }
    }, [preSelectedTab])

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
            if (numericId == 1 || numericId == 2 || numericId == 3 || numericId == 4 || numericId == 5) {
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
        // setSearchQuery(query)
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

    const deleteEntity = async () => {
        try {
            setToast({ text: `Excluindo registro ${deleteName}`, state: 'loading' });

            await updateStatus(`/api/financial/management/${deleteRoute}/delete`, admin.id, deleteId, 0).then(() => {
                setShowDeleteUserModal(false)

                setToast({ text: `Registro ${deleteName} excluído`, state: 'success' });
                mutate(mutateRoute);
            });
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <PageHeader placeholder={`Pesquisar em "Gestão"`} />

            <TableHeader
                title='Financeiro — Gestão'
                titleIcon='ph:gear'
                buttonActionName='+ Adicionar'
                onButtonAction={() => setFormModal((state) => !state)}
            >
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
                                    } else {
                                        if (parseInt(filterOptions.product_type) < 4) {
                                            return item.type == parseInt(filterOptions.product_type)
                                        } else {
                                            return item.object_type == parseInt(filterOptions.product_type) - 3
                                        }
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
                        // checked={filterOptions.not_show_zero == '1' ? true : false}
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

                    {(tab == 1) && (
                        <People formModal={formModal} setFormModal={setFormModal} setShowDeleteUserModal={setShowDeleteUserModal} setDeleteRoute={setDeleteRoute} setDeleteId={setDeleteId} setDeleteName={setDeleteName} setMutateRoute={setMutateRoute}/>
                    )}

                    {(tab == 2) && (
                        <Suppliers formModal={formModal} setFormModal={setFormModal} setShowDeleteUserModal={setShowDeleteUserModal} setDeleteRoute={setDeleteRoute} setDeleteId={setDeleteId} setDeleteName={setDeleteName} setMutateRoute={setMutateRoute}/>
                    )}

                    {(tab == 3) && (
                        <Accounts formModal={formModal} setFormModal={setFormModal} setShowDeleteUserModal={setShowDeleteUserModal} setDeleteRoute={setDeleteRoute} setDeleteId={setDeleteId} setDeleteName={setDeleteName} setMutateRoute={setMutateRoute}/>
                    )}

                    {(tab == 4) && (
                        <Clients formModal={formModal} setFormModal={setFormModal} setShowDeleteUserModal={setShowDeleteUserModal} setDeleteRoute={setDeleteRoute} setDeleteId={setDeleteId} setDeleteName={setDeleteName} setMutateRoute={setMutateRoute}/>
                    )}

                    {(tab == 5) && (
                        <Banks formModal={formModal} setFormModal={setFormModal} setShowDeleteUserModal={setShowDeleteUserModal} setDeleteRoute={setDeleteRoute} setDeleteId={setDeleteId} setDeleteName={setDeleteName} setMutateRoute={setMutateRoute}/>
                    )}
                </>
            </ErrorBoundary>

            <GeralModal
                small
                isDelete
                deleteName={deleteName}
                deleteFunction={deleteEntity}
                show={showDeleteUserModal}
                setShow={setShowDeleteUserModal}
                title='Excluir registro'
            />
        </>
    )
}
