import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ================= LEAFLET ICON FIX ================= */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/* ================= GEOCODING ================= */
const geocode = async (place) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
  )
  const data = await res.json()
  if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
  return null
}

/* ================= FETCH ROUTE FROM ORS ================= */
const getRoute = async (start, end, apiKey) => {
  const res = await fetch(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        coordinates: [
          [start[1], start[0]],
          [end[1], end[0]],
        ],
      }),
    }
  )
  const data = await res.json()
  const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
  const distKm = (data.features[0].properties.summary.distance / 1000).toFixed(2)
  return { coords, distKm }
}

/* ================= MAP CLICK HANDLER ================= */
function MapClick({ pickup, setPickup, drop, setDrop }) {
  useMapEvents({
    click(e) {
      if (!pickup) setPickup([e.latlng.lat, e.latlng.lng])
      else if (!drop) setDrop([e.latlng.lat, e.latlng.lng])
    }
  })
  return null
}

/* ================= SMOOTH AUTO-ZOOM ================= */
function SmoothFit({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions?.length) {
      const bounds = L.latLngBounds(positions)
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 })
    }
  }, [positions, map])
  return null
}

function Booking() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [service, setService] = useState('')
  const [pickupText, setPickupText] = useState('')
  const [dropText, setDropText] = useState('')
  const [pickup, setPickup] = useState(null)
  const [drop, setDrop] = useState(null)
  const [routeCoords, setRouteCoords] = useState([])
  const [distance, setDistance] = useState(null)
  const [fare, setFare] = useState(null)
  const [error, setError] = useState('')

  const API_KEY = import.meta.env.VITE_ORS_API_KEY
  const center = [28.6139, 77.2090] // Default map center

  /* ================= UPDATE FARE DYNAMICALLY ================= */
  useEffect(() => {
    if (!distance || !service) {
      setFare(null)
      return
    }
    const rateUSD =
      service === 'Luxury Taxi' ? 2.5 :
      service === 'Airport Pickup' ? 2.0 : 1.5
    setFare((distance * rateUSD).toFixed(2))
  }, [distance, service])

  /* ================= SEARCH & ROUTE ================= */
  const handleSearch = async () => {
    const p = pickupText ? await geocode(pickupText) : pickup
    const d = dropText ? await geocode(dropText) : drop
    setPickup(p)
    setDrop(d)
    if (p && d && API_KEY) {
      const { coords, distKm } = await getRoute(p, d, API_KEY)
      setRouteCoords(coords)
      setDistance(distKm)
    }
  }

  /* ================= CONFIRM BOOKING ================= */
  const handleConfirm = () => {
    if (!name || !pickup || !drop || !service) {
      setError('Please fill all fields and select locations')
      return
    }

    const expectedPickup = new Date(Date.now() + 15 * 60 * 1000)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    navigate('/confirmation', {
      state: {
        name,
        service,
        pickupText,
        dropText,
        distance,
        fare,
        expectedPickup
      }
    })
  }

  /* ================= RESET FORM ================= */
  const reset = () => {
    setPickup(null)
    setDrop(null)
    setRouteCoords([])
    setDistance(null)
    setPickupText('')
    setDropText('')
    setService('')
    setName('')
    setFare(null)
    setError('')
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Book a Ride</h1>
        <input placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Pickup Location" value={pickupText} onChange={e => setPickupText(e.target.value)} />
        <input placeholder="Drop Location" value={dropText} onChange={e => setDropText(e.target.value)} />

        <select value={service} onChange={e => setService(e.target.value)}>
          <option value="">Select Service</option>
          <option>Standard Taxi</option>
          <option>Luxury Taxi</option>
          <option>Airport Pickup</option>
        </select>

        <button onClick={handleSearch}>Show on Map</button>
        <button onClick={reset} style={{ marginTop: '5px', background: '#ddd' }}>Reset</button>

        {distance && fare && (
          <p style={{ marginTop: '10px' }}>
            <strong>Distance:</strong> {distance} km<br/>
            <strong>Estimated Fare:</strong> ${fare} USD
          </p>
        )}

        {error && <p className="error">{error}</p>}

        <button onClick={handleConfirm} style={{ marginTop: '10px' }}>Confirm Booking</button>
      </div>

      <MapContainer center={center} zoom={12} style={{ height: '350px', marginTop: '20px' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClick pickup={pickup} setPickup={setPickup} drop={drop} setDrop={setDrop} />
        <SmoothFit positions={routeCoords.length ? routeCoords : pickup && drop ? [pickup, drop] : []} />

        {pickup && <Marker position={pickup} />}
        {drop && <Marker position={drop} />}
        {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" />}
      </MapContainer>
    </div>
  )
}

export default Booking