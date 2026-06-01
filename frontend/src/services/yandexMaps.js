let yandexMapsLoaded = false

export const loadYandexMaps = (apiKey) => {
  if (yandexMapsLoaded || window.ymaps) {
    return Promise.resolve(window.ymaps)
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.onload = () => {
      window.ymaps.ready(() => {
        yandexMapsLoaded = true
        resolve(window.ymaps)
      })
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export const createMap = (container, center, zoom = 10) => {
  return new window.ymaps.Map(
    container,
    {
      center,
      zoom,
      controls: ['zoomControl', 'fullscreenControl']
    },
    {
      suppressMapOpenBlock: true
    }
  )
}

export const createPlacemark = (coords, properties = {}) => {
  return new window.ymaps.Placemark(coords, properties, {
    preset: 'islands#blueDotIcon'
  })
}

export const geocode = (address) => {
  return window.ymaps.geocode(address)
}

export const reverseGeocode = (coords) => {
  return window.ymaps.geocode(coords)
}
