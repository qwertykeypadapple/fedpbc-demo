import { Masthead, TOC, Footer } from './sections/Shell.jsx';
import Scenario from './sections/Scenario.jsx';
import BiasDemo from './sections/BiasDemo.jsx';
import Mechanism from './sections/Mechanism.jsx';
import ConvergenceRace from './sections/ConvergenceRace.jsx';
import Results from './sections/Results.jsx';
import Theory from './sections/Theory.jsx';

export default function App() {
  return (
    <>
      <Masthead />
      <TOC />
      <main>
        <Scenario />
        <BiasDemo />
        <Mechanism />
        <ConvergenceRace />
        <Results />
        <Theory />
      </main>
      <Footer />
    </>
  );
}
