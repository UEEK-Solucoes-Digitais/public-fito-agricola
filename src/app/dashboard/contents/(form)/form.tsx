'use client'

import AdminProps from '@/@types/Admin'
import ContentProps from '@/@types/Content'
import Property from '@/@types/Property'
import GeralButton from '@/components/buttons/GeralButton'
import stylesReports from '@/components/forms/reports/styles.module.scss'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import getFetch from '@/utils/getFetch'
import { getState, getStateKey } from '@/utils/getStaticLocation'
import { getStateBolivia, getStateKeyBolivia } from '@/utils/getStaticLocationBolivia'
import { getStateKeyParaguai, getStateParaguai } from '@/utils/getStaticLocationParaguai'
import WriteLog from '@/utils/logger'
import axios from 'axios'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import React, { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import styles from './form.module.scss'

export default function Form({ data }: { data?: any }) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()

    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<ContentProps>({
        id: 0,
        title: '',
        categories_ids: [],
        admin_id: admin.id,
        image: null,
        course_cover: null,
        most_watched_cover: null,
        is_course: 0,
        cities: [],
        states: [],
        countries: [],
        access_level: [],
        admins_ids: [],
        properties_ids: [],
        status: 0,
        is_liked: 0,
        is_saved: 0,
        is_watching: 0,
        is_available: 0,
        count_finished: 0,
        count_finished_user: 0,
        watched_seconds: '',
        video_seconds: '',
        blocks: [],
        comments: [],
        text: '',
        videos: [],
        count_videos: 0,
        highlight_category_id: null,
        position: 999,
    })

    const pathname = usePathname()

    const {
        data: dataCategory,
        isLoading: dataCategoryLoading,
        error: dataCategoryError,
    } = useSWR(`/api/contents/categories/list`, getFetch)

    const {
        data: dataItemsForm,
        isLoading: dataItemsFormLoading,
        error: dataItemsFormError,
    } = useSWR(`/api/contents/get-filters-options/${admin.id}`, getFetch)

    const [imagePreview, setImagePreview] = useState('')
    const [imageCoursePreview, setImageCoursePreview] = useState('')
    const [imageMostWachedPreview, setImageMostWachedPreview] = useState('')
    const isEdit = formData.id > 0

    function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target

        if (name == 'highlight_category_id') {
            const object = {
                target: {
                    name: 'categories_ids',
                    value,
                },
            }
            handleInputArrayChange(object as any)
        }

        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    const handleInputArrayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = event.target
        if (value !== '0') {
            const values = formData[name as keyof ContentProps]

            if (Array.isArray(values) && !values.includes(value)) {
                setFormData({ ...formData, [name]: [...values, value.toString()] })
            }
        }
    }

    const removeItem = (name: string, item: string) => {
        const values = formData[name as keyof ContentProps]

        if (Array.isArray(values)) {
            const index = values.indexOf(item.toString())

            if (index > -1) {
                values.splice(index, 1)
            }
        }

        setFormData({
            ...formData,
            [name]: values,
        })
    }

    const updateVideoItem = (index: number, field: string, value: string) => {
        const videos = formData.videos

        if (videos && videos[index]) {
            videos[index][field] = value
            setFormData({ ...formData, videos })
        }
    }

    const addVideoItem = () => {
        const videos = formData.videos ?? []
        videos.push({
            id: 0,
            title: '',
            description: '',
            video_link: '',
            duration_time: '',
            watched_seconds: '',
        })
        setFormData({ ...formData, videos })
    }

    const removeVideoItem = (index: number) => {
        const videos = formData.videos

        if (videos && videos[index]) {
            videos.splice(index, 1)
            setFormData({ ...formData, videos })
        }
    }

    function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
        const { name, files } = e.target

        if (files && files[0]) {
            const file = files[0]
            const fileSize = file.size ?? 0
            const megabytes = 20

            if (fileSize > megabytes * 1024 * 1024) {
                setToast({ text: 'A soma dos tamanhos dos arquivos excede o limite de 20MB', state: 'warning' })
                return
            }

            setFormData((prevData) => ({ ...prevData, [name]: file }))

            if (name == 'course_cover') {
                setImageCoursePreview(URL.createObjectURL(file))
            } else if (name == 'most_watched_cover') {
                setImageMostWachedPreview(URL.createObjectURL(file))
            } else {
                setImagePreview(URL.createObjectURL(file))
            }
        }
    }

    async function makeFormData(): Promise<FormData | boolean> {
        const form = new FormData()
        form.append('id', formData.id.toString())
        form.append('admin_id', admin.id.toString())
        form.append('title', formData.title)
        form.append('text', formData.text)
        form.append('position', formData.position != null ? formData.position.toString() : '999')

        form.append('is_course', formData.is_course.toString())

        if (formData.highlight_category_id) {
            form.append('highlight_category_id', formData.highlight_category_id.toString())
        }

        form.append('is_course', formData.is_course.toString())
        form.append('content_type', pathname.includes('adicionar-ma') || pathname.includes('editar-ma') ? '2' : '1')
        // form.append('videos', formData.videos);
        form.append('categories_ids', formData.categories_ids ? formData.categories_ids.join(',') : '')
        form.append('cities', formData.cities ? formData.cities.join(',') : '')
        form.append('states', formData.states ? formData.states.join(',') : '')
        form.append('countries', formData.countries ? formData.countries.join(',') : '')
        form.append('access_level', formData.access_level ? formData.access_level.join(',') : '')
        form.append('admins_ids', formData.admins_ids ? formData.admins_ids.join(',') : '')
        form.append('properties_ids', formData.properties_ids ? formData.properties_ids.join(',') : '')
        form.append('pathToUpload', 'contents')

        if (formData.videos.length > 0) {
            for (const [index, video] of formData.videos.entries()) {
                form.append(`videos[${index}][id]`, video.id.toString())
                form.append(`videos[${index}][title]`, video.title)
                form.append(`videos[${index}][description]`, video.description)
                form.append(`videos[${index}][video_link]`, video.video_link)
                form.append(`videos[${index}][duration_time]`, video.duration_time)
            }
        }

        if (formData.image) {
            form.append('image', formData.image)
        }
        if (formData.course_cover) {
            form.append('course_cover', formData.course_cover)
        }
        if (formData.most_watched_cover) {
            form.append('most_watched_cover', formData.most_watched_cover)
        }

        return form
    }

    const handleFormSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        try {
            if (!loading) {
                if (formData.categories_ids.length == 0) {
                    setToast({ text: 'Categoria precisa ser selecionada', state: 'warning' })
                    return
                }

                if (!formData.image) {
                    setToast({ text: 'Imagem precisa ser adicionada', state: 'warning' })
                    return
                }
                if (formData.videos.length == 0) {
                    setToast({ text: 'Adicione ao menos um vídeo para prosseguir', state: 'warning' })
                    return
                }

                setLoading(true)
                setToast({ text: `${isEdit ? 'Salvando' : 'Adicionando'} conteúdo`, state: 'loading' })

                const buffer = await makeFormData()

                if (buffer) {
                    const response = await axios.post('/api/contents/form', buffer, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    })

                    if (response.data.status == 200) {
                        setToast({ text: `Conteúdo ${isEdit ? 'salvo' : 'adicionado'} com sucesso`, state: 'success' })

                        // if (!isEdit) {
                        setTimeout(() => {
                            router.push(
                                `/dashboard/conteudos${pathname.includes('adicionar-ma') || pathname.includes('editar-ma') ? '-ma' : ''}`,
                            )
                        }, 1000)
                        // }
                    } else {
                        setToast({ text: response.data.msg, state: 'danger' })
                    }
                }
            }
        } catch (error: any) {
            const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
            WriteLog(error, message)
            setToast({ text: message, state: 'danger' })
        } finally {
            setLoading(false)
        }
    }, [])

    const getAccessName = (access: any) => {
        switch (access) {
            case '1':
                return 'Administrador'
            case '2':
                return 'Produtor'
            case '3':
                return 'Consultor'
            case '4':
                return 'M.A'
            case '5':
                return 'Equipe'
            default:
                return ''
        }
    }

    const getStateName = (state: string) => {
        const stateKey = getStateKey(state)

        if (stateKey) {
            const stateName = getState(stateKey)

            if (stateName) {
                return stateName
            }
        }

        const stateKeyParaguai = getStateKeyParaguai(state)

        if (stateKeyParaguai) {
            const stateNameParaguai = getStateParaguai(stateKeyParaguai)

            if (stateNameParaguai) {
                return stateNameParaguai
            }
        }

        const stateKeyBolivia = getStateKeyBolivia(state)

        if (stateKeyBolivia) {
            const stateNameBolivia = getStateBolivia(stateKeyBolivia)

            if (stateNameBolivia) {
                return stateNameBolivia
            }
        }

        return state
    }

    useEffect(() => {
        if (typeof dataCategoryError !== 'undefined' || typeof dataItemsFormError !== 'undefined') {
            WriteLog(dataCategoryError | dataItemsFormError, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de categorias`, state: 'danger' })
            }
        }
    }, [dataCategoryError, dataItemsFormError])

    useEffect(() => {
        const content = data?.content
        if (content) {
            setFormData({
                id: content.id,
                title: content.title,
                admin_id: content.admin_id,
                image: content.image,
                course_cover: content.course_cover,
                most_watched_cover: content.most_watched_cover,
                status: content.status,
                videos: content.videos,
                categories_ids: content.categories_ids ? content.categories_ids.split(',') : [],
                cities: content.cities ? content.cities.split(',') : [],
                states: content.states ? content.states.split(',') : [],
                countries: content.countries ? content.countries.split(',') : [],
                access_level: content.access_level ? content.access_level.split(',') : [],
                admins_ids: content.admins_ids ? content.admins_ids.split(',') : [],
                properties_ids: content.properties_ids ? content.properties_ids.split(',') : [],
                is_course: content.is_course,
                highlight_category_id: content.highlight_category_id,
                is_liked: 0,
                is_saved: 0,
                is_watching: 0,
                is_available: 0,
                count_finished: 0,
                count_finished_user: 0,
                count_videos: 0,
                watched_seconds: '',
                video_seconds: '',
                blocks: [],
                comments: [],
                text: content.text,
                position: content.position,
            })

            if (content.image) {
                setImagePreview(`${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${content.image}`)
            }

            if (content.course_cover) {
                setImageCoursePreview(`${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${content.course_cover}`)
            }

            if (content.most_watched_cover) {
                setImageMostWachedPreview(`${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${content.most_watched_cover}`)
            }

            // const contentBlocks = content.blocks.map((block: FieldProps) => ({
            //     ...block,
            //     edit: true,
            //     images: block.images.map((img: any) => ({
            //         file: null,
            //         preview: img.image,
            //         isFromDatabase: true,
            //         id: img.id,
            //         idDatabase: img.id,
            //         loading: true,
            //     })),
            // }))
        }
    }, [data])

    return (
        <div className={styles.wrapper}>
            <form onSubmit={handleFormSubmit}>
                <div className={styles.formGroup}>
                    <div className={styles.geralGroup}>
                        <GeralInput
                            value={formData.title}
                            label='Título de publicação'
                            placeholder='Digite o nome'
                            name='title'
                            type='text'
                            autoComplete='off'
                            onChange={handleInputChange}
                            readOnly={loading}
                            required
                        />

                        {formData.is_course == 1 && (
                            <GeralInput
                                defaultValue={formData.position}
                                label='Ordem do curso'
                                placeholder='Digite'
                                name='position'
                                type='number'
                                autoComplete='off'
                                onChange={handleInputChange}
                                readOnly={loading}
                                required
                            />
                        )}
                    </div>

                    <div className={styles.geralGroup}>
                        <GeralInput
                            defaultValue={formData.is_course}
                            label='Tipo de conteúdo'
                            name='is_course'
                            autoComplete='off'
                            onChange={handleInputChange}
                            readOnly={loading}
                            required
                            selectType={2}>
                            <option value='0'>Publicação</option>
                            <option value='1'>Curso</option>
                        </GeralInput>
                        <GeralInput
                            defaultValue={formData.highlight_category_id!}
                            name='highlight_category_id'
                            label='Categoria destaque'
                            type='select'
                            onChange={handleInputChange}>
                            <option value='0'>Selecione</option>

                            {dataCategory &&
                                dataCategory.categories.map((category: any) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                        </GeralInput>
                        {dataCategoryLoading ? (
                            <IconifyIcon icon='line-md:loading-loop' />
                        ) : (
                            <div className={stylesReports.filterGroupGap}>
                                <GeralInput
                                    name='categories_ids'
                                    label='Categorias'
                                    type='select'
                                    onChange={handleInputArrayChange}>
                                    <option value='0'>Selecione</option>

                                    {dataCategory &&
                                        dataCategory.categories.map((category: any) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                </GeralInput>

                                <div className={stylesReports.filterOptions}>
                                    {dataCategory &&
                                        formData.categories_ids != null &&
                                        dataCategory.categories.map(
                                            (category: any) =>
                                                formData.categories_ids!.includes(category.id.toString()) && (
                                                    <div key={category.id} className={stylesReports.filterOptionItem}>
                                                        {category.name}

                                                        <button
                                                            type='button'
                                                            onClick={() =>
                                                                removeItem('categories_ids', category.id.toString())
                                                            }>
                                                            <IconifyIcon icon='ph:x' />
                                                        </button>
                                                    </div>
                                                ),
                                        )}
                                </div>
                            </div>
                        )}
                        {/* <GeralInput
                            value={formData.video_link}
                            label='Link do vídeo (youtube)'
                            placeholder='Insira aqui'
                            name='video_link'
                            type='url'
                            autoComplete='off'
                            onChange={handleInputChange}
                            readOnly={loading}
                            required
                        />
                        <GeralInput
                            value={formData.duration_time}
                            label='Duração do vídeo'
                            placeholder='00:00:00'
                            name='duration_time'
                            type='text'
                            autoComplete='off'
                            onChange={handleInputChange}
                            readOnly={loading}
                            required
                        /> */}
                    </div>
                    {dataItemsFormLoading ? (
                        <IconifyIcon icon='line-md:loading-loop' />
                    ) : (
                        <>
                            <div className={styles.geralGroup}>
                                <div className={stylesReports.filterGroupGap}>
                                    <GeralInput
                                        name='countries'
                                        label='Países'
                                        type='select'
                                        onChange={handleInputArrayChange}>
                                        <option value='0'>Selecione</option>

                                        {dataItemsForm &&
                                            dataItemsForm.countries.map((country: any) => (
                                                <option key={country.id} value={country.id}>
                                                    {country.name}
                                                </option>
                                            ))}
                                    </GeralInput>

                                    <div className={stylesReports.filterOptions}>
                                        {dataItemsForm &&
                                            formData.countries != null &&
                                            dataItemsForm.countries.map(
                                                (country: any) =>
                                                    formData.countries!.includes(country.id.toString()) && (
                                                        <div
                                                            key={country.id}
                                                            className={stylesReports.filterOptionItem}>
                                                            {country.name}

                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    removeItem('countries', country.id.toString())
                                                                }>
                                                                <IconifyIcon icon='ph:x' />
                                                            </button>
                                                        </div>
                                                    ),
                                            )}
                                    </div>
                                </div>
                                <div className={stylesReports.filterGroupGap}>
                                    <GeralInput
                                        name='states'
                                        label='Estados'
                                        type='select'
                                        onChange={handleInputArrayChange}>
                                        <option value='0'>Selecione</option>

                                        {dataItemsForm &&
                                            dataItemsForm.states.map((state: any) => (
                                                <option key={state.id} value={state.id}>
                                                    {getStateName(state.name)}
                                                </option>
                                            ))}
                                    </GeralInput>

                                    <div className={stylesReports.filterOptions}>
                                        {dataItemsForm &&
                                            formData.states != null &&
                                            dataItemsForm.states.map(
                                                (state: any) =>
                                                    formData.states!.includes(state.id.toString()) && (
                                                        <div key={state.id} className={stylesReports.filterOptionItem}>
                                                            {getStateName(state.name)}

                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    removeItem('states', state.id.toString())
                                                                }>
                                                                <IconifyIcon icon='ph:x' />
                                                            </button>
                                                        </div>
                                                    ),
                                            )}
                                    </div>
                                </div>
                                <div className={stylesReports.filterGroupGap}>
                                    <GeralInput
                                        name='cities'
                                        label='Cidades'
                                        type='select'
                                        onChange={handleInputArrayChange}>
                                        <option value='0'>Selecione</option>

                                        {dataItemsForm &&
                                            dataItemsForm.cities.map((city: any) => (
                                                <option key={city.id} value={city.id}>
                                                    {city.name}
                                                </option>
                                            ))}
                                    </GeralInput>

                                    <div className={stylesReports.filterOptions}>
                                        {dataItemsForm &&
                                            formData.cities != null &&
                                            dataItemsForm.cities.map(
                                                (city: any) =>
                                                    formData.cities!.includes(city.id.toString()) && (
                                                        <div key={city.id} className={stylesReports.filterOptionItem}>
                                                            {city.name}

                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    removeItem('cities', city.id.toString())
                                                                }>
                                                                <IconifyIcon icon='ph:x' />
                                                            </button>
                                                        </div>
                                                    ),
                                            )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.geralGroup}>
                                <div className={stylesReports.filterGroupGap}>
                                    <GeralInput
                                        name='access_level'
                                        label='Nível de acesso'
                                        type='select'
                                        onChange={handleInputArrayChange}>
                                        <option value='0'>Selecione</option>
                                        {/* <option value='1'>Administrador</option> */}
                                        <option value='3'>Consultor</option>
                                        <option value='4'>M.A</option>
                                        <option value='5'>Equipe</option>
                                        <option value='2'>Produtor</option>
                                    </GeralInput>

                                    <div className={stylesReports.filterOptions}>
                                        {formData.access_level != null &&
                                            formData.access_level.map((access: string, index) => (
                                                <div key={index} className={stylesReports.filterOptionItem}>
                                                    {getAccessName(access)}

                                                    <button
                                                        type='button'
                                                        onClick={() => removeItem('access_level', access.toString())}>
                                                        <IconifyIcon icon='ph:x' />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                                <div className={stylesReports.filterGroupGap}>
                                    <GeralInput
                                        name='admins_ids'
                                        label='Administradores'
                                        type='select'
                                        onChange={handleInputArrayChange}>
                                        <option value='0'>Selecione</option>

                                        {dataItemsForm &&
                                            dataItemsForm.admins.map((adminLoop: AdminProps) => (
                                                <option key={adminLoop.id} value={adminLoop.id}>
                                                    {adminLoop.name}
                                                </option>
                                            ))}
                                    </GeralInput>

                                    <div className={stylesReports.filterOptions}>
                                        {dataItemsForm &&
                                            formData.admins_ids != null &&
                                            dataItemsForm.admins.map(
                                                (adminLoop: AdminProps) =>
                                                    formData.admins_ids!.includes(adminLoop.id.toString()) && (
                                                        <div
                                                            key={adminLoop.id}
                                                            className={stylesReports.filterOptionItem}>
                                                            {adminLoop.name}

                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    removeItem('admins_ids', adminLoop.id.toString())
                                                                }>
                                                                <IconifyIcon icon='ph:x' />
                                                            </button>
                                                        </div>
                                                    ),
                                            )}
                                    </div>
                                </div>
                                <div className={stylesReports.filterGroupGap}>
                                    <GeralInput
                                        name='properties_ids'
                                        label='Propriedade'
                                        type='select'
                                        onChange={handleInputArrayChange}>
                                        <option value='0'>Selecione</option>

                                        {dataItemsForm &&
                                            dataItemsForm.properties.map((property: Property) => (
                                                <option key={property.id} value={property.id}>
                                                    {property.name}
                                                </option>
                                            ))}
                                    </GeralInput>

                                    <div className={stylesReports.filterOptions}>
                                        {dataItemsForm &&
                                            formData.properties_ids != null &&
                                            dataItemsForm.properties.map(
                                                (property: Property) =>
                                                    formData.properties_ids!.includes(property.id.toString()) && (
                                                        <div
                                                            key={property.id}
                                                            className={stylesReports.filterOptionItem}>
                                                            {property.name}

                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    removeItem('properties_ids', property.id.toString())
                                                                }>
                                                                <IconifyIcon icon='ph:x' />
                                                            </button>
                                                        </div>
                                                    ),
                                            )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <GeralInput
                        value={formData.text}
                        label='Texto principal da publicação'
                        placeholder='Digite aqui'
                        name='text'
                        isTextarea={true}
                        maxLength={1000}
                        type='text'
                        autoComplete='off'
                        onChange={handleInputChange}
                        readOnly={loading}
                    />

                    <div className={styles.geralGroup}>
                        {formData.is_course == 1 && (
                            <div className={styles.imageGroupInput}>
                                <label>Capa da área de curso (320x560px)</label>
                                <div
                                    className={`${styles.group} ${styles.course} ${styles.imageGroup}`}
                                    data-disabled={loading}>
                                    <label
                                        htmlFor='input-media-course'
                                        className={`${styles.imagePreview}`}
                                        title='Clique para anexar arquivos'
                                        data-loading={loading}>
                                        <input
                                            id='input-media-course'
                                            type='file'
                                            name='course_cover'
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                handleFileSelect(e)
                                            }}
                                            multiple
                                            accept='.jpeg, .jpg, .png'
                                            hidden
                                            readOnly={loading}
                                        />

                                        {(imageCoursePreview.length > 0 || (isEdit && formData?.course_cover)) && (
                                            <Image
                                                src={imageCoursePreview}
                                                alt={`Preview da imagem`}
                                                quality={30}
                                                loading='lazy'
                                                fill
                                            />
                                        )}

                                        {!loading && <IconifyIcon icon='fluent:add-28-regular' />}
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className={styles.imageGroupInput}>
                            <label>Capa (380x213px)</label>
                            <div className={`${styles.group} ${styles.imageGroup}`} data-disabled={loading}>
                                <label
                                    htmlFor='input-media'
                                    className={`${styles.imagePreview}`}
                                    title='Clique para anexar arquivos'
                                    data-loading={loading}>
                                    <input
                                        id='input-media'
                                        type='file'
                                        name='image'
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            handleFileSelect(e)
                                        }}
                                        multiple
                                        accept='.jpeg, .jpg, .png'
                                        hidden
                                        readOnly={loading}
                                    />

                                    {(imagePreview.length > 0 || (isEdit && formData?.image)) && (
                                        <Image
                                            src={imagePreview}
                                            alt={`Preview da imagem`}
                                            quality={30}
                                            loading='lazy'
                                            fill
                                        />
                                    )}

                                    {!loading && <IconifyIcon icon='fluent:add-28-regular' />}
                                </label>
                            </div>
                        </div>

                        <div className={styles.imageGroupInput}>
                            <label>Capa da área de mais assistidos (195x275px)</label>
                            <div
                                className={`${styles.group} ${styles.mostWatched} ${styles.imageGroup}`}
                                data-disabled={loading}>
                                <label
                                    htmlFor='input-media-most-watched'
                                    className={`${styles.imagePreview}`}
                                    title='Clique para anexar arquivos'
                                    data-loading={loading}>
                                    <input
                                        id='input-media-most-watched'
                                        type='file'
                                        name='most_watched_cover'
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            handleFileSelect(e)
                                        }}
                                        multiple
                                        accept='.jpeg, .jpg, .png'
                                        hidden
                                        readOnly={loading}
                                    />

                                    {(imageMostWachedPreview.length > 0 ||
                                        (isEdit && formData?.most_watched_cover)) && (
                                        <Image
                                            src={imageMostWachedPreview}
                                            alt={`Preview da imagem`}
                                            quality={30}
                                            loading='lazy'
                                            fill
                                        />
                                    )}

                                    {!loading && <IconifyIcon icon='fluent:add-28-regular' />}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* <div className={styles.addForm}>
                        <div className={styles.inputs}>
                            <GeralInput
                                value={selectedField}
                                label='Tópicos do conteúdo'
                                name='topics'
                                autoComplete='off'
                                onChange={handleSelectField}
                                readOnly={loading}
                                required>
                                <option value={0} disabled>
                                    Selecione um tópico
                                </option>
                                <option value={1}>Texto</option>
                                <option value={2}>Imagem</option>
                                <option value={3}>Imagens</option>
                                <option value={4}>Vídeo (YouTube ou Vímeo)</option>
                                <option value={5}>Áudio (Soundcloud ou Spotify)</option>
                            </GeralInput>

                            <GeralButton type='button' variant='secondary' onClick={addField} disabled={loading} customClasses={['toFill']}>
                                Adicionar tópico
                            </GeralButton>
                        </div>
                    </div> */}

                    {/* {fields.length > 0 && (
                        <div className={styles.newGroups}>
                            <div>
                                {fields.map((field, index: number) => (
                                    <div className={styles.draggableItem}>
                                        <button
                                            className={styles.removeTopic}
                                            title='Remover tópico'
                                            type='button'
                                            onClick={() => removeField(index)}>
                                            <IconifyIcon icon='lucide:trash-2' />
                                        </button>
                                        {field.type == 1 && (
                                            <GeralInput
                                                value={field.content}
                                                label='Publicação'
                                                placeholder='Digite o conteúdo aqui'
                                                name='publication'
                                                type='text'
                                                autoComplete='off'
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    handleFieldChange(field.id, e.target.value)
                                                }
                                                readOnly={loading}
                                                required
                                                maxLength={10000}
                                            />
                                        )}

                                        {field.type == 3 && (
                                            <ImageGallery
                                                type={`gallery-${field.id}`}
                                                selectedFiles={
                                                    field.images
                                                        ? field.images.map((image: any) => ({
                                                            file: null,
                                                            preview: image.preview,
                                                            isFromDatabase: image.isFromDatabase,
                                                            id: image.id,
                                                            idDatabase: image.idDatabase,
                                                            loading: true,
                                                        }))
                                                        : []
                                                }
                                                setSelectedFiles={(newImages) => updateGalleryImages(field.id, newImages)}
                                                loading={loading}
                                            />
                                        )}

                                        {field.type == 4 && (
                                            <GeralInput
                                                value={field.content}
                                                label='Link YouTube/Vimeo'
                                                placeholder='Digite a URL'
                                                name='video'
                                                type='url'
                                                autoComplete='off'
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    handleFieldChange(field.id, e.target.value)
                                                }
                                                readOnly={loading}
                                                required
                                                maxLength={1000}
                                            />
                                        )}

                                        {field.type == 5 && (
                                            <GeralInput
                                                value={field.content}
                                                label='Código incorporado Spotify/Soundcloud'
                                                placeholder='Digite a URL'
                                                name='audio'
                                                type='text'
                                                autoComplete='off'
                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                    handleFieldChange(field.id, e.target.value)
                                                }
                                                required
                                                maxLength={1000}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )} */}

                    <div className={styles.buttons}>
                        <GeralButton variant='secondary' type='submit' disabled={loading} customClasses={['toFill']}>
                            {isEdit ? 'Salvar' : 'Adicionar'} publicação
                        </GeralButton>

                        <GeralButton
                            variant='tertiary'
                            type='button'
                            href={`/dashboard/conteudos${pathname.includes('-ma') ? '-ma' : ''}`}
                            disabled={loading}
                            customClasses={['toFill']}>
                            Cancelar
                        </GeralButton>
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <h3>Vídeos</h3>

                    <div className={styles.videoList}>
                        {formData.videos &&
                            formData.videos.map((video: any, index: number) => (
                                <div key={`video-link-${index}`} className={styles.videoItem}>
                                    <GeralInput
                                        value={video.title}
                                        label='Título'
                                        placeholder='Insira aqui'
                                        name='title'
                                        type='text'
                                        autoComplete='off'
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            updateVideoItem(index, 'title', e.target.value)
                                        }
                                        readOnly={loading}
                                    />
                                    <GeralInput
                                        value={video.description}
                                        label='Descrição'
                                        placeholder='Insira aqui'
                                        name='description'
                                        type='text'
                                        maxLength={1000}
                                        isTextarea
                                        autoComplete='off'
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            updateVideoItem(index, 'description', e.target.value)
                                        }
                                        readOnly={loading}
                                    />
                                    <div className={styles.videoDetails}>
                                        <GeralInput
                                            value={video.video_link}
                                            label='Link do vídeo (youtube)'
                                            placeholder='Insira aqui'
                                            name='video_link'
                                            type='url'
                                            autoComplete='off'
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                updateVideoItem(index, 'video_link', e.target.value)
                                            }
                                            readOnly={loading}
                                            required
                                        />
                                        <GeralInput
                                            defaultValue={video.duration_time}
                                            label='Duração do vídeo'
                                            placeholder='00:00:00'
                                            name='duration_time'
                                            type='text'
                                            maskVariant='duration'
                                            autoComplete='off'
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                updateVideoItem(index, 'duration_time', e.target.value)
                                            }
                                            readOnly={loading}
                                            required
                                        />
                                    </div>
                                    <GeralButton
                                        variant='delete'
                                        round
                                        small
                                        smallIcon
                                        type='button'
                                        onClick={() => {
                                            removeVideoItem(index)
                                        }}>
                                        <IconifyIcon icon='prime:trash' />
                                    </GeralButton>
                                </div>
                            ))}

                        <GeralButton type='button' variant='inlineGreen' onClick={addVideoItem}>
                            + Adicionar vídeo
                        </GeralButton>
                    </div>
                </div>
            </form>
        </div>
    )
}
