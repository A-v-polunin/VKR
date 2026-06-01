import { useEffect, useRef, useState } from 'react'
import { loadYandexMaps, createMap, createPlacemark } from '../../services/yandexMaps'
import './MapPicker.css'

const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || 'bd6512ff-886c-45e7-a82a-e966725f431b'

function MapPicker({ onSelect, initialCoords = null, address = '' }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const placemarkRef = useRef(null)
  const ymapsRef = useRef(null)
  const lastGeocodedRef = useRef('')
  const geocodeTimeoutRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!YANDEX_MAPS_API_KEY) {
      console.warn('Yandex Maps API key not provided')
      return
    }

    loadYandexMaps(YANDEX_MAPS_API_KEY).then((ymaps) => {
      ymapsRef.current = ymaps
      if (mapContainerRef.current) {
        const center = initialCoords || [55.751244, 37.618423]
        const map = createMap(mapContainerRef.current, center, 12)
        mapRef.current = map

        map.events.add('click', (e) => {
          const coords = e.get('coords')

          if (placemarkRef.current) {
            const currentCoords = placemarkRef.current.geometry.getCoordinates()
            const dLat = Math.abs(currentCoords[0] - coords[0])
            const dLon = Math.abs(currentCoords[1] - coords[1])
            const isSamePlace = dLat < 0.001 && dLon < 0.001

            if (isSamePlace) {
              map.geoObjects.remove(placemarkRef.current)
              placemarkRef.current = null
              onSelect({
                latitude: null,
                longitude: null,
                name: '',
                address: '',
              })
              return
            }

            map.geoObjects.remove(placemarkRef.current)
          }

          const placemark = createPlacemark(coords, {
            balloonContent: 'Выбранное место',
          })
          map.geoObjects.add(placemark)
          placemarkRef.current = placemark

          ymaps.geocode(coords).then((res) => {
            const firstGeoObject = res.geoObjects.get(0)
            const address = firstGeoObject.getAddressLine()
            const name = address

            onSelect({
              latitude: coords[0],
              longitude: coords[1],
              name: name,
              address: address,
            })
          })
        })

        setMapLoaded(true)
      }
    })

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current)
      }
      if (mapRef.current) {
        mapRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (mapLoaded && navigator.geolocation && !initialCoords) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude]
          if (mapRef.current) {
            mapRef.current.setCenter(coords)
            mapRef.current.setZoom(14)
          }
        },
        () => {
        }
      )
    }
  }, [mapLoaded, initialCoords])

  const geocodeAndSet = (query) => {
    const trimmed = (query || '').trim()
    if (!trimmed || !ymapsRef.current || !mapRef.current) return
    if (lastGeocodedRef.current === trimmed) return

    lastGeocodedRef.current = trimmed

    ymapsRef.current
      .geocode(trimmed)
      .then((res) => {
        const firstGeoObject = res.geoObjects.get(0)
        if (!firstGeoObject) {
          return
        }
        const coords = firstGeoObject.geometry.getCoordinates()
        const addrLine = firstGeoObject.getAddressLine()
        const name = addrLine

        if (placemarkRef.current) {
          mapRef.current.geoObjects.remove(placemarkRef.current)
        }

        const placemark = createPlacemark(coords, {
          balloonContent: addrLine,
        })
        mapRef.current.geoObjects.add(placemark)
        placemarkRef.current = placemark
        mapRef.current.setCenter(coords, 14, { duration: 300 })

        onSelect({
          latitude: coords[0],
          longitude: coords[1],
          name,
          address: addrLine,
        })
      })
      .catch(() => {
      })
  }

  useEffect(() => {
    if (!mapLoaded || !ymapsRef.current || !mapRef.current) return
    const trimmed = (address || '').trim()
    const hasHouseNumber = /\d/.test(trimmed)
    if (!trimmed || trimmed.length < 8 || !hasHouseNumber) return

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current)
    }
    geocodeTimeoutRef.current = setTimeout(() => {
      geocodeAndSet(trimmed)
    }, 600)
  }, [address, mapLoaded, onSelect])

  if (!YANDEX_MAPS_API_KEY) {
    return (
      <div className="map-picker-fallback">
        <p>Карта недоступна. Укажите координаты вручную.</p>
        <p>Для использования карты необходим API ключ Yandex Maps.</p>
      </div>
    )
  }

  return (
    <div className="map-picker">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  )
}

export default MapPicker
