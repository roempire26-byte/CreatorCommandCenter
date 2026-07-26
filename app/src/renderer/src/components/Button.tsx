import { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function buttonClassName(variant: ButtonVariant = 'secondary', className?: string): string {
  return [styles.button, styles[variant], className].filter(Boolean).join(' ')
}

export function Button({ variant = 'secondary', className, ...rest }: ButtonProps): JSX.Element {
  return <button className={buttonClassName(variant, className)} {...rest} />
}
