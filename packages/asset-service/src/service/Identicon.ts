/* eslint-disable */
const Identicon = require('identicon.js')
const { fonts, renderPixels } = require('js-pixel-fonts')
/* eslint-enable */

export type IdenticonOptions = {
  // identicon options, checks https://github.com/stewartlord/identicon.js
  identiconImage?: {
    size?: number // defines the size (px) of generated identicon
    margin?: number
    foreground?: [number, number, number, number] // RGBA
    background?: [number, number, number, number] // RGBA
    saturation?: number
    brightness?: number
    format?: string // 'png' or 'svg'
  }
  // text options
  identiconText?: {
    textColor?: [number, number, number, number] // RGBA
    symbolScale?: number // controls the scale of the pixelSymbol as its original size might be too small.
    enableShadow?: boolean // create a shadow below rendered text
    shadowColor?: [number, number, number, number] // RGBA
  }
}

// any is used here since a library without typings is used (identicon.js).
// However, all functions that involved `any` are used internally (without export).
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const identiconPNGtoBase64 = (pngObj: any): string => {
  return `data:image/png;base64,${pngObj.getBase64()}`
}

// any is used here since a library without typings is used (identicon.js).
// However, all functions that involved `any` are used internally (without export).
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const paintPixel = (pngObj: any, x: number, y: number, color: [number, number, number, number]) => {
  pngObj.buffer[pngObj.index(x + 1, y)] = pngObj.color(...color)
}

const getRenderedIdenticonPNG = (
  tokenId: string,
  text?: string,
  options?: IdenticonOptions
  // any is used here since a library without typings is used (identicon.js).
  // However, all functions that involved `any` are used internally (without export).
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
): any => {
  const identiconOptions = {
    identiconImage: {
      size: options?.identiconImage?.size || 128,
      margin: options?.identiconImage?.margin || 0.08,
      foreground: options?.identiconImage?.foreground,
      background: options?.identiconImage?.background || [240, 240, 240, 255],
      saturation: options?.identiconImage?.saturation || 0.7,
      brightness: options?.identiconImage?.brightness || 0.5,
      format: options?.identiconImage?.format || 'png'
    },
    identiconText: {
      textColor: options?.identiconText?.textColor || [255, 255, 255, 255],
      symbolScale: options?.identiconText?.symbolScale || 5,
      enableShadow: options?.identiconText?.enableShadow || false,
      shadowColor: options?.identiconText?.shadowColor || [0, 0, 0, 255]
    }
  }

  // In order to additionally render text, we acquire PNGLib object here which has some convenient png operator.
  // https://github.com/stewartlord/identicon.js/blob/master/pnglib.js
  const identiconImage = new Identicon(
    tokenId?.substring(2),
    identiconOptions.identiconImage
  ).render()

  // we just return if no symbol
  if (!text) return identiconImage
  if (text.length === 0) return identiconImage

  // here we start to render the text
  const symbolPixels = renderPixels(text, fonts.sevenPlus)
  // get fonts width and height
  // `pixelSymbolWidth` and `pixelSymbolHeight` are the original width and height of pixel fonts
  // generated by 'js-pixel-fonts'. They can't be modified.
  const pixelSymbolWidth = symbolPixels[0].length, // here `symbolPixels` is guaranteed to have at least one child.
    pixelSymbolHeight = symbolPixels.length
  // calculate the offset in order for centering the text
  const offsetX = Math.round(
    (identiconOptions.identiconImage.size -
      pixelSymbolWidth * identiconOptions.identiconText.symbolScale) /
      2
  )
  const offsetY = Math.round(
    (identiconOptions.identiconImage.size -
      pixelSymbolHeight * identiconOptions.identiconText.symbolScale) /
      2
  )
  // render pixel text
  for (let x = 0; x < identiconOptions.identiconImage.size; x++) {
    const offsettedX = Math.floor((x - offsetX) / identiconOptions.identiconText.symbolScale)
    if (offsettedX < 0 || offsettedX >= pixelSymbolWidth) continue
    for (let y = 0; y < identiconOptions.identiconImage.size; y++) {
      const offsettedY = Math.floor((y - offsetY) / identiconOptions.identiconText.symbolScale)
      if (offsettedY < 0 || offsettedY >= pixelSymbolHeight) continue
      if (symbolPixels[offsettedY][offsettedX]) {
        // make the pixel at current position white (RGBA: 255, 255, 255, 255)
        paintPixel(identiconImage, x, y, identiconOptions.identiconText.textColor)
        if (identiconOptions.identiconText.enableShadow) {
          // create shadow
          paintPixel(identiconImage, x + 1, y + 1, identiconOptions.identiconText.shadowColor)
        }
      }
    }
  }
  return identiconImage
}

export const getRenderedIdenticonBase64 = (
  tokenId: string,
  text?: string,
  options?: IdenticonOptions
): string => {
  return identiconPNGtoBase64(getRenderedIdenticonPNG(tokenId, text, options))
}
