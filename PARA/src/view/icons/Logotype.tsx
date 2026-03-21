import Svg, {
  type PathProps,
  type SvgProps,
  Text as SvgText,
} from 'react-native-svg'

import {CINZEL_FONT_FAMILY, useCinzelFont} from '#/lib/hooks/useCinzelFont'
import {usePalette} from '#/lib/hooks/usePalette'

const ratio = 17 / 64
const WORDMARK = 'PARA'

export function Logotype({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  useCinzelFont()
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32, 10)

  return (
    <Svg
      fill="none"
      viewBox="0 0 64 17"
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <SvgText
        fill={fill || pal.text.color}
        fontFamily={CINZEL_FONT_FAMILY}
        fontSize={12}
        letterSpacing={0.4}
        textAnchor="middle"
        x="50%"
        y={12.5}>
        {WORDMARK}
      </SvgText>
    </Svg>
  )
}
