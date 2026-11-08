import { CRF_SECTIONS, sectionLabel } from "@/entities/crf/sections";
import { canViewSection } from "@/entities/user/roles";
import type { Role } from "@/entities/user/types";
import { Button, Card } from "@/shared/ui";

export function CrfTabs({
  role,
  active,
  onChange,
}: {
  role: Role | null | undefined;
  active: number;
  onChange: (sectionId: number) => void;
}) {
  return (
    <Card className="mb-5 p-4">
      <div className="flex flex-wrap gap-2">
        {CRF_SECTIONS.map((item) => (
          <Button
            key={item.id}
            variant={active === item.id ? "primary" : "secondary"}
            disabled={!canViewSection(role, item.id)}
            className="max-w-full whitespace-normal text-left"
            onClick={() => onChange(item.id)}
          >
            {sectionLabel(item.id)}
          </Button>
        ))}
      </div>
    </Card>
  );
}
