import { QuickBiteData } from '@/lib/types/quickBites';

export const SHORT_TITLE_MAX_LENGTH = 20;

export const createQuickBite = <T extends QuickBiteData>(data: T): T => {
  if (!data.shortTitle || data.shortTitle.trim().length === 0) {
    throw new Error(`Quick Bite "${data.title}" is missing a shortTitle.`);
  }

  if (data.shortTitle.length > SHORT_TITLE_MAX_LENGTH) {
    throw new Error(
      `Quick Bite "${data.title}" shortTitle exceeds ${SHORT_TITLE_MAX_LENGTH} characters: "${data.shortTitle}".`
    );
  }

  return data;
};
