import MapView, {Polygon} from 'react-native-maps'

import {MapScreenImpl, type Props} from './MapScreen.shared'

export function MapScreen(props: Props) {
  return (
    <MapScreenImpl
      {...props}
      MapViewComponent={MapView}
      PolygonComponent={Polygon}
    />
  )
}
