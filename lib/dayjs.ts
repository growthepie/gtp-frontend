import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/en-gb";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(duration);

// Set default locale
dayjs.locale("en-gb");

export default dayjs;
