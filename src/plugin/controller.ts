import _ from 'lodash';
import Color from 'tinycolor2';


// Convert to camelcase
function toCamelCase(str) {
  return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
}

const enum FigmaPaintType {
  Solid = 'SOLID',
  GradientLinear = 'GRADIENT_LINEAR',
}
type FigmaPaint = SolidPaint | GradientPaint | {type: unknown};

const isFigmaLinearGradient = (paint: FigmaPaint): paint is GradientPaint => {
  return paint.type === FigmaPaintType.GradientLinear;
};
const isFigmaSolid = (paint: FigmaPaint): paint is SolidPaint => {
  return paint.type === FigmaPaintType.Solid;
};

function getCssColor(paint:FigmaPaint) {
  if (isFigmaLinearGradient(paint)) {     // Get color if gradient
    const [stopOne, stopTwo] = paint.gradientStops.map((stop) => [
      stop.color.r,
      stop.color.g,
      stop.color.b,
    ]);

    const cssColor = `linear-gradient(90deg, rgb(${Math.round(stopOne[0] * 255)}, ${Math.round(
        stopOne[1] * 255
    )}, ${Math.round(stopOne[2] * 255)}) 0%, rgb(${Math.round(stopTwo[0] * 255)}, ${Math.round(
        stopTwo[1] * 255
    )}, ${Math.round(stopTwo[2] * 255)}) 100%)`;
  
    return cssColor; // we need to add opacity to this as well!
  }
  if (isFigmaSolid(paint)) {              // Get color if solid
    const {r, g, b} = paint.color;
    const solid = `rgba (${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
        b * 255
        )}, ${_.round(paint.opacity, 2)})`;

    if (paint.opacity == 1) { // check if there is no opacity then return normal hex otherwise 8 digit hex with alpha (use rgba instead?)
      return Color(solid).toHexString(); 
    } else {
      return solid; //return Color(solid).toHex8String(); 
    }    
  }
}


figma.showUI(__html__);
figma.ui.resize(800, 640);

const prefixSemantic = '--B1-';
const prefixContextual = '--B2-';
let aCssVarTokens  = [];

figma.ui.onmessage = (msg) => {
  if (msg.type === 'export-styles') {
    getSemanticCssVars();
  }
}

function getSemanticCssVars() {
  aCssVarTokens  = []; //reset the array
  const styles = figma.getLocalPaintStyles(); // get color styles from Figma file

  styles.map(({paints, name}) => {
      const colorArray = name.split('/');
      const semanticTokenName = colorArray.join('__');

      paints?.forEach((paint) => { // Parse Figma Paint API to CSS color properties
          if (isFigmaLinearGradient(paint) || isFigmaSolid(paint)) { // Apply color to token in Semantic Tokens array
            const linkedStyleCssColor = getCssColor(paint);
            const token = prefixSemantic + toCamelCase(semanticTokenName) + ': ' + linkedStyleCssColor + ';';

            aCssVarTokens.push(token);
          }
      });
  });
  // console.log('aCssVarTokens: ', aCssVarTokens);
  // figma.ui.postMessage({type: 'css-tokens', aCssVarTokens});
  getContextualCssVars();
}

