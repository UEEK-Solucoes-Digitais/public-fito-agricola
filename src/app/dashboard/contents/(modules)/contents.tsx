'use client'

import ContentProps from '@/@types/Content'
import ContentCategoryProps from '@/@types/ContentCategory'
import GeralButton from '@/components/buttons/GeralButton'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import GeralInput from '@/components/inputs/GeralInput'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import { Reveal } from '@/components/reveal/reveal'
import { useAdmin } from '@/context/AdminContext'
import { useSearch } from '@/context/SearchContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import { usePathname } from 'next/navigation'
import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from 'react'
import SortableList, { SortableItem } from 'react-easy-sort'
import useSWR, { mutate as mutateGeral } from 'swr'
import Categories from './categories'
import styles from './contents.module.scss'
import FormAccessType from './form_access_type'
import SwiperComponent from './swiper'

interface FormProps {
    id?: number
    name: string
    admin_id?: number
}

interface ModalProps {
    edit: boolean
    oldForm?: FormProps
    openModal: boolean
    setOpenModal: Dispatch<SetStateAction<boolean>>
}

function FormModal({ edit, oldForm, openModal, setOpenModal }: ModalProps) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<FormProps>({
        id: oldForm?.id ?? 0,
        name: oldForm?.name ?? '',
        admin_id: admin.id,
    })

    function closeModal() {
        setOpenModal(false)
    }

    function handleChangeName(e: ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        setFormData((prevData) => ({ ...prevData, [name]: value }))
    }

    function resetFields() {
        setFormData({
            id: 0,
            name: '',
        })
    }

    async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        try {
            if (!loading) {
                setLoading(true)
                setToast({ text: `${edit ? 'Salvando' : 'Adicionando'} categoria`, state: 'loading' })

                await axios
                    .post('/api/contents/categories/form', formData)
                    .then((response: any) => {
                        if (response.data.status == 200) {
                            setToast({
                                text: `Categoria ${edit ? 'salva' : 'adicionada'} com sucesso`,
                                state: 'success',
                            })

                            mutateGeral(`/api/contents/categories/list`)
                            setOpenModal(false)
                            resetFields()
                        } else {
                            setToast({ text: response.data.msg, state: 'danger' })
                        }
                    })
                    .catch((error) => {
                        throw error
                    })
            }
        } catch (error: any) {
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            WriteLog(error, 'error')
            setToast({ text: message, state: 'danger' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <GeralModal
                title={`${edit ? 'Editar' : 'Adicionar'} categoria`}
                show={openModal}
                setShow={closeModal}
                loading={loading}>
                <form className={styles.formCategory} onSubmit={handleFormSubmit}>
                    <GeralInput
                        value={formData.name}
                        label='Nome'
                        name='name'
                        type='text'
                        placeholder='Digite o nome'
                        onChange={handleChangeName}
                        readOnly={loading}
                        required
                    />

                    <GeralButton variant='secondary' type='submit' disabled={loading}>
                        {edit ? 'Salvar' : 'Adicionar'}
                    </GeralButton>
                </form>
            </GeralModal>
        </>
    )
}

export default function Contents() {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const pathname = usePathname()

    const contentType = pathname.includes('conteudos-ma') ? 2 : 1

    const { data, isLoading, error, mutate } = useSWR<{
        contents: ContentProps[]
        newest: ContentProps[]
        courses: ContentProps[]
        saved_contents: ContentProps[]
        keep_watching: ContentProps[]
        most_viewed: ContentProps[]
        all_contents: ContentProps[]
        content_categories: ContentCategoryProps[]
        access_enabled: boolean
    }>(`/api/contents/list/${admin.id}/${contentType}`, getFetch)

    const [openFormModal, setOpenFormModal] = useState(false)
    const [openDeleteModal, setOpenDeleteModal] = useState(false)
    const [openOrganizeModal, setOpenOrganizeModal] = useState(false)

    const [sortCategories, setSortCategories] = useState<ContentCategoryProps[]>([])

    const [oldForm, setOldForm] = useState<FormProps>({
        id: 0,
        name: '',
        admin_id: admin.id,
    })

    const [loading, setLoading] = useState(false)
    const [deleteId, setDeleteId] = useState(0)
    const [deleteModal, setDeleteModal] = useState(false)
    const { searchPage, setSearchPage, categoryPage, setCategoryPage } = useSearch()

    useEffect(() => {
        setSearchPage('')
        setCategoryPage(0)
    }, [])

    const filteredData = useMemo(() => {
        if (data?.all_contents) {
            return data.all_contents.filter((content: ContentProps) =>
                content.title.toLowerCase().includes(searchPage.toLowerCase()),
            )
        }

        return []
    }, [searchPage, data?.all_contents])

    const groupedContents = useMemo(() => {
        if (!data?.contents || !data?.content_categories) return {}

        const grouped = data.content_categories.reduce(
            (acc, category) => {
                acc[category.name] = []
                return acc
            },
            {} as Record<string, ContentProps[]>,
        )

        data.contents.forEach((content) => {
            if (content.highlight_category_id != null && content.highlight_category_id !== 0) {
                const category = data.content_categories.find((cat) => cat.id == content.highlight_category_id)
                const categoryName = category?.name ?? 'Outros'
                if (grouped[categoryName]) {
                    grouped[categoryName].push(content)
                }
            } else {
                content.categories_ids.forEach((categoryId) => {
                    const category = data.content_categories.find((cat) => cat.id == parseInt(categoryId))
                    const categoryName = category?.name ?? 'Outros'
                    if (grouped[categoryName]) {
                        grouped[categoryName].push(content)
                    }
                })
            }
        })

        return grouped
    }, [data])

    const categoryList = useMemo(() => {
        return Object.entries(groupedContents).filter(([, contents]) => {
            return (
                categoryPage == 0 ||
                contents.some(
                    (content) =>
                        content.highlight_category_id == categoryPage ||
                        content.categories_ids.includes(categoryPage.toString()),
                )
            )
        })
    }, [groupedContents, categoryPage])

    async function deleteContent() {
        try {
            if (deleteId == 0) {
                setToast({ text: `Ocorreu um problema, feche esse modal e repita o processo`, state: 'loading' })
                return
            }

            if (!loading) {
                setLoading(true)
                setToast({ text: `Excluindo conteúdo`, state: 'loading' })

                await updateStatus('/api/contents/delete', admin.id, deleteId, 0).then(() => {
                    setDeleteModal(false)
                    setToast({ text: `Conteúdo excluido`, state: 'success' })
                    mutate()
                })
            }
        } catch (error: any) {
            const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        } finally {
            setLoading(false)
        }
    }

    function resetFields() {
        setOldForm({
            id: 0,
            name: '',
            admin_id: admin.id,
        })
    }

    async function deleteCategory() {
        try {
            if (!loading) {
                setLoading(true)
                setToast({ text: `Excluindo categoria`, state: 'loading' })

                await axios
                    .post('/api/contents/categories/delete', oldForm)
                    .then((response: any) => {
                        if (response.data.status == 200) {
                            setToast({ text: `Categoria removida`, state: 'success' })
                            mutateGeral('/api/contents/categories/list')
                            resetFields()
                            setOpenDeleteModal(false)
                        } else {
                            setToast({ text: response.data.msg, state: 'danger' })
                        }
                    })
                    .catch((error) => {
                        throw error
                    })
            }
        } catch (error: any) {
            const message = error?.response?.data?.error ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
            WriteLog(error, 'error')
        } finally {
            setLoading(false)
        }
    }

    const onSortEnd = (oldIndex: number, newIndex: number) => {
        if (oldIndex == newIndex) {
            return
        }

        const newCategories = sortCategories

        const removed = newCategories?.splice(oldIndex, 1)
        newCategories?.splice(newIndex, 0, removed![0])
        setSortCategories(newCategories)

        setToast({ text: `Salvando nova ordem`, state: 'loading' })

        const categoriesIds = newCategories.map((category) => category.id)

        axios
            .post('/api/contents/categories/organize', { categories: categoriesIds, admin_id: admin.id })
            .then((response) => {
                if (response.data.status == 200) {
                    setToast({ text: `Ordem salva`, state: 'success' })
                    mutate()
                } else {
                    setToast({ text: response.data.msg, state: 'danger' })
                }
            })
    }

    useEffect(() => {
        if (!deleteModal) {
            setDeleteId(0)
        }
    }, [deleteModal])

    useEffect(() => {
        if (data && data.content_categories) {
            setSortCategories(data.content_categories)
        }
    }, [data])

    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de conteúdos`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading || !data) {
        return <ElementSkeleton />
    }

    if (!data.access_enabled) {
        return (
            <div className={styles.accessDisabled}>
                <h2>Você não possui permissão para acessar essa área</h2>
                <p>Caso queira liberar esse acesso, entre em contato.</p>
                <GeralButton
                    onClick={() => {
                        window.open(
                            `https://wa.me/+555496219771?text=Olá, me chamo ${admin.name} e tenho interesse na área M.A.`,
                        )
                    }}
                    value='Ir para o WhatsApp'>
                    <IconifyIcon icon='ic:baseline-whatsapp' />
                </GeralButton>
            </div>
        )
    }

    return (
        <div className={styles.contentWrapper}>
            <ErrorBoundary
                fallbackComponent={<strong className='error-strong'>Erro crítico ao carregar conteúdos</strong>}>
                {admin.access_level == 1 && (
                    <div className={styles.contentActions}>
                        <GeralButton
                            small
                            variant='tertiary'
                            onClick={() => setOpenOrganizeModal(true)}
                            value='Configurar ordem de exibição'>
                            <IconifyIcon icon='ic:baseline-sort' />
                        </GeralButton>
                        {contentType !== 1 && <FormAccessType contentType={contentType} />}
                    </div>
                )}

                <Reveal className={styles.contentArea} duration={1000} fraction={0} damping={0} triggerOnce cascade>
                    {admin.access_level == 1 && (
                        <Categories
                            openFormModal={openFormModal}
                            setOpenFormModal={setOpenFormModal}
                            openDeleteModal={openDeleteModal}
                            setOpenDeleteModal={setOpenDeleteModal}
                            oldForm={oldForm}
                            setOldForm={setOldForm}
                        />
                    )}

                    {categoryPage !== 0 && (
                        <div className={styles.categoryTitle}>
                            <h1>
                                Filtrando por:{' '}
                                {data.content_categories.find((cat) => cat.id == categoryPage)?.name ?? 'Categoria'}
                            </h1>
                            <GeralButton
                                onClick={() => setCategoryPage(0)}
                                variant='tertiary'
                                smaller
                                smallIcon
                                value='Limpar filtro'>
                                <IconifyIcon icon='ic:baseline-clear' />
                            </GeralButton>
                        </div>
                    )}

                    <ul className={styles.contentArea}>
                        {searchPage ? (
                            <>
                                {filteredData.length > 0 ? (
                                    <li>
                                        <SwiperComponent
                                            title='Resultado da pesquisa'
                                            listContents={filteredData}
                                            loading={isLoading}
                                            mutate={mutate}
                                        />
                                    </li>
                                ) : (
                                    <span className='result-text'>Nenhum resultado encontrado</span>
                                )}
                            </>
                        ) : (
                            <>
                                {categoryPage == 0 && data.courses.length > 0 && (
                                    <li>
                                        <SwiperComponent
                                            title='Cursos'
                                            listCourses={data.courses}
                                            loading={isLoading}
                                            mutate={mutate}
                                        />
                                    </li>
                                )}

                                {categoryPage == 0 &&
                                    data.keep_watching.length > 0 &&
                                    data.keep_watching[0].is_available == 1 && (
                                        <li>
                                            <SwiperComponent
                                                title='Continuar assistindo'
                                                listContents={data.keep_watching}
                                                loading={isLoading}
                                                mutate={mutate}
                                                showTimer
                                            />
                                        </li>
                                    )}

                                {categoryPage == 0 && data.saved_contents.length > 0 && (
                                    <li>
                                        <SwiperComponent
                                            title='Minha Lista'
                                            listContents={data.saved_contents}
                                            loading={isLoading}
                                            mutate={mutate}
                                        />
                                    </li>
                                )}

                                {categoryPage == 0 && data.most_viewed.length > 0 && (
                                    <li>
                                        <SwiperComponent
                                            title='Mais assistidos'
                                            listContents={data.most_viewed}
                                            loading={isLoading}
                                            mutate={mutate}
                                            showNumber
                                        />
                                    </li>
                                )}

                                {contentType == 2 && categoryPage == 0 && data.newest.length > 0 && (
                                    <li>
                                        <SwiperComponent
                                            title='Novidades'
                                            listContents={data.newest}
                                            loading={isLoading}
                                            mutate={mutate}
                                        />
                                    </li>
                                )}

                                {categoryPage == 0 ? (
                                    <>
                                        {categoryList.length > 0 &&
                                            categoryList.map(([categoryName, contents], index) => (
                                                <li key={`${categoryName}-${index}`}>
                                                    {contents.length > 0 && (
                                                        <SwiperComponent
                                                            title={categoryName}
                                                            listContents={contents}
                                                            loading={isLoading}
                                                            mutate={mutate}
                                                        />
                                                    )}
                                                </li>
                                            ))}
                                    </>
                                ) : (
                                    <>
                                        {categoryList.length > 0 &&
                                            categoryList.map(([categoryName, contents], index) => {
                                                // checando se o categoryName é igual ao filtrado
                                                return categoryName ==
                                                    data.content_categories.find((cat) => cat.id == categoryPage)
                                                        ?.name ? (
                                                    <li key={`${categoryName}-${index}`}>
                                                        <SwiperComponent
                                                            title={categoryName}
                                                            listContents={contents}
                                                            loading={isLoading}
                                                            mutate={mutate}
                                                        />
                                                    </li>
                                                ) : (
                                                    <></>
                                                )
                                            })}
                                    </>
                                )}
                            </>
                        )}
                    </ul>
                </Reveal>

                <GeralModal
                    title='Excluir conteúdo'
                    deleteName={' esse conteúdo?'}
                    deleteFunction={deleteContent}
                    show={deleteModal}
                    setShow={setDeleteModal}
                    loading={loading}
                    small
                    isDelete
                />

                {openFormModal && (
                    <FormModal
                        edit={!!(oldForm.id && oldForm.name)}
                        oldForm={oldForm}
                        openModal={openFormModal}
                        setOpenModal={setOpenFormModal}
                    />
                )}

                {openDeleteModal && (
                    <GeralModal
                        title='Excluir categoria'
                        deleteName={` a categoria ${oldForm.name}?`}
                        deleteFunction={deleteCategory}
                        show={openDeleteModal}
                        setShow={setOpenDeleteModal}
                        loading={loading}
                        isDelete
                        small
                    />
                )}

                <GeralModal title='Ordem de exibição' show={openOrganizeModal} setShow={setOpenOrganizeModal}>
                    <SortableList onSortEnd={onSortEnd} className={styles.categoryList} draggedItemClassName='dragged'>
                        {sortCategories &&
                            sortCategories.map((category) => (
                                <SortableItem key={category.id}>
                                    <div className={styles.categoryItem}>
                                        <IconifyIcon icon='solar:hamburger-menu-linear' />
                                        {category.name}
                                    </div>
                                </SortableItem>
                            ))}
                    </SortableList>
                </GeralModal>
            </ErrorBoundary>
        </div>
    )
}
