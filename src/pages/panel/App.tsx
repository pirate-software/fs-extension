import { FerretsProvider } from "../../hooks/useFerrets";

import Nav from "./components/Nav";
import Ambassadors from "./components/Ambassadors";

function App() {
  return (
    <FerretsProvider>
      <div className="relative h-full w-full">
        <Nav />
        <Ambassadors />
      </div>
    </FerretsProvider>
  );
}

export default App;
