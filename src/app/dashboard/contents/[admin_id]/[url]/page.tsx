'use client'

import ContentProps from '@/@types/Content'
import ContentCategoryProps from '@/@types/ContentCategory'
import ContentVideo from '@/@types/ContentVideo'
import { CategoryIcon } from '@/assets/icons/Icons'
import GeralButton from '@/components/buttons/GeralButton'
import Fancybox from '@/components/fancybox/Fancybox'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import ElementSkeleton from '@/components/loading/ElementSkeleton'
import GeralModal from '@/components/modal/GeralModal'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import ErrorBoundary from '@/document/ErrorBoundary'
import { formatDateToDDMMYYYY } from '@/utils/formats'
import getFetch from '@/utils/getFetch'
import updateStatus from '@/utils/updateStatus'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import { useCallback, useEffect, useState } from 'react'
import 'swiper/css'
import 'swiper/css/free-mode'
import { Swiper, SwiperSlide } from 'swiper/react'
import useSWR from 'swr'
import styles from './styles.module.scss'

const YouTubePlayer = dynamic(() => import('@/components/youtube'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

const Comments = dynamic(() => import('./(components)/comments'), {
    ssr: false,
    loading: () => <ElementSkeleton />,
})

export default function Page({ params }: { params: { admin_id: number; url: string } }) {
    const { setToast } = useNotification()
    const { admin } = useAdmin()
    const router = useRouter()

    const [actionMade, setActionMade] = useState(false)

    const { data, isLoading, mutate } = useSWR<{
        content: ContentProps
        content_categories: ContentCategoryProps[]
    }>(`/api/contents/read/${params.admin_id}/${params.url}`, getFetch)

    const [isWatchingVideo, setIsWatchingVideo] = useState(false)
    const [currentVideo, setCurrentVideo] = useState<null | ContentVideo>(null)

    const [deleteId, setDeleteId] = useState(0)
    const [deleteModal, setDeleteModal] = useState(false)
    const [loading, setLoading] = useState(false)

    function handleDeleteModal(id: number) {
        setDeleteId(id)
        setDeleteModal(true)
    }

    async function deleteContent() {
        try {
            if (deleteId == 0) {
                setToast({ text: `Ocorreu um problema, feche esse modal e repita o processo`, state: 'loading' })
                return
            }

            if (!loading) {
                setLoading(true)
                setToast({ text: `Excluindo conteúdo`, state: 'loading' })

                await updateStatus('/api/contents/delete', params.admin_id, deleteId, 0).then(() => {
                    setDeleteModal(false)
                    setToast({ text: `Conteúdo excluido`, state: 'success' })

                    router.push(content?.content_type == 1 ? '/dashboard/conteudos' : '/dashboard/conteudos-ma')
                })
            }
        } catch (error: any) {
            const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
            setToast({ text: message, state: 'danger' })
        } finally {
            setLoading(false)
        }
    }

    const getCategoriesNames = () => {
        const categories = contentCategories.filter((category) =>
            content.categories_ids.includes(category.id.toString()),
        )

        return categories.map((category) => category.name).join(', ')
    }

    const handleActionButton = async (action: string) => {
        const formData = new FormData()
        formData.append('admin_id', admin.id.toString())
        formData.append('content_id', content.id.toString())
        formData.append('interaction', action)

        axios
            .post('/api/contents/save-interaction', formData)
            .then((res) => {
                if (res.status == 200) {
                    mutate()
                } else {
                    setToast({ text: 'Não foi possível completar a operação no momento', state: 'danger' })
                }
            })
            .catch((error) => {
                const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
                setToast({
                    text: message,
                    state: 'danger',
                })
            })
    }

    const getThumb = function (url: string) {
        if (url == null) {
            return ''
        }

        let results
        let video

        if (url.includes('live') || url.includes('shorts')) {
            video = url.split('/').pop()?.split('?')[0]
        } else {
            results = url.match('[\\?&]v=([^&#]*)')
            video = results == null ? url.split('/').pop()?.split('?')[0] : results[1]
        }

        return 'http://img.youtube.com/vi/' + video + '/0.jpg'
    }

    const handleVideoSelect = (video: ContentVideo) => {
        setIsWatchingVideo(true)
        setCurrentVideo(video)
    }

    useEffect(() => {
        const content = data?.content

        if (content) {
            if (!actionMade) {
                if (content.videos.length == 1) {
                    setIsWatchingVideo(true)
                    setCurrentVideo(content.videos[0])
                } else if (content.videos.length > 1 && content.current_video) {
                    setIsWatchingVideo(true)

                    const video = content.videos.find((video: any) => video.id == content.current_video)

                    if (video) {
                        handleVideoSelect(video)

                        setActionMade(true)
                    }
                }
            }
        }
    }, [data])

    useEffect(() => {
        if (!deleteModal) {
            setDeleteId(0)
        }
    }, [deleteModal])

    const VideoList = useCallback(() => {
        const content = data?.content

        return (
            <div className={styles.videoList}>
                {content &&
                    content.videos.map((video: any) => (
                        <div
                            className={`${styles.videoItemList} ${!video.description ? styles.alignCenter : ''}`}
                            key={`video-${video.id}`}>
                            <div className={styles.image} onClick={() => handleVideoSelect(video)}>
                                <Image src={getThumb(video.video_link)} alt='Thumbnail' loading='lazy' fill />
                                <IconifyIcon icon='ph:play-fill' />
                            </div>

                            <div className={` ${!video.description ? styles.fitContent : ''} ${styles.infos}`}>
                                <h3>{video.title}</h3>
                                <p>{video.description}</p>

                                <div className={styles.actions}>
                                    <GeralButton
                                        type='button'
                                        variant='secondary'
                                        value='Assistir'
                                        small
                                        onClick={() => handleVideoSelect(video)}>
                                        <IconifyIcon icon='ph:play-circle' />
                                    </GeralButton>

                                    <p>
                                        {`${video.watched_seconds !== '' ? `${video.watched_seconds}/` : ''}`}
                                        {video.duration_time}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        )
    }, [data])

    if (isLoading || !data) {
        return <ElementSkeleton />
    }

    const content = data.content
    const contentCategories = data.content_categories

    if (content.is_course == 1 && content.is_available == 0) {
        return redirect('/dashboard/conteudos')
    }

    return (
        <>
            <Link href={`/dashboard/conteudos${content?.content_type == 1 ? '' : '-ma'}`} className={styles.backBtn}>
                <IconifyIcon icon='ph:arrow-left' />
                Conteúdos
            </Link>

            <div className={styles.boxContent}>
                <div className={styles.contentPadding}>
                    <div className={styles.flexWithActions}>
                        <h1>
                            {content?.title}
                            {isWatchingVideo && currentVideo?.title ? ` - ${currentVideo?.title}` : ''}
                        </h1>

                        <div className={styles.buttons}>
                            <button
                                title='Minha lista'
                                className={`${styles.buttonContentAction} ${styles.likeButton} ${content.is_liked == 1 ? styles.active : ''}`}
                                onClick={() => handleActionButton('is_liked')}>
                                <IconifyIcon
                                    icon={content.is_liked == 0 ? 'ph:heart-straight' : 'ph:heart-straight-fill'}
                                />
                            </button>

                            <button
                                title='Minha lista'
                                className={`${styles.buttonContentAction} ${styles.listButton} ${content.is_saved == 1 ? styles.active : ''}`}
                                onClick={() => handleActionButton('is_saved')}>
                                {content.is_saved == 0 ? (
                                    <>
                                        <IconifyIcon icon='ph:plus-circle' />
                                        Minha lista
                                    </>
                                ) : (
                                    <>
                                        <IconifyIcon icon='ph:x-circle' />
                                        Remover da minha lista
                                    </>
                                )}
                            </button>

                            {admin.access_level == 1 && (
                                <>
                                    <div className={styles.actionButtons}>
                                        <Link
                                            className={styles.button}
                                            href={`/dashboard/conteudos/editar${content?.content_type == 1 ? '' : '-ma'}/${content.url}`}
                                            title='Editar'>
                                            <IconifyIcon icon='ph:pencil-simple' />
                                        </Link>

                                        <button
                                            className={styles.button}
                                            title='Excluir'
                                            onClick={() => {
                                                handleDeleteModal(content.id)
                                            }}>
                                            <IconifyIcon icon='ph:trash' />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={styles.information}>
                        <div className={styles.item}>
                            <IconifyIcon icon='ph:user' />
                            <p title={content.admin?.name ?? '...'} aria-label={content.admin?.name ?? '...'}>
                                {content.admin?.name ?? '...'}
                            </p>
                        </div>

                        <div className={styles.item}>
                            <IconifyIcon icon='solar:calendar-outline' />
                            <p
                                title={content.date ? formatDateToDDMMYYYY(content.date) : '...'}
                                aria-label={content.date ? formatDateToDDMMYYYY(content.date) : '...'}>
                                {content.date ? formatDateToDDMMYYYY(content.date) : '...'}
                            </p>
                        </div>

                        <div className={styles.item}>
                            <CategoryIcon />

                            <p title={getCategoriesNames()} aria-label={getCategoriesNames()}>
                                {getCategoriesNames()}
                            </p>
                        </div>
                    </div>
                    <div className={styles.block}>
                        <p>{content.text}</p>
                    </div>

                    {isWatchingVideo ? (
                        <div className={styles.videoDiv}>
                            {content.videos.length > 1 && (
                                <GeralButton
                                    type='button'
                                    variant='tertiary'
                                    value='Lista de reprodução'
                                    smaller
                                    smallIcon
                                    onClick={() => {
                                        mutate()
                                        setIsWatchingVideo(false)
                                        setCurrentVideo(null)
                                    }}>
                                    <IconifyIcon icon='ph:caret-left' />
                                </GeralButton>
                            )}
                            <YouTubePlayer
                                video={currentVideo!}
                                videos={content.videos}
                                handleVideoSelect={handleVideoSelect}
                            />
                        </div>
                    ) : (
                        content.videos?.length > 0 && <VideoList />
                    )}

                    {content.blocks?.map((block: any, index: number) =>
                        block.type !== 3 ? (
                            <div key={index} className={styles.block}>
                                {block.type == 1 || block.type == 5 ? <p>{block.content}</p> : <></>}
                            </div>
                        ) : (
                            <div key={index} className={`${styles.block} ${styles.swiperBlock}`}>
                                <Fancybox>
                                    <Swiper
                                        spaceBetween={20}
                                        breakpoints={{
                                            0: {
                                                slidesPerView: 1.3,
                                            },
                                            1200: {
                                                slidesPerView: 2.3,
                                            },
                                        }}>
                                        {block.images.map((image: any, index: number) => (
                                            <SwiperSlide key={index}>
                                                <div
                                                    data-fancybox={`galeria-topico-${block.id}`}
                                                    data-src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${image.image}`}
                                                    className={styles.swiperImage}>
                                                    <Image
                                                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${image.image}`}
                                                        alt={image.title}
                                                        loading='lazy'
                                                        fill
                                                    />
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </Fancybox>
                            </div>
                        ),
                    )}
                </div>
            </div>

            <ErrorBoundary fallbackComponent={<strong className='error-strong'>Erro ao carregar comentários</strong>}>
                <Comments contentId={content.id} list={content.comments} mutate={mutate} />
            </ErrorBoundary>

            <GeralModal
                title='Excluir conteúdo'
                deleteName={' esse conteúdo?'}
                deleteFunction={deleteContent}
                show={deleteModal}
                setShow={setDeleteModal}
                small
                isDelete
            />
        </>
    )
}
