export const parseHtmlFromUrl = async (url: string) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  } catch {
    return new Error('Error while parsing HTML');
  }
};

export const getIdFromLinkTag = (el: HTMLLinkElement | null) => {
  return el?.href?.replace(/[^0-9]/g, '');
};
