import { CRF_BLOCK_ORDER } from "@/entities/crf/blocks";
import { canViewBlock } from "@/entities/user/roles";
import type { Role } from "@/entities/user/types";
import { Button, Card } from "@/shared/ui";

export function CrfTabs({
  role,
  active,
  onChange,
}: {
  role: Role | null | undefined;
  active: string;
  onChange: (block: string) => void;
}) {
  return (
    <Card className="mb-5 p-4">
      <div className="flex flex-wrap gap-2">
        {CRF_BLOCK_ORDER.map((item) => (
          <Button
            key={item}
            variant={active === item ? "primary" : "secondary"}
            disabled={!canViewBlock(role, item)}
            onClick={() => onChange(item)}
          >
            {item}
          </Button>
        ))}
      </div>
    </Card>
  );
}
