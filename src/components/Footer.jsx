import './Footer.css'

// Footer is a presentational component: no state, no props, no API calls.
// TMDb's terms require attribution when you display their data publicly,
// so the link to themoviedb.org is the one piece that is genuinely required.
// rel="noopener noreferrer" is a safety habit for any link that opens a new tab.
const Footer = () => {
  return (
    <footer className="app-footer">
      <p>
        © {new Date().getFullYear()} Flixster. Movie data provided by{' '}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          The Movie Database (TMDb)
        </a>
        .
      </p>
    </footer>
  )
}

export default Footer
