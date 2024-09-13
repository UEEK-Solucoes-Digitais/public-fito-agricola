import { ComponentProps, forwardRef } from 'react'
import styles from '../styles.module.scss'

const SwitchInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>(({ ...rest }, ref) => {
    return (
        <label htmlFor={rest.name} className={styles.switchWrapper}>
            <input type='checkbox' hidden {...rest} ref={ref} id={rest.name} checked={rest.checked} />
            <div className={styles.markerWrapper}>
                <div className={styles.marker}></div>
            </div>
        </label>
    )
})

SwitchInput.displayName = 'SwitchInput'
export default SwitchInput
