import React, { ChangeEvent, FormEvent, Suspense, useEffect, useRef, useState } from 'react'

import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import { getAlternativeType } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import useSWR, { mutate } from 'swr'
import styles from './styles.module.scss'

interface FormData {
    admin_id: number
    product_name: string
    product_id?: number | null
    type: 0 | 1 | 2 | 3
    object: number
    value: number
    quantity: number
    quantity_unit: 0 | 1 | 2
    property_id: number
}

interface InputsRowsProps {
    showProductModal: boolean
    setShowProductModal: (showProductModal: boolean) => void
    onlyModal: boolean
    tab: 1 | 2 | 3
    searchQuery?: string
}

const tableHeaders = ['Nome do item', 'Classe', 'Propriedade', 'Quantidade em estoque', 'Criado em', '']
const productTypes = ['Sementes', 'Defensivos', 'Fertilizantes']

interface PropertyOption {
    value: number
    label: string
}

function InputsRows({ showProductModal, setShowProductModal, onlyModal, tab, searchQuery }: InputsRowsProps) {
    const { setToast } = useNotification()
    const formRef = useRef<HTMLFormElement>(null)
    const { admin } = useAdmin()
    const { searchPage } = useSearch()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    const { data, isLoading, error } = useSWR(
        `/api/stocks/products/list/${admin.id}?filter=${searchPage}&page=${activePage}${searchQuery}`,
        getFetch,
    )

    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        product_name: '',
        type: 0,
        object: 0,
        value: 0,
        quantity: 0,
        quantity_unit: 0,
        property_id: 0,
    })
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [autoCompleteSuggestion, setAutoCompleteSuggestion] = useState(false)
    const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([])

    const [seedsList, setSeedsList] = useState<any[]>([])

    const {
        data: culturesData,
        isLoading: culturesLoading,
        error: cultureError,
    } = useSWR(`/api/inputs/cultures/list/${admin.id}`, getFetch)
    const {
        data: defensivesData,
        isLoading: defensivesLoading,
        error: defensiveError,
    } = useSWR(`/api/inputs/defensives/list/${admin.id}`, getFetch)
    const {
        data: fertilizersData,
        isLoading: fertilizersLoading,
        error: fertilizersError,
    } = useSWR(`/api/inputs/fertilizers/list/${admin.id}`, getFetch)

    const fetchProducts = async () => {
        const response = await axios.get(`/api/products/list/${admin.id}`)
        const data = response.data

        setProducts(data.products)

        const options = [
            {
                value: 0,
                label: 'Selecione a propriedade',
            },
        ]

        data.properties.map((property: any) => {
            options.push({
                value: property.id,
                label: property.name,
            })
        })

        setPropertyOptions(options)

        return data
    }

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prevData) => ({ ...prevData, [name]: value }))

        if (name == 'product_name') {
            if (!autoCompleteSuggestion) {
                setAutoCompleteSuggestion(true)
            }

            const matchingProduct = products.find((product: any) => product.name.toLowerCase() == value.toLowerCase())

            if (matchingProduct) {
                setAutoCompleteSuggestion(false)
                setFormData((prevData) => ({
                    ...prevData,
                    product_name: matchingProduct.name,
                    product_id: matchingProduct.id,
                    type: matchingProduct.type,
                    object: matchingProduct.item_id,
                }))
            } else {
                setFormData((prevData) => ({
                    ...prevData,
                    product_id: null,
                }))
            }
        }
    }

    const Autocomplete = ({ products, filterText }: { products: any; filterText: string }) => {
        let filteredProducts = []

        if (formData.type !== 0) {
            filteredProducts = products.filter(
                (product: any) =>
                    product.name.toLowerCase().includes(filterText.toLowerCase()) && product.type == formData.type,
            )
        } else {
            filteredProducts = products.filter((product: any) =>
                product.name.toLowerCase().includes(filterText.toLowerCase()),
            )
        }

        if (filteredProducts.length > 0) {
            return (
                <div
                    className={styles.autoCompleteBox}
                    onBlur={() => setAutoCompleteSuggestion(false)}
                    onFocus={() => setAutoCompleteSuggestion(true)}>
                    {filteredProducts.map((product: any) => (
                        <div
                            key={product.id}
                            className={styles.autoCompleteInput}
                            onClick={() => onSelectProduct(product.name, product.id, product.type, product.item_id)}
                            onFocus={() => setAutoCompleteSuggestion(true)}>
                            {product.name}
                        </div>
                    ))}
                </div>
            )
        }
    }

    const onSelectProduct = (
        productName: string,
        productId: number,
        productType: 0 | 1 | 2 | 3,
        productItemId: number,
    ) => {
        setFormData((prevData) => ({
            ...prevData,
            product_name: productName,
            product_id: productId,
            type: productType,
            object: productItemId,
        }))
        setAutoCompleteSuggestion(false)
    }

    const addProduct = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (formData.quantity_unit !== 1 && formData.quantity_unit !== 2) {
                setToast({ text: 'Selecione uma unidade para quantidade', state: 'warning' })
                return
            }

            if (!loading) {
                setLoading(true)
                setToast({ text: 'Adicionando produto', state: 'loading' })

                await axios.post('/api/stocks/products/add', formData)

                setToast({ text: 'Produto adicionado com sucesso', state: 'success' })
                setLoading(false)

                if (tab == 1) {
                    mutate(`/api/stocks/products/list/${admin.id}`)
                } else if (tab == 2) {
                    mutate(`/api/stocks/entries/list/${admin.id}`)
                }

                setShowProductModal(false)
            }
        } catch (error: any) {
            setLoading(false)
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (culturesData && defensivesData && fertilizersData) {
            setSeedsList(culturesData.cultures)
        }
    }, [culturesData, defensivesData, fertilizersData])

    useEffect(() => {
        if (formRef?.current) {
            formRef.current.reset()
        }

        if (!showProductModal) {
            setLoading(false)
            setAutoCompleteSuggestion(false)
            setFormData({
                admin_id: admin.id,
                product_name: '',
                type: 0,
                object: 0,
                value: 0,
                quantity: 0,
                quantity_unit: 0,
                property_id: 0,
            })
        }
    }, [showProductModal])

    useEffect(() => {
        if (
            typeof error !== 'undefined' ||
            typeof cultureError !== 'undefined' ||
            typeof defensiveError !== 'undefined' ||
            typeof fertilizersError !== 'undefined'
        ) {
            WriteLog([error, cultureError, defensiveError, fertilizersError], 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de produtos`, state: 'danger' })
            }
        }
    }, [error, cultureError, defensiveError, fertilizersError])

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 100))
            fetchProducts()
        }
    }, [data])

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    if (isLoading || culturesLoading || defensivesLoading || fertilizersLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {!onlyModal &&
                data &&
                data.products &&
                data.products.map((product: any, index: number) => (
                    <TableRow
                        key={product.id ?? index + 1}
                        gridColumns={`repeat(${tableHeaders.length - 1}, 1fr) 0.1fr`}>
                        <div data-type='content'>
                            <p
                                title={`${product.product.name} ${
                                    product.product_variant ? `- ${product.product_variant}` : ''
                                }`}>
                                {product.product.name} {product.product_variant ? `- ${product.product_variant}` : ''}
                            </p>
                        </div>

                        <div data-type='content'>
                            {product.alternative_type == 0 ? (
                                <p title={productTypes[product?.product?.type - 1]}>
                                    {productTypes[product?.product?.type - 1]}
                                </p>
                            ) : (
                                <p title={getAlternativeType(product.alternative_type)}>
                                    {getAlternativeType(product.alternative_type)}
                                </p>
                            )}
                        </div>

                        <div data-type='content'>
                            <p title={product.property ? product.property?.name : '--'}>
                                {product.property ? product.property?.name : '--'}
                            </p>
                        </div>

                        <div data-type='content'>
                            <p>{product.stock_quantity}</p>
                        </div>

                        <div data-type='content'>
                            <p>{product.created_at}</p>
                        </div>

                        <div></div>
                    </TableRow>
                ))}

            <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

            {!onlyModal && (!data || !data.products || data.products.length == 0) && (
                <TableRow emptyString='Nenhum produto encontrado' columnsCount={1} />
            )}

            {showProductModal && (
                <GeralModal
                    show={showProductModal}
                    setShow={setShowProductModal}
                    title='Adicionar produto'
                    loading={loading}>
                    <Suspense fallback={<ElementSkeleton />}>
                        <form ref={formRef} className={styles.form} onSubmit={addProduct}>
                            <div className={styles.formGrid} style={{ gridTemplateColumns: `repeat(3, 1fr)` }}>
                                <GeralInput
                                    label='Classe'
                                    defaultValue={formData.type}
                                    name='type'
                                    type='select'
                                    selectType={2}
                                    readOnly={loading}
                                    value={formData.type}
                                    onChange={handleUserInputChange}
                                    required>
                                    <option value={0} disabled>
                                        Selecione
                                    </option>

                                    {productTypes.map((productType, index) => (
                                        <option key={index} value={index + 1}>
                                            {productType}
                                        </option>
                                    ))}
                                </GeralInput>

                                <div className={styles.inputAutoComplete}>
                                    <GeralInput
                                        label='Nome do produto'
                                        name='product_name'
                                        type='text'
                                        placeholder='Digite o nome'
                                        onChange={handleUserInputChange}
                                        onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                        value={formData.product_name}
                                        readOnly={loading}
                                        required
                                        autoComplete='off'
                                    />

                                    {formData.product_name && autoCompleteSuggestion && (
                                        <Autocomplete products={products} filterText={formData.product_name} />
                                    )}
                                </div>

                                {formData.type !== 1 && <div />}

                                {formData.type == 1 && seedsList && (
                                    <GeralInput
                                        tableSelect
                                        defaultValue={formData.object}
                                        label='Cultivar'
                                        name='object'
                                        type='select'
                                        selectType={2}
                                        readOnly={loading}
                                        onChange={handleUserInputChange}>
                                        <option disabled value={0}>
                                            Selecione
                                        </option>

                                        {seedsList
                                            .filter((item) => item.name == formData.product_name)
                                            .map((item) =>
                                                item.extra_column?.split(',').map((variety: string) => (
                                                    <option key={`${item.id}-${variety}`} value={variety}>
                                                        {variety}
                                                    </option>
                                                )),
                                            )}
                                    </GeralInput>
                                )}

                                <GeralInput
                                    label='Valor unitário'
                                    name='value'
                                    type='text'
                                    autoComplete='off'
                                    placeholder='00'
                                    maskVariant='price'
                                    onChange={handleUserInputChange}
                                    readOnly={loading}
                                    required
                                />

                                <div className={styles.littleRow}>
                                    <GeralInput
                                        label='Quantidade'
                                        name='quantity'
                                        type='text'
                                        autoComplete='off'
                                        placeholder='00'
                                        maxLength={10}
                                        maskVariant='integer'
                                        onChange={handleUserInputChange}
                                        readOnly={loading}
                                        required
                                    />

                                    <GeralInput
                                        defaultValue={formData.quantity_unit}
                                        name='quantity_unit'
                                        type='select'
                                        selectType={2}
                                        autoComplete='off'
                                        onChange={handleUserInputChange}
                                        readOnly={loading}
                                        required>
                                        <option value={0} disabled>
                                            Un
                                        </option>
                                    </GeralInput>
                                </div>

                                <GeralInput
                                    defaultValue={formData.property_id}
                                    label='Propriedade'
                                    name='property_id'
                                    type='select'
                                    autoComplete='off'
                                    onChange={handleUserInputChange}
                                    readOnly={loading}
                                    required>
                                    {propertyOptions.map((property: PropertyOption) => (
                                        <option key={`property-${property.value}`} value={property.value}>
                                            {property.label}
                                        </option>
                                    ))}
                                </GeralInput>
                            </div>

                            <div className={styles.actions}>
                                <GeralButton
                                    variant='secondary'
                                    type='submit'
                                    small
                                    value='Adicionar'
                                    disabled={loading}
                                />

                                <GeralButton
                                    variant='quaternary'
                                    type='button'
                                    small
                                    value='Cancelar'
                                    disabled={loading}
                                    onClick={() => {
                                        setShowProductModal(false)
                                    }}
                                />
                            </div>
                        </form>
                    </Suspense>
                </GeralModal>
            )}
        </>
    )
}

interface ProductsProps {
    showProductModal: boolean
    setShowProductModal: (showProductModal: boolean) => void
    onlyModal: boolean
    tab: 1 | 2 | 3
    searchQuery?: string
}

const Products: React.FC<ProductsProps> = ({ showProductModal, setShowProductModal, onlyModal, tab, searchQuery }) => {
    return (
        <GeralTable headers={tableHeaders} gridColumns={`repeat(${tableHeaders.length - 1}, 1fr) 0.1fr`}>
            <Suspense fallback={<TableSkeleton />}>
                <ErrorBoundary
                    fallbackComponent={<strong className='error-strong'>Erro crítico ao carregar a tabela</strong>}>
                    <InputsRows
                        showProductModal={showProductModal}
                        setShowProductModal={setShowProductModal}
                        onlyModal={onlyModal}
                        tab={tab}
                        searchQuery={searchQuery}
                    />
                </ErrorBoundary>
            </Suspense>
        </GeralTable>
    )
}

export default Products
