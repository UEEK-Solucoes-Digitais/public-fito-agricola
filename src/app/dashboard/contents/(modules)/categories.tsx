import ContentCategoryProps from '@/@types/ContentCategory'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import getFetch from '@/utils/getFetch'
import WriteLog from '@/utils/logger'
import { Dispatch, MouseEvent, SetStateAction, useEffect } from 'react'
import 'swiper/css'
import 'swiper/css/free-mode'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import useSWR from 'swr'
import styles from './categories.module.scss'

interface FormProps {
    id?: number
    name: string
    admin_id?: number
}

interface IProps {
    openFormModal: boolean
    setOpenFormModal: Dispatch<SetStateAction<boolean>>
    openDeleteModal: boolean
    setOpenDeleteModal: Dispatch<SetStateAction<boolean>>
    oldForm: FormProps
    setOldForm: Dispatch<SetStateAction<FormProps>>
}

export default function Categories({
    openFormModal,
    setOpenFormModal,
    openDeleteModal,
    setOpenDeleteModal,
    oldForm,
    setOldForm,
}: IProps) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const { data, isLoading, error } = useSWR(`/api/contents/categories/list`, getFetch)

    function handleEditCategory(event: MouseEvent<HTMLDivElement>, id: number, name: string) {
        event.stopPropagation()

        setOldForm({
            id,
            name,
        })

        setOpenFormModal(true)
    }

    function handleDeleteCategory(event: MouseEvent<HTMLDivElement>, id: number, name: string) {
        event.stopPropagation()

        setOldForm({
            id,
            name,
            admin_id: admin.id,
        })

        setOpenDeleteModal(true)
    }

    function handleModal() {
        setOpenFormModal((state) => !state)
    }

    useEffect(() => {
        if (!openFormModal) {
            setOldForm({
                id: 0,
                name: '',
            })
        }
    }, [openFormModal])

    useEffect(() => {
        if (typeof error !== 'undefined') {
            WriteLog(error, 'error')

            if (process.env.NEXT_PUBLIC_SHOW_TOAST_FETCH_ERROR == 'true') {
                setToast({ text: `Falha ao obter dados de categorias`, state: 'danger' })
            }
        }
    }, [error])

    if (isLoading) {
        return <ElementSkeleton />
    }

    return (
        <div className={styles.categoryWrapper}>
            <ErrorBoundary
                fallbackComponent={<strong className='error-strong'>Erro crítico ao carregar categorias</strong>}>
                <Swiper
                    slidesPerView={'auto'}
                    spaceBetween={10}
                    modules={[Navigation]}
                    navigation={{
                        nextEl: styles.swiperNavPrev,
                        prevEl: styles.swiperNavNext,
                    }}>
                    {admin.access_level == 1 && (
                        <SwiperSlide key={`content-category-add`}>
                            <button
                                className={`${styles.categoryItem} ${styles.addCategory}`}
                                type='button'
                                title='Adicionar categoria'
                                aria-label='Adicionar categoria'
                                onClick={handleModal}>
                                +
                            </button>
                        </SwiperSlide>
                    )}

                    {/* <SwiperSlide key={`content-category-all`}>
                        <button
                            className={`${styles.categoryItem} `}
                            type='button'
                            title='Todas as categorias'
                            aria-label='Todas as categorias'
                            // onClick={() => handleChangeCategory(0)}
                            >
                            Todas as categorias
                        </button>
                    </SwiperSlide> */}

                    {data?.categories?.length > 0 &&
                        data.categories.map((category: ContentCategoryProps) => (
                            <SwiperSlide key={`content-category-${category.id}`}>
                                <button
                                    className={`${styles.categoryItem} `}
                                    type='button'
                                    title={` ${category.name}`}
                                    aria-label={category.name}
                                    // onClick={() => handleChangeCategory(category.id)}
                                >
                                    {category.name}

                                    {admin.access_level == 1 && (
                                        <>
                                            <div
                                                className={`${styles.dynamicCategory} ${styles.deleteCategory}`}
                                                title='Excluir categoria'
                                                aria-label='Excluir categoria'
                                                onClick={(event) =>
                                                    handleDeleteCategory(event, category.id, category.name)
                                                }>
                                                <IconifyIcon icon='ph:trash' />
                                            </div>

                                            <div
                                                className={`${styles.dynamicCategory} ${styles.editCategory}`}
                                                title='Editar categoria'
                                                aria-label='Editar categoria'
                                                onClick={(event) =>
                                                    handleEditCategory(event, category.id, category.name)
                                                }>
                                                <IconifyIcon icon='ph:pencil-simple' />
                                            </div>
                                        </>
                                    )}
                                </button>
                            </SwiperSlide>
                        ))}
                </Swiper>
            </ErrorBoundary>
        </div>
    )
}
