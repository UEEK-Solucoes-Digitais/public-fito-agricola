import type ContentProps from '@/@types/Content'
import { useAdmin } from '@/context/AdminContext'
import { useNotification } from '@/context/ToastContext'
import axios from 'axios'
import Image from 'next/image'
import { ChangeEvent, RefObject, useState } from 'react'
import { KeyedMutator } from 'swr'
import userProfile from '../../../public/images/default-profile.jpg'
import GeralButton from '../buttons/GeralButton'
import { Fade } from '../reveal/reveal'

import ContentCategoryProps from '@/@types/ContentCategory'
import styles from './styles.module.scss'

interface IProps {
    contentId: number
    answerId?: number
    mutate: KeyedMutator<{
        content: ContentProps
        content_categories: ContentCategoryProps[]
    }>
    commentRef: RefObject<HTMLDivElement>
    onSubmit?: () => void
    editElement?: {
        id: number
        text: string
    }
}

export default function Field({ contentId, answerId, mutate, commentRef, onSubmit, editElement }: IProps) {
    const { admin } = useAdmin()
    const { setToast } = useNotification()

    const [loading, setLoading] = useState(false)
    const [text, setText] = useState(editElement?.text ?? '')

    function onChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setText(event.target.value)
    }

    async function handleSubmit() {
        if (!text || loading) return

        setLoading(true)

        const formData = new FormData()
        formData.append('admin_id', admin.id.toString())
        formData.append('content_id', contentId.toString())
        formData.append('text', text)

        if (editElement?.id) {
            formData.append('id', editElement.id.toString())
        }

        if (answerId) {
            formData.append('answer_id', answerId.toString())
        }

        try {
            const response = await axios.post('/api/contents/form-comment', formData)

            if (response.status == 200) {
                setText('')
                mutate()

                if (onSubmit) {
                    onSubmit()
                }

                if (commentRef?.current && typeof window !== 'undefined') {
                    commentRef.current.scrollIntoView({ behavior: 'smooth' })
                }
            } else {
                setToast({ text: 'Não foi possível completar a operação no momento', state: 'danger' })
            }
        } catch (error: any) {
            const message = error?.response?.data?.msg ?? 'Não foi possível completar a operação no momento'
            setToast({
                text: message,
                state: 'danger',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Fade duration={800} fraction={0.35} triggerOnce>
            <div className={styles.fieldContainer}>
                {!editElement && (
                    <div className={styles.picture}>
                        <Image
                            src={
                                admin.profile_picture
                                    ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/admins/${admin.profile_picture}`
                                    : userProfile
                            }
                            height={48}
                            width={48}
                            alt={`Foto de perfil de ${admin.name}`}
                            loading='lazy'
                        />
                    </div>
                )}

                <div className={styles.input}>
                    <textarea
                        name='comment'
                        id='comment'
                        placeholder='Escrever um comentário'
                        value={text}
                        onChange={onChange}
                        disabled={loading}
                    />
                </div>

                <div className={styles.action}>
                    <GeralButton
                        variant='secondary'
                        value={editElement ? 'Salvar' : 'Publicar'}
                        onClick={handleSubmit}
                        loading={loading}
                    />
                </div>
            </div>
        </Fade>
    )
}
