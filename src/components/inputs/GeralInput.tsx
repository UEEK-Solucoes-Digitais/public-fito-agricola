'use client'

import dynamic from 'next/dynamic'
import { ChangeEvent, ComponentProps, forwardRef, HTMLInputTypeAttribute, useState } from 'react'
import styles from './styles.module.scss'

const ButtonCheckbox = dynamic(() => import('./variants/buttoncheck-input'), { ssr: false })
const CheckboxInput = dynamic(() => import('./variants/checkbox-input'), { ssr: false })
const FileInput = dynamic(() => import('./variants/file-input'), { ssr: false })
const SelectInput = dynamic(() => import('./variants/select-input'), { ssr: false })
const SwitchInput = dynamic(() => import('./variants/switch-input'), { ssr: false })
const TextareaInput = dynamic(() => import('./variants/text-area-input'), { ssr: false })
const TextInput = dynamic(() => import('./variants/text-input'), { ssr: false })

type InputVariant = 'primary' | 'secondary' | 'tertiary' | 'inline' | 'switch' | 'button' | 'checkbox' | 'login'

interface CommonProps {
    id?: string
    name?: string
    label?: string | null
    variant?: InputVariant
    customClasses?: string[]
    maxLength?: number
    leftText?: string
    isTextarea?: boolean
    selectType?: number
    decimalScale?: number
    maskVariant?: string
    selectPlaceholder?: string
    filterInitialValue?: boolean
    tableSelect?: boolean
    lightLabel?: boolean
}

interface InputProps extends CommonProps, Omit<ComponentProps<'input'>, 'onChange'> {
    type?: HTMLInputTypeAttribute
    ref?: any
    onChange?: (event: ChangeEvent<any>) => void
}

const GeralInput = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            customClasses,
            name,
            label,
            variant = 'primary',
            maxLength = 64,
            id = '0',
            leftText,
            isTextarea = false,
            tableSelect = false,
            lightLabel = false,
            ...rest
        },
        ref,
    ) => {
        const isSelect = 'children' in rest
        const isSwitch = 'type' in rest && rest.type == 'checkbox' && variant == 'switch'
        const isButton = 'type' in rest && rest.type == 'checkbox' && variant == 'button'
        const isCheckbox = 'type' in rest && rest.type == 'checkbox' && variant == 'checkbox'
        const isFile = 'type' in rest && rest.type == 'file'
        const [isFocused, setIsFocused] = useState(false)

        const handleFocus = () => {
            setIsFocused(true)
        }

        const handleUnfocus = () => {
            setIsFocused(false)
        }

        if (isSelect) {
            console.log(rest)
        }

        return (
            <div
                className={`${styles.inputWrapper} ${isFocused ? styles.focused : ''} ${lightLabel ? styles.lightLabel : ''} ${
                    isSelect ? styles.selectComponent : ''
                } ${customClasses ? customClasses?.join(' ') : ''} ${styles[variant]} ${
                    'readOnly' in rest && rest.readOnly ? styles.readonly : ''
                } ${tableSelect ? styles.tableSelect : ''}`}>
                {label && variant !== 'button' && variant != 'checkbox' && <label htmlFor={name}>{label}</label>}
                <div>
                    {leftText && <span className={styles.leftText}>{leftText}</span>}
                    {isSelect ? (
                        <SelectInput name={name} {...rest} focusEvent={handleFocus} blurEvent={handleUnfocus} />
                    ) : isSwitch ? (
                        <SwitchInput name={name} {...rest} />
                    ) : isButton ? (
                        <ButtonCheckbox label={label} name={name} {...rest} />
                    ) : isFile ? (
                        <FileInput id={id} name={name} {...rest} />
                    ) : isCheckbox ? (
                        <CheckboxInput label={label} name={name} {...rest} />
                    ) : isTextarea ? (
                        <TextareaInput name={name} maxLength={maxLength} {...rest} />
                    ) : (
                        <TextInput name={name} maxLength={maxLength} ref={ref} {...rest} />
                    )}
                </div>
            </div>
        )
    },
)

GeralInput.displayName = 'GeralInput'
export default GeralInput
