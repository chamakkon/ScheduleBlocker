import { useEffect, useMemo, useState } from "react";
import type {
  ColorSetting,
  TaskCandidate
} from "@shared/types";
import { Button } from "./Button";
import { Modal } from "./Modal";

type TaskEditorModalProps = {
  open: boolean;
  candidate?: TaskCandidate;
  colors: ColorSetting[];
  onClose: () => void;
  onSubmit: (
    value: Omit<TaskCandidate, "id"> | TaskCandidate
  ) => void;
};

type TaskFormState = {
  title: string;
  subTask1: string;
  subTask2: string;
  subTask3: string;
  colorId: string;
  estimatedDurationMin: string;
  note: string;
};

function buildInitialState(
  candidate: TaskCandidate | undefined,
  fallbackColorId: string
): TaskFormState {
  return {
    title: candidate?.title ?? "",
    subTask1: candidate?.subTasks[0] ?? "",
    subTask2: candidate?.subTasks[1] ?? "",
    subTask3: candidate?.subTasks[2] ?? "",
    colorId: candidate?.colorId ?? fallbackColorId,
    estimatedDurationMin:
      candidate?.estimatedDurationMin?.toString() ?? "",
    note: candidate?.note ?? ""
  };
}

export function TaskEditorModal({
  open,
  candidate,
  colors,
  onClose,
  onSubmit
}: TaskEditorModalProps) {
  const fallbackColorId = useMemo(
    () => colors[0]?.id ?? "",
    [colors]
  );
  const [form, setForm] = useState<TaskFormState>(
    buildInitialState(candidate, fallbackColorId)
  );

  useEffect(() => {
    setForm(buildInitialState(candidate, fallbackColorId));
  }, [candidate, fallbackColorId, open]);

  const handleSubmit = () => {
    const title = form.title.trim();
    if (!title || !form.colorId) {
      return;
    }

    const payload = {
      title,
      subTasks: [form.subTask1, form.subTask2, form.subTask3]
        .map((item) => item.trim())
        .filter(Boolean),
      colorId: form.colorId,
      estimatedDurationMin: form.estimatedDurationMin
        ? Number(form.estimatedDurationMin)
        : undefined,
      note: form.note.trim() || undefined
    };

    onSubmit(
      candidate
        ? {
            ...candidate,
            ...payload
          }
        : payload
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={candidate ? "タスクを編集" : "新しいタスク"}
    >
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm text-slate-700">
          タイトル
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value
              }))
            }
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          {(["subTask1", "subTask2", "subTask3"] as const).map(
            (key, index) => (
              <label
                className="grid gap-1 text-sm text-slate-700"
                key={key}
              >
                サブタスク {index + 1}
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value
                    }))
                  }
                />
              </label>
            )
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm text-slate-700">
            色
            <select
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={form.colorId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  colorId: event.target.value
                }))
              }
            >
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.label || color.id}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-slate-700">
            所要時間（分）
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              inputMode="numeric"
              min={15}
              step={15}
              value={form.estimatedDurationMin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  estimatedDurationMin: event.target.value
                }))
              }
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm text-slate-700">
          メモ
          <textarea
            className="min-h-28 rounded-lg border border-slate-300 px-3 py-2"
            value={form.note}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                note: event.target.value
              }))
            }
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            キャンセル
          </Button>
          <Button onClick={handleSubmit} type="button">
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
