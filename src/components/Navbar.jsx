import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <nav>
      <div className="logo">Book A Taxi 🚕</div>

      <div className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/services">Services</NavLink>
        <NavLink to="/booking">Book Ride</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </div>
    </nav>
  )
}

export default Navbar
