declare module 'nepali-date-converter' {
  export default class NepaliDate {
    constructor(date?: Date | string | number | NepaliDate);
    constructor(year: number, month: number, date: number);

    getYear(): number;
    getMonth(): number; // 0-indexed (0 to 11)
    getDate(): number;  // 1 to 32
    getDay(): number;   // 0 (Sun) to 6 (Sat)
    
    setYear(year: number): void;
    setMonth(month: number): void;
    setDate(date: number): void;

    format(formatStr: string, language?: 'np' | 'en'): string;
    toJsDate(): Date;
    
    static fromAD(date: Date): NepaliDate;
    static getDaysInMonth(year: number, month: number): number;
  }
}
