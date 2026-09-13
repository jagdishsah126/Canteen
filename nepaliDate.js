(function (global) {
  "use strict";

  var MONTH_NAMES = [
    "Baishakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
  ];

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toIso(year, month, day) {
    return year + "-" + pad2(month) + "-" + pad2(day);
  }

  function parseIso(isoDate) {
    var parts = String(isoDate).split("-").map(Number);
    return { year: parts[0], month: parts[1], day: parts[2] };
  }

  function weekdayFromIso(isoDate) {
    var p = parseIso(isoDate);
    var date = new Date(p.year, p.month - 1, p.day);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }

  function monthName(month) {
    return MONTH_NAMES[month - 1] || "Unknown";
  }

  function adToBs(isoDate) {
    var p = parseIso(isoDate);
    var converter = new global.NepaliDateConverter(
      p.year + "-" + pad2(p.month) + "-" + pad2(p.day)
    );
    var bs = converter.toBs();
    return {
      year: bs.year,
      month: bs.month,
      day: bs.date,
      monthName: monthName(bs.month),
      weekday: bs.day || weekdayFromIso(isoDate),
      formatted: monthName(bs.month) + " " + bs.date + ", " + bs.year,
      monthLabel: monthName(bs.month) + " " + bs.year,
    };
  }

  function bsToAd(year, month, day) {
    var converter = new global.NepaliDateConverter(
      year + "-" + pad2(month) + "-" + pad2(day)
    );
    var ad = converter.toAd();
    return toIso(ad.year, ad.month, ad.date);
  }

  function daysInBsMonth(year, month) {
    var nextMonth = month === 12 ? 1 : month + 1;
    var nextYear = month === 12 ? year + 1 : year;
    var start = parseIso(bsToAd(year, month, 1));
    var end = parseIso(bsToAd(nextYear, nextMonth, 1));
    var startUtc = Date.UTC(start.year, start.month - 1, start.day);
    var endUtc = Date.UTC(end.year, end.month - 1, end.day);
    return Math.round((endUtc - startUtc) / 86400000);
  }

  function shiftBsMonth(isoDate, deltaMonths) {
    var bs = adToBs(isoDate);
    var absolute = bs.year * 12 + (bs.month - 1) + deltaMonths;
    var year = Math.floor(absolute / 12);
    var month = (absolute % 12) + 1;
    if (month <= 0) {
      month += 12;
      year -= 1;
    }
    var maxDay = daysInBsMonth(year, month);
    var day = Math.min(bs.day, maxDay);
    return bsToAd(year, month, day);
  }

  function formatBsFull(isoDate) {
    var bs = adToBs(isoDate);
    return {
      title: bs.formatted,
      subtitle: bs.weekday,
      monthLabel: bs.monthLabel,
      bs: bs,
    };
  }

  function listBsMonthDays(year, month) {
    var total = daysInBsMonth(year, month);
    var days = [];
    for (var day = 1; day <= total; day += 1) {
      days.push({
        year: year,
        month: month,
        day: day,
        iso: bsToAd(year, month, day),
        monthName: monthName(month),
        label: monthName(month) + " " + day,
      });
    }
    return days;
  }

  function shiftBsYearMonth(year, month, deltaMonths) {
    var absolute = year * 12 + (month - 1) + deltaMonths;
    var nextYear = Math.floor(absolute / 12);
    var nextMonth = (absolute % 12) + 1;
    if (nextMonth <= 0) {
      nextMonth += 12;
      nextYear -= 1;
    }
    return { year: nextYear, month: nextMonth };
  }

  global.CanteenNepali = {
    MONTH_NAMES: MONTH_NAMES,
    adToBs: adToBs,
    bsToAd: bsToAd,
    daysInBsMonth: daysInBsMonth,
    shiftBsMonth: shiftBsMonth,
    shiftBsYearMonth: shiftBsYearMonth,
    listBsMonthDays: listBsMonthDays,
    formatBsFull: formatBsFull,
    monthName: monthName,
  };
})(window);
