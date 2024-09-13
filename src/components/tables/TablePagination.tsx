import React, { HTMLAttributes } from 'react'
import styles from './styles.module.scss'

export interface TablePaginationProps extends HTMLAttributes<HTMLDivElement> {
    pages: number
    active: number
    onPageChange: (index: number) => void
    alignLeft?: boolean
}

const MAX_BUTTONS = 5

const TablePagination: React.FC<TablePaginationProps> = ({ active, pages = 1, onPageChange, alignLeft = false }) => {
    const createButton = (i: number) => {
        const isEllipsis = i == 0
        const displayText = isEllipsis ? '...' : i

        return (
            <button
                key={i}
                className={`${styles.paginatorButton} ${i == active ? styles.active : ''} ${
                    isEllipsis ? styles.noStyle : ''
                }`}
                type='button'
                onClick={() => (isEllipsis ? null : onPageChange(i))}
                disabled={isEllipsis}>
                {displayText}
            </button>
        )
    }

    const generateButtons = () => {
        const buttons = []
        let startPage

        if (active >= 4 && pages > MAX_BUTTONS) {
            // Inicia mostrando '...' no penúltimo botão se estiver além da página 3
            startPage = active - 1
            buttons.push(createButton(1)) // Sempre mostrar a primeira página
            buttons.push(createButton(0)) // Botão para '...'
        } else {
            startPage = 1
        }

        const endPage = pages > MAX_BUTTONS ? startPage + MAX_BUTTONS - 3 : pages // Ajusta para que as reticências e a última página sejam mostradas

        for (let i = startPage; i <= endPage; i++) {
            if (i !== pages + 1) {
                buttons.push(createButton(i))
            }
        }

        if (pages > MAX_BUTTONS && active <= pages - 3) {
            buttons.push(createButton(0)) // Botão para '...'
            buttons.push(createButton(pages)) // Última página
        }

        return buttons
    }

    return (
        <div className={`${styles.paginatorContainer} ${alignLeft ? styles.alignLeft : ''}`}>
            <button
                className={`${styles.paginatorButton}`}
                type='button'
                onClick={() => onPageChange(active > 1 ? active - 1 : active)}>
                {'<'}
            </button>
            {generateButtons()}
            <button
                className={`${styles.paginatorButton}`}
                type='button'
                onClick={() => onPageChange(active < pages ? active + 1 : active)}>
                {'>'}
            </button>
        </div>
    )
}

export default TablePagination
