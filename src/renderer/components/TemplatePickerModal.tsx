import { useEffect, useState } from "react";
import type {
  ColorSetting,
  FixedCandidateTemplate
} from "@shared/types";
import { useT } from "@renderer/lib/i18n";
import { Button } from "./Button";
import { Modal } from "./Modal";

type TemplatePickerModalProps = {
  open: boolean;
  templates: FixedCandidateTemplate[];
  colors: ColorSetting[];
  onClose: () => void;
  onAdd: (templateIds: string[]) => void;
};

export function TemplatePickerModal({
  open,
  templates,
  colors,
  onClose,
  onAdd
}: TemplatePickerModalProps) {
  const t = useT();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
    }
  }, [open]);

  const colorMap = new Map(colors.map((color) => [color.id, color]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("template.title")}
    >
      <div className="grid gap-1">
        {templates.length === 0 ? (
          <p className="py-4 text-center text-[12px] text-[#555555]">
            {t("template.empty")}
          </p>
        ) : (
          templates.map((template) => {
            const selected = selectedIds.includes(template.id);
            const color = colorMap.get(template.colorId);
            return (
              <label
                key={template.id}
                className={`flex cursor-pointer items-center gap-2 px-2 py-1.5 ${
                  selected
                    ? "bg-[#094771]"
                    : "hover:bg-[#2a2d2e]"
                }`}
              >
                <input
                  checked={selected}
                  onChange={(event) => {
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, template.id]
                        : current.filter((id) => id !== template.id)
                    );
                  }}
                  type="checkbox"
                />
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{
                    backgroundColor: color?.hex ?? "#94a3b8"
                  }}
                />
                <span className="text-[12px] text-[#cccccc]">
                  {template.title}
                </span>
                {template.subTasks.length > 0 && (
                  <span className="text-[11px] text-[#555555]">
                    ({template.subTasks.join(", ")})
                  </span>
                )}
              </label>
            );
          })
        )}

        <div className="mt-2 flex justify-end gap-1 border-t border-[#333333] pt-2">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("modal.cancel")}
          </Button>
          <Button
            disabled={selectedIds.length === 0}
            onClick={() => {
              onAdd(selectedIds);
              onClose();
            }}
            type="button"
          >
            {t("template.add")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
