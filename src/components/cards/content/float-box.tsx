import type ContentProps from '@/@types/Content'
import IconifyIcon from '@/components/iconify/IconifyIcon'
import PlaybackBar from '@/components/playback-bar'
import { HeartIcon, PlayIcon, PlusIcon } from '@/components/svg'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import axios from 'axios'
import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'nextjs-toploader/app'
import { Dispatch, forwardRef, SetStateAction, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './styles.module.scss'

interface FloatBoxProps {
    content: ContentProps
    position: { top: number; left: number }
    onMouseLeave: () => void
    state: {
        needUpdate: boolean
        setNeedUpdate: Dispatch<SetStateAction<boolean>>
    }
}

const FloatBoxPortal = forwardRef<HTMLDivElement, FloatBoxProps>(({ content, position, onMouseLeave, state }, ref) => {
    const router = useRouter()
    const { admin } = useAdmin()
    const { setToast } = useNotification()

    const [visible, setVisible] = useState(true)
    const [hideInfo, setHideInfo] = useState(true)
    const [localContent, setLocalContent] = useState(content)

    useEffect(() => {
        setVisible(true)
        return () => setVisible(false)
    }, [])

    function close() {
        setVisible(false)
        setTimeout(onMouseLeave, 400)
    }

    function handleOpen() {
        if (!visible) {
            return
        }

        return router.push(`/dashboard/conteudo/${admin.id}/${content.url}`)
    }

    function handleHideInfo() {
        setHideInfo((state) => !state)
    }

    function requestForm(key: string) {
        const formData = new FormData()
        formData.append('admin_id', admin.id.toString())
        formData.append('content_id', content.id.toString())
        formData.append('interaction', key)

        axios
            .post('/api/contents/save-interaction', formData)
            .then((res) => {
                if (res.status == 200) {
                    setLocalContent({
                        ...localContent,
                        [key]: Number(res.data.interaction[key]),
                    })

                    if (!state.needUpdate) {
                        state.setNeedUpdate(true)
                    }
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

    const handleLike = () => requestForm('is_liked')
    const handleSave = () => requestForm('is_saved')

    const isMoreText = !hideInfo && localContent.text

    return createPortal(
        <div
            ref={ref}
            className={clsx(styles.floatBox, {
                [styles.visible]: visible,
                [styles.hidden]: !visible,
                [styles.is_course]: localContent.is_course == 1,
            })}
            style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
            onMouseLeave={close}>
            <div
                className={clsx(styles.image, {
                    [styles.is_course]: localContent.is_course == 1,
                })}
                onClick={handleOpen}>
                <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${localContent.image}`}
                    alt={`Image do post ${localContent.title}`}
                    loading='lazy'
                    fill
                />
            </div>

            <div className={styles.body}>
                <div className={styles.actions}>
                    <div className={styles.group}>
                        <button
                            className={clsx(styles.button, styles.play)}
                            type='button'
                            title='Abrir'
                            onClick={handleOpen}>
                            <PlayIcon />
                        </button>

                        <button
                            className={clsx(styles.button, styles.is_saved, localContent.is_saved && styles.active)}
                            type='button'
                            title='Favoritar'
                            onClick={handleSave}>
                            <PlusIcon />
                        </button>

                        <button
                            className={clsx(styles.button, styles.is_liked, localContent.is_liked && styles.active)}
                            type='button'
                            title='Gostei'
                            onClick={handleLike}>
                            <HeartIcon />
                        </button>
                    </div>

                    {isMoreText && (
                        <button
                            className={clsx(styles.button, hideInfo && styles.hideInfo)}
                            type='button'
                            title={hideInfo ? 'Esconder' : 'Mostrar'}
                            onClick={handleHideInfo}>
                            <IconifyIcon icon='iconoir:nav-arrow-down' />
                        </button>
                    )}
                </div>

                <div className={styles.information}>
                    <span className={styles.title} title={localContent.title}>
                        {localContent.title}
                    </span>

                    {isMoreText && (
                        <p className={styles.text} title={localContent.text}>
                            {localContent.text}
                        </p>
                    )}
                </div>

                <PlaybackBar
                    currentTime={localContent.watched_seconds}
                    durationTime={localContent.video_seconds}
                    countFinished={content.count_finished_user}
                    countVideos={content.count_videos}
                />
            </div>
        </div>,
        document.body,
    )
})

FloatBoxPortal.displayName = 'Float'

export default FloatBoxPortal
