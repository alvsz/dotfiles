import { Variable } from "astal";

export const nTags = Variable(7);
export const dwlIpc = Variable([]).watch(
  "dwlcmd follow return get_status()",
  (out) => JSON.parse(out),
);
