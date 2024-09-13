import React from 'react'

import styles from './styles.module.scss'

const TableSkeleton: React.FC = () => {
    const skeletonRows = []

    for (let i = 0; i < 4; i++) {
        skeletonRows.push(<div key={i} className={styles.skeletonRow}></div>)
    }

    return <div className={styles.skeletonWrapper}>{skeletonRows}</div>
}

TableSkeleton.displayName = 'TableSkeleton'

export default TableSkeleton
