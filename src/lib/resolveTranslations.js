const ARMENIAN_CODE = "hy";

export function isTranslationRecordComplete(record, requiredFields) {
  if (!record) return false;

  return requiredFields.every((field) => {
    const value = record[field];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function resolveTranslations(languageCode, cmsData, hyFallback) {
  if (languageCode === ARMENIAN_CODE) {
    return { ...hyFallback, ...(cmsData ?? {}) };
  }

  return cmsData ?? {};
}
