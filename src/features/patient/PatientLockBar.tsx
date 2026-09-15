import { Badge, Button, Card } from "@/shared/ui";

export function PatientLockBar({
  lockLabel,
  lockedByOther,
  holdsLock,
  canTake,
  canRelease,
  onTake,
  onRelease,
}: {
  lockLabel: string;
  lockedByOther: boolean;
  holdsLock: boolean;
  canTake: boolean;
  canRelease: boolean;
  onTake: () => void;
  onRelease: () => void;
}) {
  return (
    <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <div className="text-sm text-slate-500">Блокировка карты</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge tone={lockedByOther ? "amber" : holdsLock ? "green" : "slate"}>
            {lockLabel}
          </Badge>
          {lockedByOther ? (
            <span className="text-sm text-amber-800">
              Редактирование недоступно, пока карту держит другой пользователь.
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {canTake ? (
          <Button variant="secondary" onClick={onTake}>
            Взять в работу
          </Button>
        ) : null}
        {canRelease ? (
          <Button variant="secondary" onClick={onRelease}>
            Снять блокировку
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
