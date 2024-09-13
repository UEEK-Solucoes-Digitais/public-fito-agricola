import type ContentProps from '@/@types/Content'
import type IContentComment from '@/@types/ContentComment'
import Comment from '@/components/comment'
import Field from '@/components/comment/field'
import { Fragment, useRef } from 'react'
import { KeyedMutator } from 'swr'

import styles from './comments.module.scss'
import ContentCategoryProps from '@/@types/ContentCategory'

interface IProps {
    contentId: number
    list: IContentComment[]
    mutate: KeyedMutator<{
        content: ContentProps
        content_categories: ContentCategoryProps[]
    }>
}

export default function Comments({ contentId, list, mutate }: IProps) {
    const commentRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={commentRef} className={styles.commentContainer}>
            {list.map((comment) => (
                <Fragment key={comment.id}>
                    <Comment contentId={contentId} comment={comment} mutate={mutate} />

                    {comment.answers.length > 0 && (
                        <div className={styles.answersContainer}>
                            {comment.answers.map((answer) => (
                                <Comment contentId={contentId} key={answer.id} comment={answer} mutate={mutate} />
                            ))}
                        </div>
                    )}
                </Fragment>
            ))}

            <Field contentId={contentId} mutate={mutate} commentRef={commentRef} />
        </div>
    )
}
