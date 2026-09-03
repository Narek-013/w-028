import { isTranslationRecordComplete } from "./resolveTranslations";

export const GUEST_INVITE_FIELDS = ["title", "body"];

export const LOCATION_FIELDS = [
  "section_title",
  "map_button",
  "event_1_time",
  "event_1_title",
  "event_1_place",
  "event_2_time",
  "event_2_title",
  "event_2_place",
];

export const CLOCK_FIELDS = [
  "label_days",
  "label_hours",
  "label_minutes",
  "label_seconds",
];

export const CALENDAR_FIELDS = [
  "month_10",
  "weekday_mon",
  "weekday_tue",
  "weekday_wed",
  "weekday_thu",
  "weekday_fri",
  "weekday_sat",
  "weekday_sun",
];

export const DRESS_CODE_FIELDS = ["title", "body"];

export const CONFIRM_FIELDS = [
  "title",
  "intro",
  "deadline",
  "already_confirmed",
  "placeholder_name",
  "placeholder_surname",
  "placeholder_guests",
  "attendance_question",
  "attend_yes",
  "attend_no",
  "submit",
  "name_hint",
  "error_name",
  "error_count",
  "error_send",
];

export function hasCompleteCmsTranslations(translations) {
  return (
    isTranslationRecordComplete(translations.guestInvite, GUEST_INVITE_FIELDS) &&
    isTranslationRecordComplete(translations.location, LOCATION_FIELDS) &&
    isTranslationRecordComplete(translations.clock, CLOCK_FIELDS) &&
    isTranslationRecordComplete(translations.calendar, CALENDAR_FIELDS) &&
    isTranslationRecordComplete(translations.dressCode, DRESS_CODE_FIELDS) &&
    isTranslationRecordComplete(translations.confirm, CONFIRM_FIELDS)
  );
}
