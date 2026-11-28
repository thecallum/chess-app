import type { MoveIntent } from "../components/chess-board";

export const toLongNotation = ({ from, to, promotion }: MoveIntent) =>
  `{${from} - ${to}${promotion ? ` - =${promotion.toLowerCase()}` : ""}}`;
