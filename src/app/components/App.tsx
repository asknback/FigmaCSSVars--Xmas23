import React from 'react';
import {useState, useEffect} from 'react';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/system/Stack';

const darkTheme = createTheme({ palette: { mode: 'dark' } });

const App = () => {

  const [showCSSvars, setShowCSSvars] = useState(false);
  const [FormattedCSSvars, setFormattedCSSvars] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  // Export the Figma Styles as tokens
  const exportFigmaStyles = () => {
    parent.postMessage({ pluginMessage: { type: 'export-styles'} }, '*');
  };

  const downloadFile = (content, filename, contentType) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
  
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
  
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadCss = () => {
    downloadFile(FormattedCSSvars, 'styles.css', 'text/css');
  };

  onmessage = (event) => {   // Talk to the figma API
    // console.log('Got this from the plugin: ', event.data.pluginMessage);
    if (event.data.pluginMessage.type === 'css-tokens') {
      const aCssVarTokens = event.data.pluginMessage.aCssVarTokens;

      let CSSvars = ':root {'; 
      aCssVarTokens?.map((item) => (
        CSSvars += "\n\t" + item
      ))
      CSSvars += "\n" + "}";

      // console.log(CSSvars);
      setFormattedCSSvars(CSSvars);
      setIsButtonDisabled(false);
    }
  };

  useEffect(() => {  // Listen for the FormattedCSSvars changing
    if (FormattedCSSvars != '') {
        setShowCSSvars(true);
    }
  }, [FormattedCSSvars]);


  return (
    <ThemeProvider theme={darkTheme}>
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" color="primary" sx={{ flexGrow: 1, fontWeight: 'bold'}}>
              CSS Vars Exploration
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" color="secondary" onClick={exportFigmaStyles}>Create CSS Vars</Button>
            <Button variant="contained" color="secondary" onClick={handleDownloadCss} disabled={isButtonDisabled}>Download CSS File</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {showCSSvars && (
        <Box sx={{ flexGrow: 1, mt: '64px', p: 2}}>
          <Typography component="pre" variant="body2" sx={{ color: 'success.main'}}>
            {FormattedCSSvars}
          </Typography>
        </Box>
      )}
    </Box>
    </ThemeProvider>
  );
} // end App

export default App;


