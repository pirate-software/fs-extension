import { useState } from "react";

import logo from "../../../assets/logo.png";

import IconInfo from "../../../components/icons/IconInfo";
import Welcome from "../../../components/Welcome";
import ThemeToggle from "./ThemeToggle";

import Overlay from "./Overlay";

export default function Nav() {
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-10 flex h-12 w-full items-center justify-start gap-3 bg-framecol px-4 shadow-lg backdrop-blur-sm sm:justify-center dark:bg-framecol-dark/85">
      <img className="h-8 w-auto" src={logo} alt="Ferret Software Logo" />
      <h1 className="text-lg">Ferret Software</h1>
      <div className="ml-auto flex items-center gap-2 sm:absolute sm:right-4 sm:ml-0">
        <ThemeToggle />
        <button
          className="group -mr-2 rounded-full p-2"
          onClick={() => setShowWelcome(true)}
          title="Info"
        >
          <IconInfo
            size={20}
            className="rounded-full outline-highlight transition-[outline] group-hover:outline-3"
          />
        </button>
      </div>

      <Overlay show={showWelcome} onClose={() => setShowWelcome(false)}>
        <Welcome />
      </Overlay>
    </nav>
  );
}
