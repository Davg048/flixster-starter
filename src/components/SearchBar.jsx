import { useState } from 'react'
import './SearchBar.css'

const SearchBar = ({ onSearch, onClear }) => {
  const [searchText, setSearchText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchText.trim()) {
      onSearch(searchText)
    }
  }

  const handleClear = () => {
    setSearchText('')
    onClear()
  }

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search movies..."
        />
        <button type="submit">Search</button>
        <button type="button" onClick={handleClear}>Clear</button>
      </form>
    </div>
  )
}

export default SearchBar
