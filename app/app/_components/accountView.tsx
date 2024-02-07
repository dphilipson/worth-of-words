import { memo, ReactNode } from "react";

export interface AccountViewProps {
  isOpen: boolean;
  closeModal(): void;
}

export default memo(function AccountView({
  isOpen,
  closeModal,
}: AccountViewProps): ReactNode {
  return "Coming soon";
});
