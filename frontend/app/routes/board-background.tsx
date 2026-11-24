import { Outlet } from "react-router";

// Layout for the pages that share the animated background (see .bg-board in
// app.css). It stays mounted while navigating between them, so the animation
// doesn't restart on each page.
export default function BoardBackground() {
  return (
    <>
      <div aria-hidden className="bg-board" />
      <Outlet />
    </>
  );
}
