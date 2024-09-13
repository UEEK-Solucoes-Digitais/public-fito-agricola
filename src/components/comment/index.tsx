import type ContentProps from '@/@types/Content'
import ContentCategoryProps from '@/@types/ContentCategory'
import type IContentComment from '@/@types/ContentComment'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import { formatDate, formatDateFully } from '@/utils/conversions'
import axios from 'axios'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Suspense, useRef, useState } from 'react'
import type { KeyedMutator } from 'swr'
import userProfile from '../../../public/images/default-profile.jpg'
import IconifyIcon from '../iconify/IconifyIcon'
import { Fade } from '../reveal/reveal'
import { HeartIcon } from '../svg'
import Field from './field'
import styles from './styles.module.scss'

const GeralModal = dynamic(() => import('../modal/GeralModal'), {
    ssr: false,
})

interface IProps {
    contentId: number
    comment: IContentComment
    mutate: KeyedMutator<{
        content: ContentProps
        content_categories: ContentCategoryProps[]
    }>
}

export default function Comment({ contentId, comment, mutate }: IProps) {
    const { admin: adminInstance } = useAdmin()
    const { setToast } = useNotification()
    const commentRef = useRef<HTMLDivElement>(null)

    const [hasResponse, setHasResponse] = useState(false)
    const [edit, setEdit] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)

    const yourself = adminInstance.id == comment.admin_id
    const admin = yourself ? adminInstance : comment.admin

    function handleLike() {
        const formData = new FormData()
        formData.append('admin_id', adminInstance.id.toString())
        formData.append('content_comment_id', comment.id.toString())

        axios
            .post('/api/contents/like-comment', formData)
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

    function handleDelete() {
        if (!deleteModal) {
            setToast({ text: 'Não foi possível completar a operação no momento', state: 'danger' })
            return
        }

        const formData = new FormData()
        formData.append('id', comment.id.toString())
        formData.append('admin_id', adminInstance.id.toString())

        axios
            .post('/api/contents/remove-comment', formData)
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

    const handleResponse = () => setHasResponse((state) => !state)
    const closeResponse = () => setHasResponse(false)
    const handleEdit = () => setEdit((state) => !state)
    const closeEdit = () => setEdit(false)
    const handleDeleteModal = () => setDeleteModal((state) => !state)

    return (
        <>
            <Fade duration={800} fraction={0.25} triggerOnce>
                <div ref={commentRef} className={clsx(styles.wrapper, edit && styles.editMode)}>
                    <div className={styles.content}>
                        <div className={clsx(styles.like, comment.is_liked == 1 && styles.liked)}>
                            <button type='button' onClick={handleLike}>
                                <HeartIcon />
                            </button>

                            <p>{comment.likes_count}</p>
                        </div>

                        <div className={styles.body}>
                            <div className={styles.header}>
                                <div className={styles.info}>
                                    <div className={styles.picture}>
                                        <Image
                                            src={
                                                admin.profile_picture
                                                    ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/admins/${admin.profile_picture}`
                                                    : userProfile
                                            }
                                            height={38}
                                            width={38}
                                            alt={`Foto de perfil de ${admin.name}`}
                                            loading='lazy'
                                        />
                                    </div>

                                    <span className={styles.name} title={admin.name}>
                                        {yourself ? 'Você' : admin.name}
                                    </span>
                                    <span className={styles.date} title={formatDateFully(comment.created_at)}>
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>

                                {yourself ? (
                                    <div className={styles.actions}>
                                        {!edit && (
                                            <button
                                                className={clsx(styles.reply, styles.cancel)}
                                                type='button'
                                                onClick={handleDeleteModal}>
                                                <IconifyIcon icon='mdi:trash' />

                                                <span>Excluir</span>
                                            </button>
                                        )}

                                        <button
                                            className={clsx(styles.reply, edit && styles.cancel)}
                                            type='button'
                                            onClick={handleEdit}>
                                            <IconifyIcon icon={edit ? 'material-symbols:cancel' : 'mage:pen-fill'} />

                                            <span>{edit ? 'Cancelar' : 'Editar'}</span>
                                        </button>
                                    </div>
                                ) : (
                                    !comment.answer_id && (
                                        <button
                                            className={clsx(styles.reply, hasResponse && styles.cancel)}
                                            type='button'
                                            onClick={handleResponse}>
                                            <IconifyIcon
                                                icon={hasResponse ? 'material-symbols:cancel' : 'fa-solid:reply'}
                                            />

                                            <span>{hasResponse ? 'Cancelar' : 'Responder'}</span>
                                        </button>
                                    )
                                )}
                            </div>

                            <div className={styles.textContainer}>
                                {edit ? (
                                    <Fade duration={800} triggerOnce>
                                        <div className={styles.responseContainer}>
                                            <Field
                                                contentId={contentId}
                                                answerId={comment.answer_id}
                                                mutate={mutate}
                                                commentRef={commentRef}
                                                onSubmit={closeEdit}
                                                editElement={{
                                                    id: comment.id,
                                                    text: comment.text,
                                                }}
                                            />
                                        </div>
                                    </Fade>
                                ) : (
                                    <p className={styles.text}>{comment.text}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {hasResponse && (
                        <Fade duration={800} triggerOnce>
                            <div className={styles.responseContainer}>
                                <Field
                                    contentId={contentId}
                                    answerId={comment.id}
                                    mutate={mutate}
                                    commentRef={commentRef}
                                    onSubmit={closeResponse}
                                />
                            </div>
                        </Fade>
                    )}
                </div>
            </Fade>

            {deleteModal && (
                <Suspense fallback={null}>
                    <GeralModal
                        small
                        isDelete
                        deleteName='seu comentário'
                        deleteFunction={handleDelete}
                        show
                        setShow={setDeleteModal}
                        title='Excluir comentário'
                    />
                </Suspense>
            )}
        </>
    )
}
