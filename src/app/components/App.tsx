import React from 'react';
import {useState, useEffect, useCallback} from 'react';

// import styled from '@emotion/styled';
// import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

const darkTheme = createTheme({ palette: { mode: 'dark' } });
const lightTheme = createTheme({ palette: { mode: 'light' } });

const App = () => {

  const [showCSSvars, setShowCSSvars] = useState(false);
  const [CSSvars, setCSSvars] = useState([]);

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

  const cssContent = `
        body {
            background-color: #f0f0f0;
        }
        .my-class { 
          color: red;
        }
    `;

  const handleDownloadCss = () => {
    downloadFile(cssContent, 'styles.css', 'text/css');
  };

  let formattedCSS = ':root {';



  onmessage = (event) => {   // Talk to the figma API
    // console.log('Got this from the plugin: ', event.data.pluginMessage);
    if (event.data.pluginMessage.type === 'css-tokens') {
        const aCssVarTokens = event.data.pluginMessage.aCssVarTokens;

        aCssVarTokens?.map((item, i) => (
          formattedCSS += "\n\t" + item
        ))

        formattedCSS += "\n" + "}";

        console.log('formattedCSS: ', formattedCSS);




        // setCSSvars(aCssVarTokens);
    }
  };
  
  useEffect(() => {  // Listen for the cssVars changing
    if (CSSvars.length > 2) {
        setShowCSSvars(true);
    }
  }, [CSSvars]);


  return (
    <ThemeProvider theme={darkTheme}>
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Css Vars
          </Typography>
          <ThemeProvider theme={lightTheme}>
          <Button variant="contained" onClick={exportFigmaStyles} >Export Css Vars</Button>
          <Button variant="contained" onClick={handleDownloadCss}>Download CSS</Button>
          </ThemeProvider>
        </Toolbar>
      </AppBar>

      {showCSSvars && (
         <Box sx={{ flexGrow: 1, mt: '80px'}}>
        <div id="cssVars">
          <List dense>
            <ListItem><ListItemText primary=':root {'/></ListItem>
            {CSSvars?.map((item, i) => (
              <ListItem key={i}><ListItemText sx={{
                paddingLeft: 2,
                color: 'success.main',
              }} primary={item}/></ListItem>
            ))}
            <ListItem><ListItemText primary='}'/></ListItem>
          </List>
          
        </div>
        </Box>
      )}
    </Box>
    </ThemeProvider>
  );
} // end App

export default App;


