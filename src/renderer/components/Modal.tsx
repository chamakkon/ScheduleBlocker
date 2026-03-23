import type { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>;

export function Modal({
  open,
  title,
  onClose,
  children
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg border border-[#454545] bg-[#252526] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#333333] px-4 py-2">
          <h2 className="text-[13px] text-[#cccccc]">
            {title}
          </h2>
          <button
            className="text-[12px] text-[#858585] hover:text-[#cccccc]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
