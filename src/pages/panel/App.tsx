import { FerretsProvider } from "../../hooks/useFerrets";
import { SettingsProvider } from "./hooks/useSettings";

import Nav from "./components/Nav";
import Ferrets from "./components/Ferrets";

function App() {
  return (
    <SettingsProvider>
      <FerretsProvider>
        <div className="relative h-full w-full">
          <Nav />
          <Ferrets />
        </div>
      </FerretsProvider>
    </SettingsProvider>
  );
}

export default App;
