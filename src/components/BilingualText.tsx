import type { Language } from '../types';

interface Props {
  native: string;
  de: string;
  lang: Language;
  deClassName?: string;
}

export function BilingualText({ native, de, lang, deClassName = '' }: Props) {
  const showDE = lang !== 'de' && native !== de;
  return (
    <>
      <span dir={lang === 'ar' ? 'rtl' : 'ltr'}>{native}</span>
      {showDE && (
        <span
          className={`block text-xs font-normal opacity-50 leading-tight mt-0.5 ${deClassName}`}
          dir="ltr"
          style={{ letterSpacing: 'normal', textTransform: 'none' }}
        >
          {de}
        </span>
      )}
    </>
  );
}
