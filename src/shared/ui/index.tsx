import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "exportFinal"
  | "exportSlice";

export function Button({
  variant = "primary",
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-[0.95rem] py-[0.58rem] text-sm font-bold leading-tight transition",
        !disabled &&
          variant === "primary" &&
          "border-transparent bg-teal-700 text-white hover:bg-teal-800",
        !disabled &&
          variant === "secondary" &&
          "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        !disabled &&
          variant === "danger" &&
          "border-red-200 bg-red-100 text-red-800 hover:bg-red-200",
        !disabled &&
          variant === "exportFinal" &&
          "border-green-700 bg-green-600 text-white hover:bg-green-700",
        !disabled &&
          variant === "exportSlice" &&
          "border-violet-700 bg-violet-600 text-white hover:bg-violet-700",
        disabled &&
          "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500 opacity-45 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-card",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-bold text-slate-600", className)}
      {...props}
    />
  );
}

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[0.9rem] outline-none transition focus:border-teal-700 focus:ring-[3px] focus:ring-teal-700/20 disabled:bg-slate-50 disabled:text-slate-500";

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, className)} {...props} />;
}

export function Badge({
  tone = "blue",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "blue" | "amber" | "slate" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
        tone === "green" && "bg-green-100 text-green-800",
        tone === "blue" && "bg-blue-100 text-blue-700",
        tone === "amber" && "bg-amber-100 text-amber-800",
        tone === "slate" && "bg-slate-100 text-slate-600",
        tone === "red" && "bg-red-100 text-red-800",
        className
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-black">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-4xl text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export function Kpi({
  title,
  value,
  note,
  tone = "blue",
}: {
  title: string;
  value: string;
  note?: string;
  tone?: "green" | "blue" | "amber" | "slate";
}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      {note ? (
        <div className="mt-3">
          <Badge tone={tone}>{note}</Badge>
        </div>
      ) : null}
    </Card>
  );
}

export function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
      {message}
    </div>
  );
}

export function FieldControl({
  name,
  value,
  hint,
  editable,
  onChange,
}: {
  name: string;
  value: string;
  hint?: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  const long = name.length > 58 || value.length > 100;
  return (
    <div className={long ? "md:col-span-2" : undefined}>
      <Label>{name}</Label>
      {long ? (
        <TextArea
          rows={3}
          disabled={!editable}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <TextInput
          disabled={!editable}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? <div className="mt-1.5 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}
