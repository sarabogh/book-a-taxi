import { useLocation, useNavigate } from 'react-router-dom'

function Confirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  if (!data) {
    // If user comes here directly without booking
    return (
      <div className="page">
        <div className="card">
          <h1>No Booking Found</h1>
          <p>Please make a booking first.</p>
          <button onClick={() => navigate('/booking')}>Go to Booking</button>
        </div>
      </div>
    )
  }

  const { name, service, pickupText, dropText, distance, fare, expectedPickup } = data

  return (
    <div className="page">
      <div className="card">
        <h1>Booking Confirmed!</h1>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Service:</strong> {service}</p>
        <p><strong>Pickup Location:</strong> {pickupText}</p>
        <p><strong>Drop Location:</strong> {dropText}</p>
        <p><strong>Distance:</strong> {distance} km</p>
        <p><strong>Estimated Fare:</strong> ${fare} USD</p>
        <p><strong>Expected Pickup Time:</strong> {expectedPickup}</p>
        <button onClick={() => navigate('/booking')} style={{ marginTop: '10px' }}>Book Another Ride</button>
      </div>
    </div>
  )
}

export default Confirmation