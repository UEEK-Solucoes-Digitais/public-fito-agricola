import { ComponentProps, forwardRef } from 'react'
import { IMaskInput } from 'react-imask'
import { NumericFormat } from 'react-number-format'

interface InputSpecificProps extends ComponentProps<'input'> {
    maskVariant?: string
    decimalScale?: number
}

const TextInput = forwardRef<HTMLInputElement, InputSpecificProps>(
    ({ type, maskVariant, decimalScale = 2, ...rest }, ref) => {
        let maskOptions: string | RegExp | undefined

        if (maskVariant != undefined) {
            switch (maskVariant) {
                case 'year':
                    maskOptions = '0000'
                    break
                case 'phone':
                    maskOptions = '(00) 00000-0000'
                    break
                case 'integer':
                    maskOptions = '000000000000000000'
                    break
                case 'price-10':
                    maskOptions = '00,00'
                    break
                case 'price-100':
                    maskOptions = '000,00'
                    break
                case 'price-1000':
                    maskOptions = '0.000,00'
                    break
                case 'price-10000':
                    maskOptions = '00.000,00'
                    break
                case 'price-100000':
                    maskOptions = '000.000,00'
                    break
                case 'price-1000000':
                    maskOptions = '0.000.000,00'
                    break
                case 'cpf':
                    maskOptions = '000.000.000-00'
                    break
                case 'cnpj':
                    maskOptions = '00.000.000/0000-00'
                    break
                case 'cep':
                    maskOptions = '00000-000'
                    break
                case 'date':
                    maskOptions = '00/00/0000'
                    break
                case 'state-subscription':
                    maskOptions = '000 000 0000'
                    break
                case 'lat':
                    maskOptions = /^-?([1-8]?[0-9]?(?:\.\d{0,})?|90(?:\.0{0,})?)$/
                    break
                case 'long':
                    maskOptions = /^-?([1-8]?[0-9]?(?:\.\d{0,})?|180(?:\.0{0,})?)$/
                    break
                case 'decimal':
                    maskOptions = /^\d+(,\d{0,2})?$/
                    break
                case 'duration':
                    maskOptions = '00:00:00'
                    break
            }
        }

        if (maskOptions) {
            return (
                <IMaskInput
                    name={rest.name}
                    placeholder={rest.placeholder}
                    onChange={typeof rest.onChange != 'undefined' ? rest.onChange : () => {}}
                    readOnly={typeof rest.readOnly != 'undefined' ? rest.readOnly : false}
                    mask={maskOptions as RegExp}
                    defaultValue={rest.defaultValue}
                    value={rest.defaultValue?.toString()}
                    type={type}
                />
            )
        }

        if (maskVariant === 'price') {
            return (
                <NumericFormat
                    // @ts-expect-error NumericFormat reclama de erros inexistentes pela tipagem interna
                    value={rest.defaultValue?.toString()}
                    fixedDecimalScale
                    onChange={typeof rest.onChange != 'undefined' ? rest.onChange : () => {}}
                    decimalScale={decimalScale}
                    decimalSeparator=','
                    thousandSeparator='.'
                    maxLength={rest.maxLength}
                    {...rest}
                />
            )
        }

        return (
            <input
                value={rest.defaultValue}
                maxLength={rest.maxLength}
                type={type}
                {...rest}
                ref={ref}
                autoComplete={rest.autoComplete == '1' ? '' : 'none'}
            />
        )
    },
)

TextInput.displayName = 'TextInput'
export default TextInput
