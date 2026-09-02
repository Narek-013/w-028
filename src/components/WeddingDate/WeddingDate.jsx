import "../../App.css";
import { Imgs } from "../../img/imgs";
import { useLanguage } from "../../context/LanguageContext";
import "./WeddingDate.scss";

const WEDDING_YEAR = 2026;
const WEDDING_MONTH = 10;
const WEDDING_DAY = 26;

const WEEKDAY_KEYS = [
  "weekday_mon",
  "weekday_tue",
  "weekday_wed",
  "weekday_thu",
  "weekday_fri",
  "weekday_sat",
  "weekday_sun",
];

const FALLBACK_TRANSLATIONS = {
  month_10: "OCTOBER",
  weekday_mon: "MON",
  weekday_tue: "TUE",
  weekday_wed: "WED",
  weekday_thu: "THU",
  weekday_fri: "FRI",
  weekday_sat: "SAT",
  weekday_sun: "SUN",
};

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const lastWeek = weeks[weeks.length - 1];
  if (lastWeek.length < 7) {
    weeks[weeks.length - 1] = [
      ...lastWeek,
      ...Array.from({ length: 7 - lastWeek.length }, () => null),
    ];
  }

  return weeks;
}

const WeddingDate = () => {
  const { calendarTranslations } = useLanguage();
  const labels = calendarTranslations ?? FALLBACK_TRANSLATIONS;
  const monthLabel = labels[`month_${WEDDING_MONTH}`] ?? FALLBACK_TRANSLATIONS.month_10;
  const weeks = buildCalendarDays(WEDDING_YEAR, WEDDING_MONTH);

  return (
    <div className="WeddingDate">
      <div className="WeddingDate_container container">
        <table>
          <colgroup>
            {WEEKDAY_KEYS.map((key) => (
              <col key={key} />
            ))}
          </colgroup>
          <tbody>
            <tr>
              <th className="WeddingDate_header-month" colSpan={5}>
                {monthLabel}
              </th>
              <th className="WeddingDate_header-year" colSpan={2}>
                {WEDDING_YEAR}
              </th>
            </tr>

            <tr>
              {WEEKDAY_KEYS.map((key) => (
                <th key={key} className="WeddingDate_weekday">
                  {labels[key] ?? FALLBACK_TRANSLATIONS[key]}
                </th>
              ))}
            </tr>

            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return <td key={`empty-${weekIndex}-${dayIndex}`} />;
                  }

                  const isWeddingDay = day === WEDDING_DAY;

                  return (
                    <td
                      key={day}
                      className={isWeddingDay ? "WeddingDate_day--highlight" : undefined}
                    >
                      <span className="WeddingDate_dayContent">
                        {isWeddingDay && (
                          <span className="WeddingDate_heart" aria-hidden="true">
                            <img src={Imgs.heart_icon} alt="" />
                          </span>
                        )}
                        {day}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeddingDate;
