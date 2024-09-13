import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import TableSkeleton from '@/components/loading/TableSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import GeralTable from '@/components/tables/GeralTable'
import TableActions from '@/components/tables/TableActions'
import TableButton from '@/components/tables/TableButton'
import TablePagination from '@/components/tables/TablePagination'
import TableRow from '@/components/tables/TableRow'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import { formatDateToYYYYMMDD, formatNumberToBR, formatNumberToReal, getAlternativeType } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { ChangeEvent, FC, FormEvent, Suspense, useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { AssetData } from '../assets/types'
import styles from './styles.module.scss'

interface FormData {
    admin_id: number
    product_ids: string[]
    product_options: string[]
    product_types: string[]
    asset_ids: string[]
    alternative_types: string[]
    values: string[]
    quantities: string[]
    culture_codes: string[]
    property_id: string
    stock_id?: number
    supplier_name: string
    entry_date: string
    nfe_serie: string
    nfe_number: string
    quantity_unit: 0 | 1 | 2
    textInfo: string[]
}

interface IncomingsProps {
    showIncomingModal: boolean
    setIncomingModal: (showIncomingModal: boolean) => void
    searchQuery?: string
    filterOptions: any
}

const tableHeaders = [
    'Produto',
    'Classe',
    'Quantidade',
    'Propriedade',
    'Valor',
    'Valor Unitário',
    'Fornecedor',
    'NF-e',
    'Data NF',
    '',
]
const productTypes = ['Sementes', 'Defensivos', 'Fertilizantes']

function InputsRows({ showIncomingModal, setIncomingModal, searchQuery, filterOptions }: IncomingsProps) {
    const { setToast } = useNotification()
    const formRef = useRef<HTMLFormElement>(null)
    const { admin } = useAdmin()
    const { searchPage } = useSearch()
    const [pageNumbers, setPageNumbers] = useState(0)
    const [activePage, setActivePage] = useState(1)

    // const [textInfo, setTextInfo] = useState('')

    const [lastOptions, setLastOptions] = useState<any>({
        property_id: '0',
        product_ids: ['0'],
        product_types: ['0'],
    })

    const { data, isLoading, error } = useSWR(
        `/api/stocks/incomings/list/${admin.id}?filter=${searchPage}&page=${activePage}${searchQuery}`,
        getFetch,
    )

    const [formData, setFormData] = useState<FormData>({
        admin_id: admin.id,
        product_ids: ['0'],
        product_types: ['0'],
        product_options: ['0'],
        culture_codes: [''],
        values: ['0'],
        asset_ids: ['0'],
        alternative_types: ['0'],
        quantities: ['0'],
        quantity_unit: 0,
        property_id: '0',
        supplier_name: '',
        entry_date: '',
        nfe_serie: '',
        nfe_number: '',
        textInfo: [],
    })

    const [formEditData, setFormEditData] = useState({
        id: 0,
        product_id: '0',
        product_type: '0',
        product_option: '0',
        product_text: '',
        asset_id: '0',
        culture_code: '',
        admin_id: admin.id,
        supplier_name: '',
        entry_date: '',
        nfe_serie: '',
        nfe_number: '',
        value: '0',
        quantity: '0',
        alternative_type: '0',
    })

    // const [stocks, setStocks] = useState<any[]>([])
    const [assets, setAssets] = useState<AssetData[]>([])
    const [loading, setLoading] = useState(false)
    // const [autoCompleteSuggestion, setAutoCompleteSuggestion] = useState(false)

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showEditIncoming, setShowEditIncoming] = useState(false)
    const [deleteId, setDeleteId] = useState(0)
    const [deleteName, setDeleteName] = useState('')

    const fetchStocks = async (query: string = '') => {
        const response = await axios.get(`/api/stocks/products/list/${admin.id}?${query}`)
        const data = response.data

        // setStocks(data.products)

        return data
    }

    const fetchAssets = async (propertyId: number) => {
        const response = await axios.get(`/api/assets/list/${admin.id}?property=${propertyId}`)
        const data = response.data

        setAssets(data.assets)

        return data
    }

    const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        setFormEditData((prevData) => ({ ...prevData, [name]: value }))
    }

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        if (name == 'property_id') {
            fetchAssets(parseInt(value))
        }

        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }
    const handleUserInputChangeArray = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
        const { name, value } = e.target

        let values: string[] = []

        if (name == 'product_ids') {
            checkInfos(index)
            values = formData.product_ids
        } else if (name == 'product_types') {
            checkInfos(index)
            values = formData.product_types
        } else if (name == 'values') {
            values = formData.values
        } else if (name == 'quantities') {
            values = formData.quantities
        } else if (name == 'culture_codes') {
            checkInfos(index)
            values = formData.culture_codes
        } else if (name == 'product_options') {
            values = formData.product_options
        } else if (name == 'alternative_types') {
            values = formData.alternative_types
        } else if (name == 'asset_ids') {
            values = formData.asset_ids
        }

        values[index] = value

        if (name == 'product_ids') {
            setFormData((prevData) => ({ ...prevData, product_ids: values }))
        } else if (name == 'product_types') {
            setFormData((prevData) => ({ ...prevData, product_types: values }))
        } else if (name == 'values') {
            setFormData((prevData) => ({ ...prevData, values }))
        } else if (name == 'quantities') {
            setFormData((prevData) => ({ ...prevData, quantities: values }))
        } else if (name == 'culture_codes') {
            setFormData((prevData) => ({ ...prevData, culture_codes: values }))
        } else if (name == 'product_options') {
            setFormData((prevData) => ({ ...prevData, product_options: values }))
        } else if (name == 'alternative_types') {
            setFormData((prevData) => ({ ...prevData, alternative_types: values }))
        } else if (name == 'asset_ids') {
            setFormData((prevData) => ({ ...prevData, asset_ids: values }))
        }
    }

    const calculateValueByPrice = (incoming: any) => {
        let { value, quantity } = incoming

        value = typeof value == 'string' ? parseFloat(value) : value
        quantity = typeof quantity == 'string' ? parseFloat(quantity) : quantity

        if (isNaN(value) || isNaN(quantity)) {
            return 'Valores inválidos'
        }

        return formatNumberToReal(value * quantity)
    }

    // const Autocomplete = ({ stocks, filterText }: { stocks: any; filterText: string }) => {
    //     const filteredProducts = stocks.filter((stock: any) =>
    //         stock.product?.name.toLowerCase().includes(filterText.toLowerCase()),
    //     )

    //     if (filteredProducts.length > 0) {
    //         return (
    //             <div
    //                 className={styles.autoCompleteBox}
    //                 onBlur={() => setAutoCompleteSuggestion(false)}
    //                 onFocus={() => setAutoCompleteSuggestion(true)}>
    //                 {filteredProducts.map((stock: any) => (
    //                     <div
    //                         key={stock.id}
    //                         className={styles.autoCompleteInput}
    //                         onClick={() => onSelectProduct(stock.product.name, stock.id)}
    //                         onFocus={() => setAutoCompleteSuggestion(true)}>
    //                         {stock.product.name}
    //                     </div>
    //                 ))}
    //             </div>
    //         )
    //     }
    // }

    // const onSelectProduct = (productName: string, stockId: number) => {
    //     setFormData((prevData) => ({ ...prevData, product_id: productName }))
    //     setFormData((prevData) => ({ ...prevData, stock_id: stockId }))
    //     setAutoCompleteSuggestion(false)
    // }

    const addIncoming = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (formData.property_id == '0') {
                setToast({ text: 'Selecione uma propriedade', state: 'warning' })
                return
            }

            for (const item of formData.product_ids) {
                if (item == '0') {
                    setToast({ text: 'Há campos de produtos não selecionados', state: 'warning' })
                    return
                }
            }

            let typeIndex = 0
            for (const item of formData.product_types) {
                if (
                    (item == '0' && formData.alternative_types[typeIndex] == '0') ||
                    (item == '0' && formData.alternative_types[typeIndex] == '')
                ) {
                    setToast({ text: 'Há campos de classes não selecionados', state: 'warning' })
                    return
                }

                if (
                    (item == '1' && formData.culture_codes[formData.product_types.indexOf(item)] == '0') ||
                    (item == '1' && formData.culture_codes[formData.product_types.indexOf(item)] == '')
                ) {
                    setToast({ text: 'Selecione o cultivar', state: 'warning' })
                    return
                }
                typeIndex++
            }

            for (const item of formData.values) {
                if (item == '0') {
                    setToast({ text: 'Há campos de valores não preenchidos', state: 'warning' })
                    return
                }
            }

            for (const item of formData.quantities) {
                if (item == '0') {
                    setToast({ text: 'Há campos de quantidades não preenchidos', state: 'warning' })
                    return
                }
            }

            // if (formData.product_types == '1' && formData.culture_code == '0' || formData.product_type == '1' && formData.culture_code == '') {
            //     setToast({ text: 'Selecione o cultivar', state: 'warning' });
            //     return;
            // }

            if (!loading) {
                setLoading(true)
                setToast({ text: 'Registrando entrada', state: 'loading' })

                await axios.post('/api/stocks/incomings/add', formData)

                setToast({ text: 'Entrada registrada com sucesso', state: 'success' })
                setLoading(false)
                mutate(`/api/stocks/incomings/list/${admin.id}?filter=${searchPage}&page=${activePage}${searchQuery}`)
                setIncomingModal(false)
            }
        } catch (error: any) {
            setLoading(false)
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }
    const editIncoming = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (!loading) {
                setLoading(true)
                setToast({ text: 'Editando entrada', state: 'loading' })

                await axios.post('/api/stocks/incomings/change', formEditData)

                setToast({ text: 'Entrada editada com sucesso', state: 'success' })
                setLoading(false)
                mutate(`/api/stocks/incomings/list/${admin.id}?filter=${searchPage}&page=${activePage}${searchQuery}`)
                setShowEditIncoming(false)
            }
        } catch (error: any) {
            setLoading(false)
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const deleteIncoming = async () => {
        try {
            if (!loading) {
                setLoading(true)
                setToast({ text: `Zerando entrada ${deleteName}`, state: 'loading' })

                await updateStatus('/api/stocks/incomings/delete', admin.id, deleteId, 0).then(() => {
                    setShowDeleteModal(false)

                    setToast({ text: `Entrada ${deleteName} zerada`, state: 'success' })
                    setLoading(false)
                    mutate(
                        `/api/stocks/incomings/list/${admin.id}?filter=${searchPage}&page=${activePage}${searchQuery}`,
                    )
                })
            }
        } catch (error: any) {
            setLoading(false)
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const handlePageChange = (index: number) => {
        const timeout = setTimeout(() => {
            setActivePage(index)
            clearTimeout(timeout)
        }, 100)
    }

    const setStocksByOptions = async (index: number) => {
        // text info do index do form data
        const textInfo = formData.textInfo
        textInfo[index] = 'Carregando estoque...'
        setFormData((prevData) => ({ ...prevData, textInfo: [...textInfo] }))

        const stocksNew = await fetchStocks(
            `properties_id=${formData.property_id}&products_id=${formData.product_ids[index]}${formData.culture_codes[index] != '' && formData.product_types[index] == '1' ? `&product_variant=${formData.culture_codes[index]}` : ''}`,
        )

        // contando estoque do produto na propriedade
        let countStock = 0

        stocksNew.products.forEach((stock: any) => {
            countStock += stock.stock_quantity_number
        })

        const lastTypeOptions = formData.product_types[index]
        const lastProductOptions = formData.product_ids[index]
        const lastCultureOptions = formData.culture_codes[index]

        setLastOptions({
            property_id: formData.property_id,
            product_ids: [...lastProductOptions],
            product_types: [...lastTypeOptions],
            culture_codes: [...lastCultureOptions],
        })

        textInfo[index] = `Estoque atual: ${formatNumberToBR(countStock)}`
        setFormData((prevData) => ({ ...prevData, textInfo: [...textInfo] }))
    }

    useEffect(() => {
        if (formRef?.current) {
            formRef.current.reset()
        }

        if (!showIncomingModal) {
            // setStocks([])
            setLoading(false)
            // setAutoCompleteSuggestion(false)
            setFormData({
                admin_id: admin.id,
                product_ids: ['0'],
                product_types: ['0'],
                culture_codes: [''],
                product_options: [''],
                asset_ids: ['0'],
                alternative_types: ['0'],
                values: ['0'],
                quantities: ['0'],
                quantity_unit: 0,
                property_id: '0',
                supplier_name: '',
                entry_date: '',
                nfe_serie: '',
                nfe_number: '',
                textInfo: [],
            })
            setShowDeleteModal(false)
            setDeleteId(0)
            setDeleteName('')
            // setTextInfo('')
            setLastOptions({ property_id: '0', product_id: '0', product_type: '0' })
        }
    }, [showIncomingModal])

    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de entradas`, state: 'danger' })
            }
        }
    }, [error])

    useEffect(() => {
        if (data) {
            const total = data.total
            setPageNumbers(Math.ceil(total / 100))
        }
    }, [data])

    const checkInfos = (index: number) => {
        if (
            formData.product_types[index] !== '0' &&
            formData.product_ids[index] == '0' &&
            formData.property_id !== '0'
        ) {
            fetchStocks(`properties_id=${formData.property_id}`)
            return
        }

        if (
            formData.product_types[index] == '0' ||
            formData.product_ids[index] == '0' ||
            formData.property_id == '0' ||
            (formData.product_types[index] == '1' && formData.culture_codes[index] == '') ||
            (formData.product_types[index] == '1' && formData.culture_codes[index] == '0')
        ) {
            // setTextInfo('')
            return
        }

        if (
            lastOptions.property_id !== formData.property_id ||
            lastOptions.product_ids[index] !== formData.product_ids[index] ||
            lastOptions.product_types[index] !== formData.product_types[index] ||
            lastOptions.culture_codes[index] !== formData.culture_codes[index]
        ) {
            setStocksByOptions(index)
        }
    }

    if (isLoading) {
        return <TableSkeleton />
    }

    return (
        <>
            {data &&
                data.incomings &&
                data.incomings.map((incoming: any, index: number) => (
                    <TableRow key={index} gridColumns={`1.5fr 1fr 1fr 1.2fr 1fr 1fr 1fr 1fr 0.6fr 0.6fr`}>
                        <div data-type='content'>
                            <p
                                title={`${incoming.stock?.product?.name} ${
                                    incoming.stock?.product_variant ? `- ${incoming.stock?.product_variant}` : ''
                                }`}>
                                {incoming.stock?.product?.name}{' '}
                                {incoming.stock?.product_variant ? `- ${incoming.stock?.product_variant}` : ''}
                            </p>
                        </div>

                        <div data-type='content'>
                            {incoming.stock.alternative_type == 0 ? (
                                <p title={productTypes[incoming.stock?.product?.type - 1]}>
                                    {productTypes[incoming.stock?.product?.type - 1]}
                                </p>
                            ) : (
                                <p title={getAlternativeType(incoming.stock.alternative_type)}>
                                    {getAlternativeType(incoming.stock.alternative_type)}
                                </p>
                            )}
                        </div>

                        <div data-type='content'>
                            <p
                                title={`${formatNumberToBR(incoming.quantity)}`}>{`${formatNumberToBR(incoming.quantity)}    `}</p>
                        </div>

                        <div>
                            <p title={incoming.stock?.property ? incoming.stock?.property.name : '--'}>
                                {incoming.stock?.property ? incoming.stock?.property.name : '--'}
                            </p>
                        </div>

                        <div data-type='content'>
                            <p title={calculateValueByPrice(incoming)}>{calculateValueByPrice(incoming)}</p>
                        </div>

                        <div data-type='content'>
                            <p title={formatNumberToReal(incoming.value)}>{formatNumberToReal(incoming.value)}</p>
                        </div>

                        <div data-type='content'>
                            <p>
                                {incoming.supplier_name && incoming.supplier_name !== ''
                                    ? incoming.supplier_name
                                    : '--'}
                            </p>
                        </div>
                        <div data-type='content'>
                            <p>
                                {incoming.nfe_number && incoming.nfe_number !== ''
                                    ? `${incoming.nfe_number} - Série ${incoming.nfe_serie}`
                                    : '--'}
                            </p>
                        </div>
                        <div data-type='content'>
                            <p>{incoming.entry_date && incoming.entry_date !== '' ? incoming.entry_date : '--'}</p>
                        </div>

                        <div data-type='action'>
                            <TableActions>
                                <TableButton
                                    variant='edit'
                                    onClick={() => {
                                        setFormEditData({
                                            id: incoming.id,
                                            admin_id: admin.id,
                                            value: formatNumberToBR(incoming.value),
                                            quantity: formatNumberToBR(incoming.quantity),
                                            product_id: incoming.stock.product_id,
                                            product_type: incoming.stock.product.type,
                                            product_option: incoming.stock.product.type == 4 ? '2' : '1',
                                            asset_id: incoming.stock.asset_id,
                                            culture_code: incoming.stock.product_variant,
                                            supplier_name: incoming.supplier_name,
                                            entry_date:
                                                incoming.entry_date && incoming.entry_date !== ''
                                                    ? formatDateToYYYYMMDD(incoming.entry_date)
                                                    : '',
                                            nfe_serie: incoming.nfe_serie,
                                            nfe_number: incoming.nfe_number,
                                            alternative_type: incoming.stock.alternative_type,
                                            product_text: incoming.stock.product.name,
                                        })
                                        fetchAssets(parseInt(incoming.stock.property_id))
                                        // setDeleteId(incoming.id);
                                        // setDeleteName(incoming.stock?.product?.name);
                                        setShowEditIncoming(!showEditIncoming)
                                    }}
                                />
                                <TableButton
                                    variant='delete'
                                    onClick={() => {
                                        setDeleteId(incoming.id)
                                        setDeleteName(incoming.stock?.product?.name)
                                        setShowDeleteModal(!showDeleteModal)
                                    }}
                                />
                            </TableActions>
                        </div>
                    </TableRow>
                ))}

            <TablePagination pages={pageNumbers} onPageChange={handlePageChange} active={activePage} />

            {!data ||
                !data.incomings ||
                (data.incomings.length == 0 && <TableRow emptyString='Nenhuma entrada encontrada' columnsCount={1} />)}

            {showIncomingModal && (
                <GeralModal
                    show={showIncomingModal}
                    setShow={setIncomingModal}
                    title='Registrar entrada'
                    loading={loading}>
                    <form ref={formRef} className={styles.form} onSubmit={addIncoming}>
                        <div
                            className={styles.formGrid}
                            style={{ gridTemplateColumns: `repeat(5, 1fr)`, marginBottom: '20px' }}>
                            <GeralInput
                                label='Propriedade'
                                name='property_id'
                                filterInitialValue
                                type='select'
                                autoComplete='off'
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                    setFormData((prevData) => ({ ...prevData, product_id: '0' }))
                                    handleUserInputChange(e)
                                }}
                                // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                value={formData.property_id}
                                readOnly={loading}
                                required>
                                <option value='0'>Selecione a propriedade</option>

                                {filterOptions &&
                                    filterOptions.properties.map((property: any) => (
                                        <option key={property.id} value={property.id}>
                                            {property.name}
                                        </option>
                                    ))}
                            </GeralInput>

                            <GeralInput
                                label='Fornecedor'
                                name='supplier_name'
                                type='text'
                                placeholder='Digite aqui'
                                onChange={handleUserInputChange}
                            />

                            <GeralInput
                                label='Data NF'
                                name='entry_date'
                                type='date'
                                placeholder='Digite aqui'
                                onChange={handleUserInputChange}
                            />
                            <GeralInput
                                label='NF-e'
                                name='nfe_number'
                                type='text'
                                placeholder='Digite aqui'
                                onChange={handleUserInputChange}
                            />
                            <GeralInput
                                label='Série'
                                name='nfe_serie'
                                type='text'
                                placeholder='Digite aqui'
                                onChange={handleUserInputChange}
                            />
                        </div>

                        {formData.product_types.map((_, index) => (
                            <div
                                key={index}
                                className={styles.formGrid}
                                style={{
                                    gridTemplateColumns: `repeat(6, 1fr)`,
                                    marginBottom: '40px',
                                    position: 'relative',
                                }}>
                                <GeralInput
                                    label='Opções'
                                    name='product_options'
                                    type='select'
                                    autoComplete='off'
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                        handleUserInputChangeArray(e, index)
                                    }}
                                    // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                    value={formData.product_options[index]}
                                    readOnly={loading}
                                    required>
                                    <option value='0'>Selecione a opção</option>
                                    <option value='1'>Lavoura</option>
                                    <option value='2'>Outros</option>
                                </GeralInput>

                                {formData.product_options[index] == '1' && (
                                    <>
                                        <GeralInput
                                            label='Lavouras'
                                            name='product_types'
                                            type='select'
                                            autoComplete='off'
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                setFormData((prevData) => ({ ...prevData, product_id: '0' }))
                                                handleUserInputChangeArray(e, index)
                                            }}
                                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                            value={formData.product_types[index]}
                                            readOnly={loading}
                                            required>
                                            <option value='0'>Selecione a opção</option>

                                            {productTypes.map((type, index) => (
                                                <option key={index} value={index + 1}>
                                                    {type}
                                                </option>
                                            ))}
                                        </GeralInput>

                                        <GeralInput
                                            label='Produto'
                                            name='product_ids'
                                            type='select'
                                            autoComplete='off'
                                            placeholder='Digite o nome'
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                handleUserInputChangeArray(e, index)
                                            }}
                                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                            value={formData.product_ids[index]}
                                            readOnly={loading}
                                            required>
                                            <option value='0'>Selecione o produto</option>

                                            {/* lendo produtos que estão nos stocks pelo product_id */}
                                            {filterOptions.products
                                                .filter(
                                                    (product: any) =>
                                                        product.type == parseInt(formData.product_types[index]),
                                                    // && stocks.map((stock: any) => stock.product_id).includes(product.id)
                                                )
                                                .map((product: any) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                        </GeralInput>

                                        {formData.product_types[index] == '1' && (
                                            <GeralInput
                                                label='Cultivar'
                                                name='culture_codes'
                                                type='select'
                                                autoComplete='off'
                                                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                    handleUserInputChangeArray(e, index)
                                                }}
                                                // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                                value={formData.culture_codes[index]}
                                                readOnly={loading}
                                                required>
                                                <option value='0'>Selecione o Cultivar</option>

                                                {filterOptions.products
                                                    .filter((item: any) => item.id == formData.product_ids[index])
                                                    .map((item: any) =>
                                                        item.extra_column?.split(',').map((variety: string) => (
                                                            <option key={`${item.id}-${variety}`} value={variety}>
                                                                {variety}
                                                            </option>
                                                        )),
                                                    )}
                                            </GeralInput>
                                        )}
                                    </>
                                )}

                                {formData.product_options[index] == '2' && (
                                    <>
                                        <GeralInput
                                            label='Outros'
                                            name='alternative_types'
                                            type='select'
                                            autoComplete='off'
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                handleUserInputChangeArray(e, index)
                                            }}
                                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                            value={formData.alternative_types[index]}
                                            readOnly={loading}
                                            required>
                                            <option value='0'>Selecione a opção</option>
                                            <option value='1'>Imposto</option>
                                            <option value='2'>Manutenção</option>
                                            <option value='3'>Seguro</option>
                                            <option value='4'>Combustível</option>
                                            <option value='5'>Colaborador</option>
                                            <option value='6'>Item</option>
                                        </GeralInput>

                                        {!['5', '6'].includes(formData.alternative_types[index]) && (
                                            <GeralInput
                                                label='Bem'
                                                name='asset_ids'
                                                type='select'
                                                autoComplete='off'
                                                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                    setFormData((prevData) => ({ ...prevData, product_id: '0' }))
                                                    handleUserInputChangeArray(e, index)
                                                }}
                                                // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                                value={formData.asset_ids[index]}
                                                readOnly={loading}
                                                required>
                                                <option value='0'>Selecione a opção</option>

                                                {assets.map((asset: any) => (
                                                    <option key={asset.id} value={asset.id}>
                                                        {asset.name}
                                                    </option>
                                                ))}
                                            </GeralInput>
                                        )}

                                        <GeralInput
                                            label='Descrição'
                                            name='product_ids'
                                            type='text'
                                            autoComplete='off'
                                            placeholder='Digite o nome'
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                handleUserInputChangeArray(e, index)
                                            }}
                                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                            value={formData.product_ids[index]}
                                            readOnly={loading}
                                            required
                                        />
                                    </>
                                )}

                                <GeralInput
                                    label='Quantidade (Und, Kg, L)'
                                    name='quantities'
                                    type='text'
                                    maskVariant='price'
                                    placeholder='00'
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        handleUserInputChangeArray(e, index)
                                    }}
                                    required
                                />

                                <GeralInput
                                    label='Valor unitário'
                                    name='values'
                                    type='text'
                                    placeholder='Digite o valor'
                                    maskVariant='price'
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        handleUserInputChangeArray(e, index)
                                    }}
                                    required
                                />

                                <button
                                    className={styles.deleteButton}
                                    type='button'
                                    onClick={() => {
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            product_ids: prevData.product_ids.filter((_, i) => i !== index),
                                        }))
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            product_types: prevData.product_types.filter((_, i) => i !== index),
                                        }))
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            culture_codes: prevData.culture_codes.filter((_, i) => i !== index),
                                        }))
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            values: prevData.values.filter((_, i) => i !== index),
                                        }))
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            quantities: prevData.quantities.filter((_, i) => i !== index),
                                        }))
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            textInfo: prevData.textInfo.filter((_, i) => i !== index),
                                        }))
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            product_options: prevData.product_options.filter((_, i) => i !== index),
                                        }))
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            asset_ids: prevData.asset_ids.filter((_, i) => i !== index),
                                        }))
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            alternative_types: prevData.alternative_types.filter((_, i) => i !== index),
                                        }))
                                    }}>
                                    <IconifyIcon icon='bi:trash' />
                                </button>

                                <div
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: '-25px',
                                        display: 'flex',
                                        gap: '15px',
                                    }}>
                                    <p style={{ fontSize: '1rem' }}>
                                        {formData.textInfo[index] !== '' && formData.textInfo[index] !== '0'
                                            ? formData.textInfo[index]
                                            : ''}
                                    </p>
                                    {parseFloat(
                                        formData.values[index].toString().replaceAll('.', '').replaceAll(',', '.'),
                                    ) > 0 &&
                                        parseFloat(
                                            formData.quantities[index]
                                                .toString()
                                                .replaceAll('.', '')
                                                .replaceAll(',', '.'),
                                        ) > 0 && (
                                            <p style={{ fontSize: '1rem' }}>
                                                Valor total:{' '}
                                                {formatNumberToReal(
                                                    parseFloat(
                                                        formData.values[index].replaceAll('.', '').replaceAll(',', '.'),
                                                    ) *
                                                        parseFloat(
                                                            formData.quantities[index]
                                                                .replaceAll('.', '')
                                                                .replaceAll(',', '.'),
                                                        ),
                                                )}
                                            </p>
                                        )}
                                </div>
                            </div>
                        ))}

                        <GeralButton
                            type='button'
                            variant='inlineGreen'
                            onClick={() => {
                                setFormData((prevData) => ({
                                    ...prevData,
                                    product_ids: [...prevData.product_ids, '0'],
                                }))
                                setFormData((prevData) => ({
                                    ...prevData,
                                    product_types: [...prevData.product_types, '0'],
                                }))
                                setFormData((prevData) => ({
                                    ...prevData,
                                    culture_codes: [...prevData.culture_codes, ''],
                                }))
                                setFormData((prevData) => ({ ...prevData, values: [...prevData.values, '0'] }))
                                setFormData((prevData) => ({ ...prevData, quantities: [...prevData.quantities, '0'] }))
                                setFormData((prevData) => ({ ...prevData, textInfo: [...prevData.textInfo, '0'] }))
                                setFormData((prevData) => ({
                                    ...prevData,
                                    product_options: [...prevData.product_options, '0'],
                                }))
                                setFormData((prevData) => ({ ...prevData, asset_ids: [...prevData.asset_ids, '0'] }))
                                setFormData((prevData) => ({
                                    ...prevData,
                                    alternative_types: [...prevData.alternative_types, '0'],
                                }))
                            }}>
                            + Adicionar entrada
                        </GeralButton>

                        <div className={styles.actions}>
                            <GeralButton variant='secondary' type='submit' small disabled={loading} value='Adicionar' />

                            <GeralButton
                                variant='quaternary'
                                type='button'
                                small
                                disabled={loading}
                                value='Cancelar'
                                onClick={() => {
                                    setIncomingModal(false)
                                }}
                            />
                        </div>
                    </form>
                </GeralModal>
            )}

            {showEditIncoming && (
                <GeralModal
                    show={showEditIncoming}
                    setShow={setShowEditIncoming}
                    title='Editar entrada'
                    loading={loading}>
                    <form ref={formRef} className={styles.form} onSubmit={editIncoming}>
                        <div className={styles.formGrid} style={{ gridTemplateColumns: `repeat(5, 1fr)` }}>
                            <GeralInput
                                label='Opções'
                                name='product_option'
                                type='select'
                                autoComplete='off'
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                    setFormEditData((prevData) => ({ ...prevData, product_id: '0' }))
                                    setFormEditData((prevData) => ({ ...prevData, product_text: '' }))
                                    setFormEditData((prevData) => ({ ...prevData, product_type: '' }))
                                    setFormEditData((prevData) => ({ ...prevData, culture_code: '' }))
                                    setFormEditData((prevData) => ({ ...prevData, alternative_type: '' }))
                                    handleEditInputChange(e)
                                }}
                                // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                value={formEditData.product_option}
                                readOnly={loading}
                                required>
                                <option value='0'>Selecione a opção</option>
                                <option value='1'>Lavoura</option>
                                <option value='2'>Outros</option>
                            </GeralInput>

                            <GeralInput
                                label='Fornecedor'
                                name='supplier_name'
                                type='text'
                                placeholder='Digite aqui'
                                onChange={handleEditInputChange}
                                defaultValue={formEditData.supplier_name}
                            />

                            <GeralInput
                                label='Data NF'
                                name='entry_date'
                                type='date'
                                placeholder='Digite aqui'
                                onChange={handleEditInputChange}
                                defaultValue={formEditData.entry_date}
                            />
                            <GeralInput
                                label='NF-e'
                                name='nfe_number'
                                type='text'
                                placeholder='Digite aqui'
                                onChange={handleEditInputChange}
                                defaultValue={formEditData.nfe_number}
                            />
                            <GeralInput
                                label='Série'
                                name='nfe_serie'
                                type='text'
                                placeholder='Digite aqui'
                                onChange={handleEditInputChange}
                                defaultValue={formEditData.nfe_serie}
                            />

                            {formEditData.product_option == '1' && (
                                <>
                                    <GeralInput
                                        label='Lavouras'
                                        name='product_type'
                                        type='select'
                                        autoComplete='off'
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                            setFormData((prevData) => ({ ...prevData, product_id: '0' }))
                                            handleEditInputChange(e)
                                        }}
                                        // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                        value={formEditData.product_type}
                                        readOnly={loading}
                                        required>
                                        <option value='0'>Selecione a opção</option>

                                        {productTypes.map((type, index) => (
                                            <option key={index} value={index + 1}>
                                                {type}
                                            </option>
                                        ))}
                                    </GeralInput>

                                    <GeralInput
                                        label='Produto'
                                        name='product_id'
                                        type='select'
                                        autoComplete='off'
                                        placeholder='Digite o nome'
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                            handleEditInputChange(e)
                                        }}
                                        // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                        value={formEditData.product_id}
                                        readOnly={loading}
                                        required>
                                        <option value='0'>Selecione o produto</option>

                                        {/* lendo produtos que estão nos stocks pelo product_id */}
                                        {filterOptions.products
                                            .filter(
                                                (product: any) => product.type == parseInt(formEditData.product_type),
                                                // && stocks.map((stock: any) => stock.product_id).includes(product.id)
                                            )
                                            .map((product: any) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name}
                                                </option>
                                            ))}
                                    </GeralInput>

                                    {formEditData.product_type == '1' && (
                                        <GeralInput
                                            label='Cultivar'
                                            name='culture_code'
                                            type='select'
                                            autoComplete='off'
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                handleEditInputChange(e)
                                            }}
                                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                            value={formEditData.culture_code}
                                            readOnly={loading}
                                            required>
                                            <option value='0'>Selecione o Cultivar</option>

                                            {filterOptions.products
                                                .filter((item: any) => item.id == formEditData.product_id)
                                                .map((item: any) =>
                                                    item.extra_column?.split(',').map((variety: string) => (
                                                        <option key={`${item.id}-${variety}`} value={variety}>
                                                            {variety}
                                                        </option>
                                                    )),
                                                )}
                                        </GeralInput>
                                    )}
                                </>
                            )}

                            {formEditData.product_option == '2' && (
                                <>
                                    <GeralInput
                                        label='Outros'
                                        name='alternative_type'
                                        type='select'
                                        autoComplete='off'
                                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                            handleEditInputChange(e)
                                        }}
                                        // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                        value={formEditData.alternative_type}
                                        readOnly={loading}
                                        required>
                                        <option value='0'>Selecione a opção</option>
                                        <option value='1'>Imposto</option>
                                        <option value='2'>Manutenção</option>
                                        <option value='3'>Seguro</option>
                                        <option value='4'>Combustível</option>
                                        <option value='5'>Colaborador</option>
                                        <option value='6'>Item</option>
                                    </GeralInput>

                                    {!['5', '6'].includes(formEditData.alternative_type) && (
                                        <GeralInput
                                            label='Bem'
                                            name='asset_id'
                                            type='select'
                                            autoComplete='off'
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                                setFormData((prevData) => ({ ...prevData, product_id: '0' }))
                                                handleEditInputChange(e)
                                            }}
                                            // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                            value={formEditData.asset_id}
                                            readOnly={loading}
                                            required>
                                            <option value='0'>Selecione a opção</option>

                                            {assets.map((asset: any) => (
                                                <option key={asset.id} value={asset.id}>
                                                    {asset.name}
                                                </option>
                                            ))}
                                        </GeralInput>
                                    )}

                                    <GeralInput
                                        label='Descrição'
                                        name='product_text'
                                        type='text'
                                        autoComplete='off'
                                        placeholder='Digite o nome'
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            handleEditInputChange(e)
                                        }}
                                        // onClick={() => setAutoCompleteSuggestion((state) => !state)}
                                        value={formEditData.product_text}
                                        readOnly={loading}
                                        required
                                    />
                                </>
                            )}

                            <GeralInput
                                label='Quantidade (Und, Kg, L)'
                                name='quantity'
                                type='text'
                                maskVariant='price'
                                placeholder='00'
                                defaultValue={formEditData.quantity}
                                onChange={handleEditInputChange}
                                required
                            />

                            <GeralInput
                                label='Valor unitário'
                                name='value'
                                type='text'
                                placeholder='Digite o valor'
                                maskVariant='price'
                                onChange={handleEditInputChange}
                                defaultValue={formEditData.value}
                                required
                            />
                        </div>

                        {parseFloat(formEditData.value) > 0 && parseFloat(formEditData.quantity) > 0 && (
                            <p style={{ marginTop: '20px', fontSize: '1rem' }}>
                                Valor total:{' '}
                                {formatNumberToReal(
                                    parseFloat(formEditData.value.replaceAll('.', '').replaceAll(',', '.')) *
                                        parseFloat(formEditData.quantity.replaceAll('.', '').replaceAll(',', '.')),
                                )}
                            </p>
                        )}

                        <div className={styles.actions}>
                            <GeralButton variant='secondary' type='submit' small disabled={loading} value='Editar' />

                            <GeralButton
                                variant='quaternary'
                                type='button'
                                small
                                disabled={loading}
                                value='Cancelar'
                                onClick={() => {
                                    setShowEditIncoming(false)
                                }}
                            />
                        </div>
                    </form>
                </GeralModal>
            )}

            {showDeleteModal && (
                <GeralModal
                    small
                    isDelete
                    deleteName={deleteName}
                    deleteFunction={deleteIncoming}
                    show={showDeleteModal}
                    setShow={setShowDeleteModal}
                    title='Remover entrada'
                    deleteText='Tem certeza que deseja remover a entrada?'
                    deleteButtonText='Sim, remover entrada'
                    loading={loading}
                />
            )}
        </>
    )
}

const Incomings: FC<IncomingsProps> = ({ showIncomingModal, setIncomingModal, searchQuery, filterOptions }) => {
    return (
        <GeralTable headers={tableHeaders} gridColumns={`1.5fr 1fr 1fr 1.2fr 1fr 1fr 1fr 1fr 0.6fr 0.6fr`}>
            <Suspense fallback={<TableSkeleton />}>
                <ErrorBoundary
                    fallbackComponent={<strong className='error-strong'>Erro crítico ao carregar a tabela</strong>}>
                    <InputsRows
                        showIncomingModal={showIncomingModal}
                        setIncomingModal={setIncomingModal}
                        searchQuery={searchQuery}
                        filterOptions={filterOptions}
                    />
                </ErrorBoundary>
            </Suspense>
        </GeralTable>
    )
}

export default Incomings
