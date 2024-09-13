import { useSearch } from '@/context/SearchContext'
import clsx from 'clsx'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import IconifyIcon from '../iconify/IconifyIcon'
import { Reveal } from '../reveal/reveal'
import styles from './styles.module.scss'

interface Category {
    id: number
    name: string
}

interface ListTypes {
    title: string
    itens: Category[]
}

interface IProps {
    lists?: ListTypes[]
    onClose: () => void
}

export default function Sidebar({ lists, onClose }: IProps) {
    const { categoryPage, setCategoryPage } = useSearch()

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key == 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose])

    function handleCategory(categoryId: number) {
        setCategoryPage(categoryId)
        onClose()
    }

    return createPortal(
        <aside className={styles.wrapper}>
            <div className={styles.background} onClick={onClose}></div>
            <Reveal duration={500} direction='right' triggerOnce>
                <div className={styles.content}>
                    <div className={styles.actions}>
                        <span className={styles.title}>Filtrar</span>

                        <button type='button' className={styles.buttonClose} onClick={onClose}>
                            <IconifyIcon icon='ic:round-close' />
                        </button>
                    </div>

                    <div className={styles.listContainer}>
                        {lists &&
                            lists.length > 0 &&
                            lists.map((list, index) => (
                                <div key={index} className={styles.listBlock}>
                                    <span className={styles.listTitle}>{list.title}</span>

                                    <ul className={styles.list}>
                                        {list.itens.map((category) => (
                                            <li key={category.id}>
                                                <button
                                                    className={clsx(category.id == categoryPage && styles.active)}
                                                    type='button'
                                                    onClick={() => handleCategory(category.id)}>
                                                    {category.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                    </div>
                </div>
            </Reveal>
        </aside>,
        document.body,
    )
}
