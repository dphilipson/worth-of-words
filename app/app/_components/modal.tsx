import { memo, ReactNode, useId, useRef } from "react";

import { SubscribeFunction, useSubscribe } from "../_lib/subscriptions";

export interface ModalProps {
  subscribeToOpenModal: SubscribeFunction<void>;
  children: ReactNode;
}

export default memo(function Modal({
  subscribeToOpenModal,
  children,
}: ModalProps): ReactNode {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useSubscribe(subscribeToOpenModal, () => dialogRef.current?.showModal());

  return (
    <dialog id={id} ref={dialogRef} className="modal">
      <div className="modal-box min-w-fit bg-opacity-90">{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
});
