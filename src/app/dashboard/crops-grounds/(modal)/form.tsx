import Property from '@/@types/Property'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import GeralModal from '@/components/modal/GeralModal'
import { ToastProps } from '@/components/notifications/types'
import { getDateShort } from '@/utils/getDate'
import axios from 'axios'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { KeyedMutator } from 'swr'
import { CropFile } from '../(modules)/types'
import { Crop } from '../../properties/types'
import styles from './styles.module.scss'

interface IProps {
    showModal: boolean
    setShowModal: (value: boolean) => void
    cropFileId: number
    crops: Crop[]
    properties: Property[]
    setToast: (data: ToastProps) => void
    mutate: KeyedMutator<{
        crops_files: CropFile[]
        properties: Property[]
        crops: Crop[]
        total: number
    }>
    adminId: number
}

export default function CropFileFormModal({
    showModal,
    setShowModal,
    cropFileId,
    setToast,
    mutate,
    adminId,
    crops,
    properties,
}: IProps) {
    // criação do objeto de form
    const [fileFormState, setFileFormState] = useState({
        id: 0,
        name: ` - ${getDateShort()}`,
        clay: 0,
        path: null,
        base_saturation: 0,
        organic_material: 0,
        unit_ca: 0,
        unit_al: 0,
        unit_k: 0,
        unit_mg: 0,
        unit_p: 0,
        admin_id: adminId,
        crop_id: 0,
    })

    // filtro de propriedade
    const [selectedPropertyId, setSelectedPropertyId] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    // handle de seleção de arquivo
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target
        setFileFormState((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }))
    }

    // nome do arquivo
    const getFileString = (fileItem: string | File | undefined | null) => {
        if (fileItem == undefined || fileItem == null) return 'Nome do arquivo'

        if (typeof fileItem == 'string') {
            return fileItem
        } else {
            return fileItem.name
        }
    }

    const validateNumberValues = () => {
        if (fileFormState.clay.toString().length > 6) return false
        if (fileFormState.base_saturation.toString().length > 6) return false
        if (fileFormState.organic_material.toString().length > 6) return false
        if (fileFormState.unit_ca.toString().length > 6) return false
        if (fileFormState.unit_al.toString().length > 6) return false
        if (fileFormState.unit_k.toString().length > 6) return false
        if (fileFormState.unit_mg.toString().length > 6) return false
        if (fileFormState.unit_p.toString().length > 6) return false
        return true
    }

    // submit de form
    const handleFileForm = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (fileFormState.path == null) {
            setToast({ text: 'Selecione um arquivo', state: 'danger' })
            return
        }

        if (fileFormState.crop_id == 0) {
            setToast({ text: 'Selecione uma lavoura', state: 'danger' })
            return
        }

        if (!validateNumberValues()) {
            setToast({ text: 'É permitido valores de 0 à 999', state: 'danger' })
            return
        }

        setToast({ text: fileFormState.id == 0 ? 'Criando laudo' : `Atualizando laudo`, state: 'loading' })

        const formDataExample = new FormData()
        formDataExample.append('id', fileFormState.id.toString())
        formDataExample.append('name', fileFormState.name)
        formDataExample.append('clay', fileFormState.clay.toString())
        formDataExample.append('base_saturation', fileFormState.base_saturation.toString())
        formDataExample.append('organic_material', fileFormState.organic_material.toString())
        formDataExample.append('unit_ca', fileFormState.unit_ca.toString())
        formDataExample.append('unit_al', fileFormState.unit_al.toString())
        formDataExample.append('unit_k', fileFormState.unit_k.toString())
        formDataExample.append('unit_mg', fileFormState.unit_mg.toString())
        formDataExample.append('unit_p', fileFormState.unit_p.toString())
        formDataExample.append('admin_id', fileFormState.admin_id.toString())
        formDataExample.append('path', fileFormState.path)
        formDataExample.append('crop_id', fileFormState.crop_id.toString())
        formDataExample.append('pathToUpload', 'crops')

        try {
            axios
                .post('/api/crops-ground/form', formDataExample, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
                .then((res) => {
                    if (res.status == 200) {
                        mutate()
                        setToast({ text: 'Operação realizada com sucesso', state: 'success' })
                        setShowModal(false)
                    } else {
                        setToast({ text: 'Não foi possível completar a operação no momento', state: 'danger' })
                    }
                })
                .catch((error: any) => {
                    const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
                    setToast({
                        text: message,
                        state: 'danger',
                    })
                })
        } catch (error: any) {
            const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
            setToast({
                text: message,
                state: 'danger',
            })
        }
    }

    // carregar dados do laudo caso seja edição
    useEffect(() => {
        if (cropFileId) {
            setIsLoading(true)
            axios.get(`/api/crops-ground/read/${cropFileId}`).then((response) => {
                const { crop_file } = response.data

                setFileFormState({
                    id: crop_file.id,
                    name: crop_file.name,
                    clay: crop_file.clay,
                    path: crop_file.path,
                    base_saturation: crop_file.base_saturation,
                    organic_material: crop_file.organic_material,
                    unit_ca: crop_file.unit_ca,
                    unit_al: crop_file.unit_al,
                    unit_k: crop_file.unit_k,
                    unit_mg: crop_file.unit_mg,
                    unit_p: crop_file.unit_p,
                    crop_id: crop_file.crop_id,
                    admin_id: adminId,
                })

                setSelectedPropertyId(crop_file.crop.property_id)
                setIsLoading(false)
            })
        }
    }, [])

    return (
        <GeralModal show={showModal} setShow={setShowModal} title='Upload de documento de laudo'>
            {isLoading ? (
                <div>
                    <IconifyIcon icon='line-md:loading-loop' />
                </div>
            ) : (
                <form onSubmit={handleFileForm} className={styles.form}>
                    <GeralInput
                        name='name'
                        type='text'
                        label='Nome do laudo'
                        value={fileFormState.name}
                        onChange={handleFileInput}
                        customClasses={[`${styles.my3}`]}
                        required
                    />
                    <div className={styles.formGroup}>
                        <GeralInput
                            defaultValue={selectedPropertyId}
                            label='Propriedade'
                            name='property_id'
                            type='select'
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                setSelectedPropertyId(Number(e.target.value))
                            }}
                            required>
                            <option value={0}>Selecione</option>

                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.name}
                                </option>
                            ))}
                        </GeralInput>

                        <GeralInput
                            defaultValue={fileFormState.crop_id}
                            label='Lavoura'
                            name='crop_id'
                            type='select'
                            onChange={handleFileInput}
                            required>
                            <option value={0}>Selecione</option>

                            {crops
                                .filter((crop) => crop.property_id == selectedPropertyId)
                                .map((crop) => (
                                    <option key={`crop-id-${crop.id}`} value={crop.id}>
                                        {crop.name}
                                    </option>
                                ))}
                        </GeralInput>

                        <GeralInput
                            lightLabel
                            maskVariant='price'
                            decimalScale={0}
                            maxLength={3}
                            name='clay'
                            type='text'
                            label='Teor de argila (%)'
                            defaultValue={fileFormState.clay}
                            onChange={handleFileInput}
                        />

                        <GeralInput
                            lightLabel
                            maskVariant='price'
                            decimalScale={2}
                            name='organic_material'
                            type='text'
                            label='Matéria orgânica (%)'
                            defaultValue={fileFormState.organic_material}
                            onChange={handleFileInput}
                        />

                        <GeralInput
                            lightLabel
                            maskVariant='price'
                            decimalScale={2}
                            name='base_saturation'
                            type='text'
                            label='Saturação de bases (%)'
                            defaultValue={fileFormState.base_saturation}
                            onChange={handleFileInput}
                        />

                        <GeralInput
                            lightLabel
                            maskVariant='price'
                            decimalScale={2}
                            name='unit_ca'
                            type='text'
                            label='Ca (cmol/dm³)'
                            defaultValue={fileFormState.unit_ca}
                            onChange={handleFileInput}
                        />

                        <GeralInput
                            lightLabel
                            maskVariant='price'
                            decimalScale={2}
                            name='unit_mg'
                            type='text'
                            label='Mg (cmol/dm³)'
                            defaultValue={fileFormState.unit_mg}
                            onChange={handleFileInput}
                        />

                        <GeralInput
                            lightLabel
                            maskVariant='price'
                            name='unit_al'
                            type='text'
                            label='Al (cmol/dm³)'
                            defaultValue={fileFormState.unit_al}
                            onChange={handleFileInput}
                        />

                        <GeralInput
                            lightLabel
                            maskVariant='price'
                            decimalScale={2}
                            name='unit_k'
                            type='text'
                            label='K (mg/dm³)'
                            defaultValue={fileFormState.unit_k}
                            onChange={handleFileInput}
                        />

                        <GeralInput
                            lightLabel
                            maskVariant='price'
                            decimalScale={2}
                            name='unit_p'
                            type='text'
                            label='P (mg/dm³)'
                            defaultValue={fileFormState.unit_p}
                            onChange={handleFileInput}
                        />
                    </div>

                    <GeralInput
                        id='path'
                        name='path'
                        type='file'
                        label='Documento de laudo'
                        placeholder='Nome do arquivo'
                        fileName={getFileString(fileFormState.path)}
                        onChange={handleFileInput}
                        customClasses={[`${styles.my3}`]}
                    />

                    <GeralButton variant='secondary' value={'Confirmar'} type='submit' />
                </form>
            )}
        </GeralModal>
    )
}
