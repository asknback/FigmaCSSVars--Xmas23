import React from 'react';
import ColorPicker from './ColorPicker';

// import logo from '../assets/logo.svg';
import '../styles/ui.css';

const App = () => {

// Export the Figma Styles as tokens
const exportSemanticTokens = () => {
  parent.postMessage({ pluginMessage: { type: 'export-semantic-tokens'} }, '*');
};

const exportContextualTokens = () => {
  parent.postMessage({ pluginMessage: { type: 'export-contextual-tokens'} }, '*');
};

  return (
    <div className="App">
      <header className="App-header">
        <button id="create" onClick={exportSemanticTokens}>
           Export Semantic Tokens
        </button>
        <button id="create" onClick={exportContextualTokens}>
          Export Contextual Tokens
        </button>
      </header>
    </div>
  );
    
}
  
export default App;
