import { memo, ReactNode, useCallback, useId, useRef, useState } from "react";

import { SubscribeFunction, useSubscribe } from "../_lib/subscriptions";

export interface ModalProps {
  subscribeToOpenModal: SubscribeFunction<void>;
  children(params: ModalChildParams): ReactNode;
}

export interface ModalChildParams {
  isOpen: boolean;
  closeModal(): void;
}

export default memo(function Modal({
  subscribeToOpenModal,
  children,
}: ModalProps): ReactNode {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = useCallback(() => dialogRef.current?.close(), []);
  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  useSubscribe(subscribeToOpenModal, () => {
    dialogRef.current?.showModal();
    setIsOpen(true);
  });

  return (
    <dialog id={id} ref={dialogRef} className="modal" onClose={handleClose}>
      <div className="modal-box min-w-fit bg-opacity-95">
        {children({ isOpen, closeModal })}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
});
