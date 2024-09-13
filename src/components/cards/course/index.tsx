import type ContentProps from '@/@types/Content'
import { useAdmin } from '@/context/AdminContext'
import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'nextjs-toploader/app'
import { useRef } from 'react'
import styles from './styles.module.scss'

interface IProps {
    content: ContentProps
    className?: string
    isCourse?: number
}

export default function CardCourse({ content, className, isCourse }: IProps) {
    const { admin } = useAdmin()
    const router = useRouter()
    const cardRef = useRef<HTMLDivElement>(null)

    const available = content.is_available == 0

    function handleOpen() {
        if (available) return

        return router.push(`/dashboard/conteudo/${admin.id}/${content.url}`)
    }

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
        <div ref={cardRef} className={clsx(styles.card, className, available && styles.blur)} onClick={handleOpen}>
            <div className={styles.image}>
                <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/contents/${isCourse ? getImage(content.course_cover) : getImage(content.image)}`}
                    alt={`Image do post ${content.title}`}
                    loading='lazy'
                    fill
                />
            </div>
        </div>
    )
}
