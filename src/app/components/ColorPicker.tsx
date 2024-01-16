import React, { useState } from 'react';

const ColorPicker = () => {
  const [color, setColor] = useState('#FF0000'); // default color

  const handleColorChange = (e) => {
    setColor(e.target.value);
    // Send the color to the Figma plugin code
    parent.postMessage({ pluginMessage: { type: 'color-change', hexColor: e.target.value } }, '*');
  };

  return (
    <input type="color" value={color} onChange={handleColorChange} />
  );
};

export default ColorPicker;