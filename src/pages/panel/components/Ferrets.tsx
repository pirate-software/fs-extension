import { useState, useCallback, Fragment, useMemo } from "react";

import FerretCard from "../../../components/FerretCard";
import FerretButton from "../../../components/FerrretButton";

import { useFerrets } from "../../../hooks/useFerrets";

import useChatCommand from "../../../hooks/useChatCommand";
import { typeSafeObjectEntries } from "../../../utils/helpers";

import Overlay from "./Overlay";

export default function Ferrets() {
  const rawFerrets = useFerrets();
  const ferrets = useMemo(
    () => typeSafeObjectEntries(rawFerrets ?? {}),
    [rawFerrets],
  );

  // Allow chat commands to select a ferret, as well as the user
  const [ferretCard, setFerretCard] = useState<string>();
  useChatCommand(
    useCallback(
      (command: string) => {
        if (Object.keys(rawFerrets ?? {}).includes(command))
          setFerretCard(command);
      },
      [rawFerrets],
    ),
  );

  return (
    <main className="relative scrollbar flex max-h-full flex-wrap justify-center gap-4 overflow-x-hidden overflow-y-auto px-2 pt-16 pb-4 scrollbar-thumb-fs-black scrollbar-track-fs-tan-100 md:px-4">
      <div className="absolute inset-x-0 top-0 h-12 w-screen bg-fs-tan" />

      {ferrets.map(([key]) => (
        <Fragment key={key}>
          <Overlay
            show={ferretCard === key}
            onClose={() => setFerretCard(undefined)}
          >
            <FerretCard ferret={key} onClose={() => setFerretCard(undefined)} />
          </Overlay>

          <FerretButton
            ferret={key}
            onClick={() => setFerretCard(key)}
            className="w-32 max-w-full md:w-48"
          />
        </Fragment>
      ))}
    </main>
  );
}
