export const formatTitleCase = (value: string) => {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase('es-PE');
      return `${lower.charAt(0).toLocaleUpperCase('es-PE')}${lower.slice(1)}`;
    })
    .join(' ');
};

export const shouldFormatTextValue = (type?: string) => {
  return type === 'TEXTO' || type === 'TEXTAREA';
};
