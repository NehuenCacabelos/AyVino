import { useState, type ReactNode, type InputHTMLAttributes, type ComponentType } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  error?: string | null;
  icon?: ComponentType<{ className?: string }>;
  isPassword?: boolean;
  bottomExtra?: ReactNode;
}

/**
 * AuthField Component
 * Componente atómico de entrada de datos para formularios de autenticación.
 * Encapsula el estilo Outlined Notch con label incrustada en el borde superior,
 * alternancia de visibilidad de contraseña, iconos contextuales y feedback reactivo de error.
 */
export default function AuthField({
  id,
  label,
  type = 'text',
  error,
  icon: Icon,
  isPassword,
  bottomExtra,
  className = '',
  disabled,
  ...rest
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = isPassword ?? type === 'password';
  const effectiveType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      <div className="relative group">
        {/* Label incrustada en el borde superior (Outlined Notch) */}
        <label
          htmlFor={id}
          className={`absolute -top-2 left-3 px-1.5 bg-[#18181b] text-xs font-medium tracking-wide z-10 transition-all pointer-events-none ${
            error ? 'text-rose-400' : 'text-zinc-200 group-focus-within:text-rose-300'
          }`}
        >
          {label}
        </label>

        {/* Icono a la izquierda */}
        {Icon && (
          <Icon
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${
              error ? 'text-rose-400/80' : 'text-zinc-500 group-focus-within:text-zinc-300'
            }`}
          />
        )}

        {/* Input con estilos oscuros y padding dinámico según iconos */}
        <input
          id={id}
          type={effectiveType}
          disabled={disabled}
          className={`h-11 w-full bg-black/25 rounded-lg border text-zinc-100 placeholder:text-zinc-500 text-sm ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${isPasswordField ? 'pr-10' : 'pr-3.5'} pt-1 focus:outline-none transition-colors ${
            error
              ? 'border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
              : 'border-zinc-700/80 hover:border-zinc-500 focus:border-rose-800/90 focus:ring-1 focus:ring-rose-800/50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
          {...rest}
        />

        {/* Toggle de visibilidad para contraseñas */}
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
            aria-label={showPassword ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Manejo de feedback de error y enlace o slot inferior */}
      {bottomExtra ? (
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          {error ? (
            <p className="text-[10px] text-rose-400 pl-1">{error}</p>
          ) : (
            <span />
          )}
          {bottomExtra}
        </div>
      ) : (
        error && <p className="text-[10px] text-rose-400 mt-1 pl-1">{error}</p>
      )}
    </div>
  );
}

