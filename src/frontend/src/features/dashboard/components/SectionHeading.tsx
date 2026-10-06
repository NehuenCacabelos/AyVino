import type { ReactNode } from 'react';

interface SectionHeadingProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  as?: 'h2' | 'h3';
  children?: ReactNode;
}

/**
 * SectionHeading Component (Estética Oscura Mate)
 * Encabezado de sección editorial con tipografía Fraunces semi-bold (#e5e5e5)
 * y eyebrow en font-mono uppercase tracking-[0.25em].
 */
export default function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
  as: Tag = 'h2',
  children,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div
      className={`flex flex-col md:flex-row gap-4 justify-between ${
        centered ? 'items-center text-center' : 'md:items-end'
      }`}
    >
      <div className={`flex flex-col gap-2 max-w-2xl ${centered ? 'items-center' : ''}`}>
        {eyebrow && (
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 font-medium">
            {eyebrow}
          </span>
        )}
        
        <Tag
          id={id}
          className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-100 leading-tight"
        >
          {title}
        </Tag>

        <div className={`h-[1px] w-12 bg-neutral-700/80 my-1 ${centered ? 'mx-auto' : ''}`} aria-hidden="true" />

        {description && (
          <p className="text-sm text-neutral-400 font-sans leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
