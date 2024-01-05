import { memo, ReactElement } from "react";

import { createSubOrgAndWallet, login, testTheSigning } from "../_lib/turnkey";

export default memo(function TurnkeyTesto(): ReactElement {
  return (
    <div>
      <button className="btn" onClick={createSubOrgAndWallet}>
        Create sub-org
      </button>
      <button className="btn" onClick={login}>
        Login
      </button>
      <button className="btn" onClick={testTheSigning}>
        Sign
      </button>
    </div>
  );
});
