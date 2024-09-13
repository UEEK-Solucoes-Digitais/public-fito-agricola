'use client'

import GeralButton from '@/components/buttons/GeralButton'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles.module.scss'

import IconifyIcon from '@/components/iconify/IconifyIcon'
import { MapConst } from '@/consts/MapConst'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import { getStateKey, getStaticCities, getStaticStates } from '@/utils/getStaticLocation'
import WriteLog from '@/utils/logger'
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import axios from 'axios'
import useSWR, { mutate } from 'swr'
import { FormDataCustom } from './types'

// Lazy Components
import GeralModal from '@/components/modal/GeralModal'

export interface PropertiesFormProps {
    id?: number
    setShow: (show: boolean) => void
    show: boolean
    searchPage?: string
}

const PropertiesForm: React.FC<PropertiesFormProps> = ({ id = 0, setShow, show = false, searchPage }) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
    })

    const [lat, setLat] = useState(MapConst.DEFAULT_LATITUDE)
    const [lng, setLng] = useState(MapConst.DEFAULT_LONGITUDE)

    const [openMapDialog, setOpenMapDialog] = useState(false)

    const [markerLat, setMarkerLat] = useState(MapConst.DEFAULT_LATITUDE)
    const [markerLng, setMarkerLng] = useState(MapConst.DEFAULT_LONGITUDE)

    const mapCenter = useMemo(() => ({ lat, lng }), [lat, lng])
    const mapOptions = useMemo<google.maps.MapOptions>(
        () => ({
            // disableDefaultUI: true,
            // clickableIcons: true,
            // scrollwheel: false,
        }),
        [],
    )

    const mapRef = useRef<google.maps.Map | null>(null)

    const onLoadMap = useCallback((map: google.maps.Map) => {
        mapRef.current = map
    }, [])

    const { setToast } = useNotification()
    const [loading, setLoading] = useState(false)
    const [stateId, setStateId] = useState<string | number | null>(null)
    const formRef = useRef<HTMLFormElement>(null)
    const [formData, setFormData] = useState<FormDataCustom>({
        id: undefined,
        name: '',
        admin_id: '',
        state_subscription: '',
        cep: '',
        street: '',
        uf: '',
        city: '',
        neighborhood: '',
        cnpj: '',
        number: 0,
        complement: '',
        latitude: '',
        longitude: '',
    })

    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(`/api/user/list/${admin.id}`, getFetch)

    const states = getStaticStates()
    const cities = getStaticCities(stateId)

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prevData) => ({ ...prevData, [name]: value }))

        if (name == 'cep' && value.length == 9) {
            const cepToSearch = value.replace('-', '')

            axios.get(`https://viacep.com.br/ws/${cepToSearch}/json/`).then((res) => {
                const { logradouro, bairro, localidade, uf } = res.data

                if (formData.street == '') {
                    setFormData((prevData) => ({ ...prevData, street: logradouro }))
                }

                if (formData.neighborhood == '') {
                    setFormData((prevData) => ({ ...prevData, neighborhood: bairro }))
                }

                if (formData.uf != uf) {
                    setFormData((prevData) => ({ ...prevData, uf }))
                    const fakeEvent = {
                        target: {
                            value: uf,
                        },
                    }

                    updateCities(fakeEvent as ChangeEvent<HTMLInputElement>)

                    setTimeout(() => {
                        setFormData((prevData) => ({ ...prevData, city: localidade }))
                    }, 200)
                }
            })
        }
    }

    const updateCenter = () => {
        if (mapRef.current) {
            const newCenter = mapRef.current.getCenter()
            if (newCenter) {
                setLat(newCenter.lat())
                setLng(newCenter.lng())
            }
        }
    }

    const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            const newLat = event.latLng.lat()
            const newLng = event.latLng.lng()
            setMarkerLat(newLat)
            setMarkerLng(newLng)
            setFormData((prevData) => ({ ...prevData, latitude: newLat.toString(), longitude: newLng.toString() }))
        }
    }, [])

    const submitProperty = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (formData.name == '') {
                setToast({ text: 'O campo nome é obrigatório', state: 'info' })
                return
            }

            if (formData.admin_id == '') {
                setToast({ text: 'O campo proprietário é obrigatório', state: 'info' })
                return
            }

            if (formData.uf == '' || formData.city == '') {
                setToast({ text: 'Os campos estado e cidade são obrigatórios', state: 'info' })
                return
            }

            setToast({ text: `${id && id != 0 ? 'Salvando' : 'Adicionando'} propriedade`, state: 'loading' })
            await axios.post('/api/properties/add', formData)

            setToast({ text: `Propriedade ${id && id != 0 ? 'salva' : 'adicionada'} com sucesso`, state: 'success' })
            mutate(`/api/properties/list/${admin.id}?filter=${searchPage}`)
            setShow(false)
        } catch (error: any) {
            WriteLog(error, 'error')
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        }
    }

    const updateCities = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target
        const key = getStateKey(value)
        setStateId(key)
    }

    useEffect(() => {
        if (!show && formRef?.current) {
            formRef.current.reset()
        }
    }, [show])

    useEffect(() => {
        if (id && id != 0) {
            setLoading(true)

            axios.get(`/api/properties/read/${id}?read_miminum=true`).then((response) => {
                const property = response.data.property
                setFormData({
                    id: property.id,
                    name: property.name,
                    admin_id: property.admin_id,
                    state_subscription: property?.state_subscription,
                    cep: property?.cep,
                    street: property?.street,
                    uf: property.uf,
                    city: property.city,
                    neighborhood: property?.neighborhood,
                    number: property?.number,
                    complement: property?.complement,
                    latitude: `${property.coordinates?.coordinates[1] ?? ''}`,
                    longitude: `${property.coordinates?.coordinates[0] ?? ''}`,
                    cnpj: property.cnpj,
                })
                const fakeEvent = {
                    target: {
                        value: property.uf,
                    },
                }
                setMarkerLat(property.coordinates?.coordinates[1] ?? '')
                setMarkerLng(property.coordinates?.coordinates[0] ?? '')
                setLat(property.coordinates?.coordinates[1] ?? '')
                setLng(property.coordinates?.coordinates[0] ?? '')
                updateCities(fakeEvent as ChangeEvent<HTMLInputElement>)
                setLoading(false)
            })
        }
    }, [id])

    useEffect(() => {
        if (typeof error != 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de usuários`, state: 'danger' })
            }
        }
    }, [error])

    return (
        <>
            <GeralModal
                // customClasses={[`${styles.relativeModal}`]}
                show={show}
                setShow={setShow}
                title={`${id && id != 0 ? 'Editar' : 'Nova'} propriedade`}>
                <form ref={formRef} className={styles.addPropertyForm} onSubmit={submitProperty}>
                    {loading ? (
                        <IconifyIcon icon='line-md:loading-loop' />
                    ) : (
                        <>
                            <div className={styles.formGrid}>
                                <GeralInput
                                    label='Nome da propriedade'
                                    name='name'
                                    type='text'
                                    placeholder='Digite o nome'
                                    onChange={handleUserInputChange}
                                    defaultValue={formData.name}
                                    required
                                />
                                <GeralInput
                                    defaultValue={formData.admin_id}
                                    label='Proprietário'
                                    name='admin_id'
                                    type='select'
                                    onChange={handleUserInputChange}
                                    required>
                                    <option disabled value=''>
                                        Selecione
                                    </option>
                                    {isLoading && <ElementSkeleton />}
                                    {!isLoading &&
                                        data &&
                                        data.admins &&
                                        data.admins.map((admin: any) => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name}
                                            </option>
                                        ))}
                                </GeralInput>
                                <GeralInput
                                    defaultValue={formData.state_subscription}
                                    label='Inscrição Estadual'
                                    name='state_subscription'
                                    type='text'
                                    maskVariant='state-subscription'
                                    placeholder='000 000 0000'
                                    maxLength={12}
                                    onChange={handleUserInputChange}
                                />
                                <GeralInput
                                    defaultValue={formData.cep}
                                    label='CEP'
                                    name='cep'
                                    type='text'
                                    placeholder='00000 000'
                                    maskVariant='cep'
                                    maxLength={9}
                                    onChange={handleUserInputChange}
                                />
                                <GeralInput
                                    defaultValue={formData.street}
                                    label='Logradouro'
                                    name='street'
                                    type='text'
                                    placeholder='Digite o nome do logradouro'
                                    maxLength={32}
                                    onChange={handleUserInputChange}
                                    customClasses={[`${styles.expandedCol}`]}
                                />
                                <GeralInput
                                    defaultValue={formData.uf}
                                    label='Estado'
                                    name='uf'
                                    type='select'
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        handleUserInputChange(e)
                                        updateCities(e)
                                    }}
                                    required>
                                    <option disabled value=''>
                                        Selecione
                                    </option>

                                    {states &&
                                        states.map((state: any) => (
                                            <option key={state.name} value={state.initial}>
                                                {state.name}
                                            </option>
                                        ))}
                                </GeralInput>
                                <GeralInput
                                    defaultValue={formData.city}
                                    label='Município'
                                    name='city'
                                    type='select'
                                    onChange={handleUserInputChange}
                                    required>
                                    <option disabled value=''>
                                        Selecione
                                    </option>

                                    {cities &&
                                        cities.map((city: any) => (
                                            <option key={city.name} value={city.name}>
                                                {city.name}
                                            </option>
                                        ))}
                                </GeralInput>
                                <GeralInput
                                    defaultValue={formData.neighborhood}
                                    label='Bairro'
                                    name='neighborhood'
                                    type='text'
                                    placeholder='Digite o bairro'
                                    onChange={handleUserInputChange}
                                />
                                <GeralInput
                                    defaultValue={formData.number}
                                    label='Número'
                                    name='number'
                                    type='text'
                                    placeholder='00'
                                    maskVariant='integer'
                                    onChange={handleUserInputChange}
                                />
                                <GeralInput
                                    defaultValue={formData.complement}
                                    label='Complemento'
                                    name='complement'
                                    type='text'
                                    placeholder='Digite o complemento'
                                    maxLength={9}
                                    onChange={handleUserInputChange}
                                />

                                <GeralInput
                                    defaultValue={formData.cnpj}
                                    label='CNPJ'
                                    name='cnpj'
                                    type='text'
                                    placeholder='00.000.000/0000-00'
                                    maskVariant='cnpj'
                                    onChange={handleUserInputChange}
                                />

                                <GeralInput
                                    defaultValue={formData.latitude}
                                    label='Latitude'
                                    name='latitude'
                                    type='text'
                                    placeholder='0000000000'
                                    onChange={handleUserInputChange}
                                />

                                <div className={styles.mapToggleWrapper}>
                                    <GeralInput
                                        defaultValue={formData.longitude}
                                        label='Longitude'
                                        name='longitude'
                                        type='text'
                                        placeholder='0000000000'
                                        onChange={handleUserInputChange}
                                    />

                                    <GeralButton
                                        smaller
                                        smallIcon
                                        variant='noStyle'
                                        type='button'
                                        onClick={() => {
                                            setOpenMapDialog(true)
                                        }}>
                                        <IconifyIcon icon='icon-park-outline:world' />
                                    </GeralButton>
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

                {openMapDialog && (
                    <div className={`${styles.mapDialog} ${openMapDialog ? styles.showMapDialog : ''}`}>
                        <div className={styles.dialogBody}>
                            <GeralButton
                                smallIcon
                                variant='noStyle'
                                onClick={() => {
                                    setOpenMapDialog(false)
                                }}>
                                Fechar mapa
                                <IconifyIcon icon='ph:x' />
                            </GeralButton>

                            {isLoaded && (
                                <GoogleMap
                                    options={mapOptions}
                                    zoom={15}
                                    center={mapCenter}
                                    onLoad={onLoadMap}
                                    mapTypeId='satellite'
                                    onClick={onMapClick}
                                    onDragEnd={updateCenter}
                                    mapContainerStyle={{ width: '100%', height: '100%' }}>
                                    <Marker key={`${lat}-${lng}`} position={{ lat: markerLat, lng: markerLng }} />
                                </GoogleMap>
                            )}
                        </div>
                    </div>
                )}
            </GeralModal>
        </>
    )
}

export default PropertiesForm
