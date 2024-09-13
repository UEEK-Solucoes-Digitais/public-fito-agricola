import { ComponentProps, forwardRef } from 'react'
import styles from '../styles.module.scss'

interface SwitchSpecificProps extends ComponentProps<'input'> {
    label?: string | null
}

const CheckboxInput = forwardRef<HTMLInputElement, SwitchSpecificProps>(({ label, ...rest }, ref) => {
    return (
        <div className={styles.checkboxWrapper}>
            <input type='checkbox' {...rest} ref={ref} id={rest.name} checked={rest.checked} />
            <div className={styles.boxArea}></div>
            <label htmlFor={rest.name} className={styles.checkbox}>
                {label}
            </label>
        </div>
    )
})

CheckboxInput.displayName = 'CheckboxInput'
export default CheckboxInput
