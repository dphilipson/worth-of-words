"use client";
import { memo, ReactNode, useState } from "react";

import TextInput from "./textInput";

export interface CreateLobbyViewProps {}

export default memo(function CreateLobbyView(
  props: CreateLobbyViewProps,
): ReactNode {
  const [password, setPassword] = useState("");

  return (
    <div className="card w-full max-w-xl bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Create a lobby</h2>
        <p>
          Create a lobby, then find some opponents to play! You can set a
          password if you want to be sure only your friends can join.
        </p>
        <div className="h-4" />
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">Password (optional)</span>
          </label>
          <TextInput
            className="input input-bordered"
            type="password"
            placeholder="********"
            value={password}
            onValueChange={setPassword}
          />
        </div>
        <div className="card-actions justify-end">
          <button className="btn btn-primary">Create lobby</button>
        </div>
      </div>
    </div>
  );
});
