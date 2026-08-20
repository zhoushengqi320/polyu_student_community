"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { formFieldClassName } from "@/lib/utils/formFields";
import { cn } from "@/lib/utils/cn";
import {
  buildDayOptions,
  buildHourOptions,
  buildMinuteOptions,
  buildYearOptions,
  formatDateTimeParts,
  getDefaultDateTimeParts,
  MONTH_LABELS,
  parseIsoToParts,
  partsToIso,
  type DateTimeParts,
} from "@/lib/utils/announcementDateTime";

type DateTimePickerFieldProps = {
  name: string;
  label: string;
  value: string | null;
  onChange: (isoValue: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm";

export function DateTimePickerField({
  name,
  label,
  value,
  onChange,
  required = false,
  error,
  placeholder = "点击选择日期与时间",
}: DateTimePickerFieldProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);

  const hasValue = Boolean(value);
  const parts = useMemo(
    () => parseIsoToParts(value) ?? getDefaultDateTimeParts(new Date()),
    [value],
  );

  const yearOptions = useMemo(
    () => buildYearOptions(new Date().getFullYear(), new Date().getFullYear() + 2),
    [],
  );
  const dayOptions = useMemo(
    () => buildDayOptions(parts.year, parts.month),
    [parts.year, parts.month],
  );
  const hourOptions = useMemo(() => buildHourOptions(), []);
  const minuteOptions = useMemo(() => buildMinuteOptions(), []);

  function updateParts(patch: Partial<DateTimeParts>) {
    const next = { ...parts, ...patch };
    const maxDay = buildDayOptions(next.year, next.month).length;
    if (next.day > maxDay) {
      next.day = maxDay;
    }
    onChange(partsToIso(next));
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${listId}-trigger`}>{label}</Label>
      <input
        type="hidden"
        name={name}
        value={value ?? ""}
        required={required}
      />
      <div className="relative">
        <button
          id={`${listId}-trigger`}
          type="button"
          aria-expanded={open}
          aria-controls={`${listId}-panel`}
          onClick={() => setOpen((current) => !current)}
          className={formFieldClassName(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm",
            Boolean(error),
          )}
        >
          <span className={cn(!hasValue && "text-muted-foreground")}>
            {hasValue ? formatDateTimeParts(parts) : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open ? (
          <div
            id={`${listId}-panel`}
            className="absolute z-20 mt-1 w-full rounded-md border bg-background p-3 shadow-md"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">年</span>
                <select
                  aria-label={`${label} 年`}
                  value={parts.year}
                  onChange={(event) =>
                    updateParts({ year: Number(event.target.value) })
                  }
                  className={selectClassName}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year} 年
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">月</span>
                <select
                  aria-label={`${label} 月`}
                  value={parts.month}
                  onChange={(event) =>
                    updateParts({ month: Number(event.target.value) })
                  }
                  className={selectClassName}
                >
                  {MONTH_LABELS.map((monthLabel, index) => (
                    <option key={monthLabel} value={index + 1}>
                      {monthLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">日</span>
                <select
                  aria-label={`${label} 日`}
                  value={parts.day}
                  onChange={(event) =>
                    updateParts({ day: Number(event.target.value) })
                  }
                  className={selectClassName}
                >
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>
                      {day} 日
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">时</span>
                <select
                  aria-label={`${label} 时`}
                  value={parts.hour}
                  onChange={(event) =>
                    updateParts({ hour: Number(event.target.value) })
                  }
                  className={selectClassName}
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, "0")} 时
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-[11px] text-muted-foreground">分</span>
                <select
                  aria-label={`${label} 分`}
                  value={parts.minute}
                  onChange={(event) =>
                    updateParts({ minute: Number(event.target.value) })
                  }
                  className={selectClassName}
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {String(minute).padStart(2, "0")} 分
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                完成
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
