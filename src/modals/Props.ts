// Props.ts
export interface ModalFormBase {
  formId: string;
  FrontMakerId: string;
}

export interface ForeignCurrencyModalProps {
  open: boolean;
  onClose: () => void;
  form: ModalFormBase | null;
  isForeign?: boolean; // ✅ optional
}
