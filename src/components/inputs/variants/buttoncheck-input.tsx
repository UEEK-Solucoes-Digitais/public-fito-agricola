import { ComponentProps, forwardRef } from 'react'
import styles from '../styles.module.scss'

interface SwitchSpecificProps extends ComponentProps<'input'> {
    label?: string | null
}

const ButtonCheckbox = forwardRef<HTMLInputElement, SwitchSpecificProps>(({ label, ...rest }, ref) => {
    return (
        <label htmlFor={rest.name} className={styles.buttonWrapper}>
            <input type='checkbox' hidden {...rest} ref={ref} id={rest.name} />
            <div className={styles.checkButton}>{label}</div>
        </label>
    )
})

ButtonCheckbox.displayName = 'ButtonCheckbox'
export default ButtonCheckbox