function getContextualCssVars() {
  const pages  = figma.root.children; // get all pages in Figma file

  for (let i = 0; i < pages.length; i++) {
    if (pages[i].name == "Buttons") {
      for (let j = 0; j < pages[i].children.length; j++) {
        if (pages[i].children[j].name == "Button") {       
          const Button = pages[i].children[j];
          if (Button.type == 'COMPONENT_SET') { // Split this up later to potentially treat them different (https://www.figma.com/plugin-docs/api/properties/ComponentPropertiesMixin-componentpropertydefinitions/)
            // console.log(Button.componentPropertyDefinitions)

            console.log(Button.children[0])

            const getButtonStyles = (componentProps: { [key: string]: any }): string[] | undefined => componentProps['Style']?.variantOptions;
            const aButtonStyles = getButtonStyles(Button.componentPropertyDefinitions);

            const getButtonStates = (componentProps: { [key: string]: any }): string[] | undefined => componentProps['State']?.variantOptions;
            const aButtonStates = getButtonStates(Button.componentPropertyDefinitions);

            for (let n = 0; n < aButtonStyles.length; n++) {
              const currentStyle = aButtonStyles[n]; // Filled A, Filled B, etc 
  
              const stringStyle = 'Style=' + currentStyle.toString();
              const stringVariant = 'Variant=Normal';
              const stringSize = 'Size=Normal';

              //////////////////////////////
              // Contextual Token
              const contextualTokenName = prefixContextual + 'button__' + toCamelCase(currentStyle.toString());

              for (let p = 0; p < aButtonStates.length; p++) { 
                let contextualTokenValue = 'none;' //Default this to none - and override only if it has a fill
                const currentState = aButtonStates[p]; // Default, Hover, etc 
                const buttonInstanceName = stringStyle + ', ' + stringVariant + ', ' + stringSize + ', State=' + currentState;
                const instance = findChildByName(Button, buttonInstanceName) as ComponentNode;

                if (instance?.type === 'COMPONENT' && instance.fills?.[0]) {
                  const paint = instance.fills[0]; //Given that we never add multiple colors to a style/comp
                  const styleId = instance.fillStyleId.toString();

                  contextualTokenValue = getContextualTokenValue(styleId, paint);
                }
                pushContextualToken(instance, stringStyle, stringVariant, stringSize, contextualTokenName, contextualTokenValue);
              }

              //////////////////////////////
              // onContextual Token
              const onContextualTokenName = prefixContextual + 'button__' + toCamelCase('on' + currentStyle.toString());

              for (let p = 0; p < aButtonStates.length; p++) { 
                let onContextualTokenValue = 'none;' //Default this to none - and override only if it has a fill
                const currentState = aButtonStates[p]; // Default, Hover, etc 
                const buttonInstanceName = stringStyle + ', ' + stringVariant + ', ' + stringSize + ', State=' + currentState;
                const instance = findChildByName(Button, buttonInstanceName) as ComponentNode;
                const labelGroupInstance = findChildByName(instance, "Label Container") as FrameNode;
                const labelInstance = findChildByName(labelGroupInstance, "Label") as TextNode;

                if (labelInstance?.type === 'TEXT' && labelInstance.fills?.[0]) {
                  const paint = labelInstance.fills[0]; //Given that we never add multiple colors to a style/comp
                  const styleId = instance.fillStyleId.toString();

                  onContextualTokenValue = getContextualTokenValue(styleId, paint);
                }
                pushContextualToken(instance, stringStyle, stringVariant, stringSize, onContextualTokenName, onContextualTokenValue);
              }
              

              ////////////////////////////
              // Contextual Border Token
              const contextualTokenBorderName = prefixContextual + 'button__' + toCamelCase(currentStyle.toString()) + 'Border';

              for (let p = 0; p < aButtonStates.length; p++) {
                let contextualTokenBorderValue = 'none;' //Default this to none - and override only if it has a border
                const currentState = aButtonStates[p]; // Default, Hover, etc 
                const buttonInstanceName = stringStyle + ', ' + stringVariant + ', ' + stringSize + ', State=' + currentState;
                const instance = findChildByName(Button, buttonInstanceName) as ComponentNode;

                if (instance?.type === 'COMPONENT' && instance.strokes?.[0]) {
                  const paint = instance.strokes[0]; //Given that we never add multiple colors to a style/comp
                  const styleId = instance.strokeStyleId.toString();

                  contextualTokenBorderValue = getContextualTokenValue(styleId, paint);
                }
                pushContextualToken(instance, stringStyle, stringVariant, stringSize, contextualTokenBorderName, contextualTokenBorderValue);
              }
            }
          }
        }
      }
    }
  }
  console.log('aCssVarTokens length: ', aCssVarTokens.length);
  figma.ui.postMessage({type: 'css-tokens', aCssVarTokens});
}

function pushContextualToken(instance:any, stringStyle:string, stringVariant:string, stringSize:string, tokenName:string, tokenValue:string) {
  if (instance.name.includes(stringStyle) && instance.name.includes(stringVariant) && instance.name.includes(stringSize)) {
    if (instance.name.includes('State=Default')) {
      const token = tokenName + ': ' + tokenValue;
      aCssVarTokens.push(token);
    }
    if (instance.name.includes('State=Hover')) {
      const token = tokenName + '--Hover: ' + tokenValue;
      aCssVarTokens.push(token);
    }
    if (instance.name.includes('State=Active')) {
      const token = tokenName + '--Active: ' + tokenValue;
      aCssVarTokens.push(token);
    }
    if (instance.name.includes('State=Disabled')) {
      const token = tokenName + '--Disabled: ' + tokenValue;
      aCssVarTokens.push(token);
    }
  }
}

function findChildByName(parentInstance:any, instanceName:string):SceneNode | null {
  for (const node of parentInstance.children) {
      if (node.name === instanceName) {
          return node;
      }
  }
  return null;  // Return null if no matching instance is found
}

function getContextualTokenValue(styleId:String, paint:Paint) {
  let contextualTokenValue = '';

  if (isFigmaLinearGradient(paint) || isFigmaSolid(paint)) { 
    const fillCssColor = getCssColor(paint);

    if (styleId != '') { // Check if there is a connection to a style or if we only add the hex
      const style = figma.getStyleById(styleId.toString());
      const aStyle = style.name.split('/');
      const semanticTokenName = aStyle.join('__');
      contextualTokenValue = 'var ( ' + prefixSemantic + toCamelCase(semanticTokenName) + ', ' + fillCssColor + ' );'
    } else {
      // console.log('instance.fillStyleId:', 'No Fill Style on this one');  // Skip css var and just use the Fill color 
      contextualTokenValue = fillCssColor + ';'
    }
  }
  return contextualTokenValue;
}