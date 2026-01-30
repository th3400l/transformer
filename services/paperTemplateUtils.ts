const TEMPLATE_BASE_PATH = '/template';
const TEMPLATE_LOW_SUFFIX = '_low';
const TEMPLATE_CACHE: Record<string, string> = {};

export const buildTemplateAssetPath = (filename: string, lowQuality = false): string => {
  if (!filename) {
    throw new Error('Template filename is required');
  }

  const normalized = filename.startsWith('/') ? filename.slice(1) : filename;
  const [name, ext = ''] = normalized.split(/\.(?=[^\.]+$)/);
  const extension = ext || 'jpeg';

  if (!lowQuality) {
    return `${TEMPLATE_BASE_PATH}/${name}.${extension}`;
  }

  const lowKey = `${name}${TEMPLATE_LOW_SUFFIX}.${extension}`;
  return `${TEMPLATE_BASE_PATH}/${lowKey}`;
};

export const resolveTemplateSrcset = (filename: string): string => {
  const basePath = buildTemplateAssetPath(filename, false);
  const lowPath = buildTemplateAssetPath(filename, true);
  return `${lowPath} 600w, ${basePath} 1200w`;
};

export const preloadTemplateImage = async (filename: string, lowQuality = false): Promise<HTMLImageElement> => {
  const cacheKey = `${filename}|${lowQuality ? 'low' : 'full'}`;
  if (TEMPLATE_CACHE[cacheKey]) {
    return createImage(TEMPLATE_CACHE[cacheKey]);
  }

  const src = buildTemplateAssetPath(filename, lowQuality);
  try {
    const image = await createImage(src);
    TEMPLATE_CACHE[cacheKey] = src;
    return image;
  } catch (error) {
    delete TEMPLATE_CACHE[cacheKey];
    throw error;
  }
};

const createImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};
