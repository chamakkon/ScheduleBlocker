import { useT } from "@renderer/lib/i18n";
import { Button } from "./Button";
import { Modal } from "./Modal";

type ConfirmFinalizeModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmFinalizeModal({
  open,
  onClose,
  onConfirm
}: ConfirmFinalizeModalProps) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("modal.finalizeTitle")}
    >
      <div className="grid gap-3">
        <p className="text-[12px] text-[#858585]">
          {t("modal.finalizeBody")}
        </p>
        <div className="flex justify-end gap-1">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("modal.cancel")}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            type="button"
          >
            {t("modal.finalize")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
