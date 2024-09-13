'use client'

import Property from '@/@types/Property'
import GeralButton from '@/components/buttons/GeralButton'
import stylesReports from '@/components/forms/reports/styles.module.scss'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import { formatNumberToBR } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import { getCurrency } from '@/utils/getMetricUnity'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import Image from 'next/image'
import { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from '../styles.module.scss'
import { FormDataCustom } from '../types'

interface AssetsFormProps {
    id?: number
    setShow: (show: boolean) => void
    show: boolean
    property: string
    activePage: number
    searchPage?: string
}

const AssetsForm: FC<AssetsFormProps> = ({ id = 0, setShow, show = false, property, activePage, searchPage }) => {
    const { admin } = useAdmin()
    const { setToast } = useNotification()
    const [loading, setLoading] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)
    const [formData, setFormData] = useState<FormDataCustom>({
        admin_id: admin.id,
        id: 0,
        name: '',
        type: '',
        value: '',
        property_id: 0,
        observations: '',
        image: '',
        year: '',
        lifespan: '',
        buy_date: '',
        properties: [],
    })

    const [imagePreview, setImagePreview] = useState('')
    const [imagePreviewLoading, setImagePreviewLoading] = useState(true)

    const { data, isLoading, error } = useSWR(`/api/properties/list/${admin.id}`, getFetch)

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
        const { files } = e.target

        if (files && files[0]) {
            const file = files[0]
            const fileSize = file.size ?? 0
            const megabytes = 20

            if (fileSize > megabytes * 1024 * 1024) {
                setToast({ text: 'A soma dos tamanhos dos arquivos excede o limite de 20MB', state: 'warning' })
                return
            }

            setFormData((prevData) => ({ ...prevData, image: file }))
            setImagePreview(URL.createObjectURL(file))
            setImagePreviewLoading(true)
        }
    }

    function validateFields() {
        if (formData.name == '') {
            setToast({ text: 'O nome do bem é obrigatório', state: 'warning' })
            return false
        }
        if (formData.type == '') {
            setToast({ text: 'O tipo do bem é obrigatório', state: 'warning' })
            return false
        }
        if (formData.value == '') {
            setToast({ text: 'O valor do bem é obrigatório', state: 'warning' })
            return false
        }
        if (formData.properties.length == 0) {
            setToast({ text: 'Vincule ao menos 1 propriedade', state: 'warning' })
            return false
        }

        return true
    }

    const handleChangeProperties = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target

        if (value == '0') {
            return
        }

        if (!formData.properties.includes(value.toString())) {
            setFormData((prevData) => ({ ...prevData, properties: [...prevData.properties, value.toString()] }))
        }
    }

    const removeProperty = (id: string) => {
        setFormData((prevData) => ({
            ...prevData,
            properties: prevData.properties.filter((property) => property !== id),
        }))
    }

    const submitAsset = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (validateFields()) {
                setToast({ text: `${id && id !== 0 ? 'Salvando' : 'Adicionando'} bem`, state: 'loading' })
                const body = new FormData()
                body.append('pathToUpload', 'assets')

                for (const [key, value] of Object.entries(formData)) {
                    if (key == 'properties') {
                        body.append(key, value.join(','))
                        continue
                    }

                    body.append(key, value)
                }

                await axios
                    .post('/api/assets/form', body, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    })
                    .catch((error) => {
                        throw error
                    })

                setToast({ text: `Bem ${id && id !== 0 ? 'salvo' : 'adicionado'} com sucesso`, state: 'success' })
                mutate(
                    `/api/assets/list/${admin.id}?page=${activePage}${
                        property ? '&property=' + property : ''
                    }&filter=${searchPage}`,
                )
                setShow(false)

                setFormData({
                    admin_id: admin.id,
                    id: 0,
                    name: '',
                    type: '',
                    value: '',
                    properties: [],
                    observations: '',
                    image: '',
                    year: '',
                    lifespan: '',
                    buy_date: '',
                    property_id: 0,
                })

                setImagePreview('')
                setImagePreviewLoading(false)
            }
        } catch (error: any) {
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    useEffect(() => {
        if (!show && formRef?.current) {
            formRef.current.reset()
        }
    }, [show])

    useEffect(() => {
        if (id && id !== 0) {
            setLoading(true)

            axios.get(`/api/assets/read/${id}`).then((response) => {
                const asset = response.data.asset

                const properties: string[] = []

                asset.properties.forEach((property: Property) => {
                    properties.push(property.id.toString())
                })

                setFormData({
                    admin_id: admin.id,
                    id: asset.id,
                    name: asset.name != null ? asset.name : '',
                    type: asset.type != null ? asset.type : '',
                    value: formatNumberToBR(asset.value),
                    property_id: asset.property_id != null ? asset.property_id : '',
                    observations: asset.observations != null ? asset.observations : '',
                    image: asset.image != null ? asset.image : '',
                    year: asset.year != null ? asset.year : '',
                    lifespan: asset.lifespan != null ? asset.lifespan : '',
                    buy_date: asset.buy_date != null ? asset.buy_date : '',
                    properties,
                })

                if (asset.image && imagePreview.length == 0) {
                    setImagePreview(`${process.env.NEXT_PUBLIC_IMAGE_URL}/assets/${asset.image}`)
                    setImagePreviewLoading(true)
                } else {
                    setImagePreview('')
                    setImagePreviewLoading(false)
                }

                setLoading(false)
            })
        }
    }, [id, admin])

    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de bens`, state: 'danger' })
            }
        }
    }, [error])

    return (
        <>
            <GeralModal show={show} setShow={setShow} title={`${id && id !== 0 ? 'Editar' : 'Novo'} bem`}>
                <form ref={formRef} className={styles.addAssetForm} onSubmit={submitAsset}>
                    {loading ? (
                        <IconifyIcon icon='line-md:loading-loop' />
                    ) : (
                        <>
                            <div className={styles.formGrid}>
                                <GeralInput
                                    label='Nome do bem'
                                    name='name'
                                    type='text'
                                    placeholder='Digite o nome'
                                    onChange={handleUserInputChange}
                                    defaultValue={formData.name}
                                    required
                                />

                                <GeralInput
                                    defaultValue={formData.type}
                                    label='Tipo'
                                    name='type'
                                    type='text'
                                    placeholder='Digite o tipo'
                                    onChange={handleUserInputChange}
                                />
                                <GeralInput
                                    defaultValue={formData.value}
                                    label='Valor aproximado'
                                    leftText={`${getCurrency()}`}
                                    name='value'
                                    type='text'
                                    placeholder='00'
                                    maskVariant='price'
                                    maxLength={13}
                                    onChange={handleUserInputChange}
                                />

                                {isLoading && <ElementSkeleton />}
                                {!isLoading && (
                                    // <GeralInput
                                    //     defaultValue={formData.property_id}
                                    //     label='Propriedade'
                                    //     name='property_id'
                                    //     type='select'
                                    //     onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    //         handleUserInputChange(e);
                                    //     }}
                                    //     required>
                                    //     <option disabled value={0}>
                                    //         Selecione
                                    //     </option>

                                    //     {data &&
                                    //         data.properties &&
                                    //         data.properties.map((property: any) => (
                                    //             <option key={property.id} value={property.id}>
                                    //                 {property.name}
                                    //             </option>
                                    //         ))}
                                    // </GeralInput>
                                    <div className={stylesReports.filterGroupGap}>
                                        <GeralInput
                                            name='properties_ids'
                                            label='Propriedades'
                                            type='select'
                                            onChange={handleChangeProperties}
                                            filterInitialValue={true}>
                                            <option value='0'>Selecione</option>

                                            {data &&
                                                data.properties &&
                                                data.properties.map((property: Property) => (
                                                    <option key={property.id} value={property.id}>
                                                        {property.name}
                                                    </option>
                                                ))}
                                        </GeralInput>

                                        <div className={stylesReports.filterOptions}>
                                            {data &&
                                                data.properties &&
                                                data.properties.map(
                                                    (property: Property) =>
                                                        formData.properties.includes(property.id.toString()) && (
                                                            <div
                                                                key={property.id}
                                                                className={stylesReports.filterOptionItem}>
                                                                {property.name}

                                                                <button
                                                                    onClick={() =>
                                                                        removeProperty(property.id.toString())
                                                                    }>
                                                                    <IconifyIcon icon='ph:x' />
                                                                </button>
                                                            </div>
                                                        ),
                                                )}
                                        </div>
                                    </div>
                                )}

                                <GeralInput
                                    defaultValue={formData.year}
                                    label='Ano'
                                    name='year'
                                    type='text'
                                    placeholder='0000'
                                    maskVariant='year'
                                    maxLength={4}
                                    onChange={handleUserInputChange}
                                />
                                <GeralInput
                                    defaultValue={formData.buy_date}
                                    label='Compra'
                                    name='buy_date'
                                    type='date'
                                    onChange={handleUserInputChange}
                                />
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <GeralInput
                                    defaultValue={formData.lifespan}
                                    label='Vida útil'
                                    name='lifespan'
                                    type='text'
                                    placeholder='Digite aqui'
                                    onChange={handleUserInputChange}
                                />
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <GeralInput
                                    label='Observações'
                                    name='observations'
                                    type='text'
                                    placeholder='Digite aqui'
                                    onChange={handleUserInputChange}
                                    defaultValue={formData.observations}
                                    required={false}
                                />
                            </div>

                            <div className={`${styles.imageGroupInput}`}>
                                <label>Imagem</label>
                                <div
                                    className={`${styles.group} ${styles.imageGroup} ${
                                        imagePreview.length > 0 && imagePreviewLoading ? styles.loading : ''
                                    }`}
                                    data-disabled={loading}>
                                    <label
                                        htmlFor='input-media'
                                        className={styles.imagePreview}
                                        title='Clique para anexar arquivos'
                                        data-loading={loading}>
                                        <input
                                            id='input-media'
                                            type='file'
                                            name='files'
                                            onChange={handleFileSelect}
                                            multiple
                                            accept='.jpeg, .jpg, .png'
                                            hidden
                                            readOnly={loading}
                                        />

                                        {imagePreview.length > 0 && (
                                            <Image
                                                src={imagePreview}
                                                alt={`Preview da imagem`}
                                                quality={30}
                                                loading='lazy'
                                                onLoad={() => setImagePreviewLoading(false)}
                                                fill
                                            />
                                        )}

                                        {!loading && imagePreview.length == 0 && (
                                            <IconifyIcon icon='fluent:add-28-regular' />
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <GeralButton
                                    variant='secondary'
                                    type='submit'
                                    small
                                    value={`${formData.id ? 'Editar' : 'Adicionar'}`}
                                />
                                <GeralButton
                                    variant='quaternary'
                                    type='button'
                                    small
                                    value='Cancelar'
                                    onClick={() => {
                                        setShow(false)
                                    }}
                                />
                            </div>
                        </>
                    )}
                </form>
            </GeralModal>
        </>
    )
}

export default AssetsForm
