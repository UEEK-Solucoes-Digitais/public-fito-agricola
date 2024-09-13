import { ComponentProps, forwardRef } from 'react'

const TextareaInput = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>((props, ref) => {
    return (
        <textarea
            value={props.defaultValue}
            maxLength={props.maxLength}
            autoComplete={props.autoComplete == '1' ? '' : 'none'}
            {...props}
            ref={ref}
        />
    )
})

TextareaInput.displayName = 'TextareaInput'
export default TextareaInput
