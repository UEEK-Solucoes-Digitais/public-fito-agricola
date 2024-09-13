import type ContentProps from '@/@types/Content'
import ContentCategoryProps from '@/@types/ContentCategory'
import PlaybackBar from '@/components/playback-bar'
import { Numbers } from '@/components/svg'
import { useAdmin } from '@/context/AdminContext'
import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'nextjs-toploader/app'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { KeyedMutator } from 'swr'
import FloatBoxPortal from './float-box'
import styles from './styles.module.scss'

interface IProps {
    content: ContentProps
    className?: string
    setActiveCard: Dispatch<SetStateAction<number | null>>
    activeCard: number | null
    showTimer?: boolean
    showNumber?: number
    mutate: KeyedMutator<{
        contents: ContentProps[]
        newest: ContentProps[]
        courses: ContentProps[]
        saved_contents: ContentProps[]
        keep_watching: ContentProps[]
        most_viewed: ContentProps[]
        all_contents: ContentProps[]
        content_categories: ContentCategoryProps[]
        access_enabled: boolean
    }>
}

export default function CardContent({
    content,
    className,
    setActiveCard,
    activeCard,
    showTimer,
    showNumber,
    mutate,
}: IProps) {
    const { admin } = useAdmin()
    const router = useRouter()
    const cardRef = useRef<HTMLDivElement>(null)
    const cardFloatRef = useRef<HTMLDivElement>(null)

    const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const mouseOverCard = useRef(false)
    const [needUpdate, setNeedUpdate] = useState(false)
    const notAvailable = content.is_available == 0

    function handleOpen() {
        if (notAvailable) return

        if (activeCard == content.id) {
            return
        }

        return router.push(`/dashboard/conteudo/${admin.id}/${content.url}`)
    }

    function handleMouseLeave() {
        if (notAvailable) return
        mouseOverCard.current = false
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setActiveCard(null)
        setPosition(null)

        if (needUpdate) {
            mutate()
        }
    }

    function handleDocumentClick(event: MouseEvent) {
        if (notAvailable) return
        if (
            cardRef.current &&
            cardFloatRef.current &&
            !cardRef.current.contains(event.target as Node) &&
            !cardFloatRef.current.contains(event.target as Node)
        ) {
            handleMouseLeave()
        }
    }

    useEffect(() => {
        const cardElement = cardRef.current

        function handleMouseEnter() {
            mouseOverCard.current = true

            if (cardElement && !cardElement.classList.contains('swiper-hidden')) {
                if (timerRef.current) {
                    clearTimeout(timerRef.current)
                }

                timerRef.current = setTimeout(() => {
                    if (mouseOverCard.current && cardElement.matches(':hover')) {
                        const rect = cardElement.getBoundingClientRect()
                        const floatBoxWidth = 440
                        const floatBoxHeight = 370
                        const floatBoxHeightReference = 430

                        let top = 0
                        const topPosition = rect.top - (floatBoxHeight - rect.height) / 2

                        if (window.innerHeight - topPosition <= floatBoxHeightReference) {
                            top = window.innerHeight - floatBoxHeightReference
                        } else if (topPosition <= 110) {
                            top = 110
                        } else {
                            top = rect.top - (floatBoxHeight - rect.height) / 2
                        }

                        setPosition({
                            top,
                            left: rect.left + window.scrollX - (floatBoxWidth - rect.width) / 2,
                        })

                        setActiveCard(content.id)

                        cardElement.removeEventListener('mouseleave', handleMouseOut)
                    }
                }, 500)
            }
        }

        function handleMouseOut(event: MouseEvent) {
            if (!cardElement?.contains(event.relatedTarget as Node)) {
                handleMouseLeave()
            }
        }

        cardElement?.addEventListener('mouseenter', handleMouseEnter)
        cardElement?.addEventListener('mouseleave', handleMouseOut as EventListener)

        document.addEventListener('click', handleDocumentClick as EventListener)
        document.addEventListener('scroll', handleMouseOut as EventListener)

        return () => {
            cardElement?.removeEventListener('mouseenter', handleMouseEnter)
            cardElement?.removeEventListener('mouseleave', handleMouseOut as EventListener)

            document.removeEventListener('click', handleDocumentClick as EventListener)
            document.removeEventListener('scroll', handleMouseLeave as EventListener)

            handleMouseLeave()
        }
    }, [content])

    useEffect(() => {
        window.addEventListener('scroll', handleMouseLeave)

        return () => {
            window.removeEventListener('scroll', handleMouseLeave)
        }
    }, [])

    const isShowNumber = !!(showNumber && showNumber > 0)

    const getImage = (image: any) => {
        if (image != null && image != '') {
            return `${image}`
        } else {
            if (content.image != null && content.image != '') {
                return `${content.image}`
            } else if (content.most_watched_cover != null && content.most_watched_cover != '') {
                return `${content.most_watched_cover}`
            } else if (content.course_cover != null && content.course_cover != '') {
                return `${content.course_cover}`
            }
        }
    }

    return (
        <div
            ref={cardRef}
            className={clsx(styles.card, showNumber && styles.withNumber, className, notAvailable && styles.blur)}
            onClick={handleOpen}>
            {isShowNumber && showNumber && <div className={styles.number}>{Numbers[showNumber - 1].component}</div>}

            <div className={styles.image}>
                <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${showNumber ? getImage(content.most_watched_cover) : getImage(content.image)}`}
                    alt={`Image do post ${content.title}`}
                    loading='lazy'
                    fill
                />
            </div>

            {activeCard == content.id && position && (
                <FloatBoxPortal
                    ref={cardFloatRef}
                    content={content}
                    position={position}
                    onMouseLeave={handleMouseLeave}
                    state={{ needUpdate, setNeedUpdate }}
                />
            )}

            {showTimer && (
                <div className={styles.timer}>
                    <PlaybackBar
                        currentTime={content.watched_seconds}
                        durationTime={content.video_seconds}
                        countFinished={content.count_finished_user}
                        countVideos={content.count_videos}
                    />
                </div>
            )}
        </div>
    )
}
