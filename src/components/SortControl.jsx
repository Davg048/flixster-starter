import './SortControl.css'

// SortControl is a controlled <select>: App owns the sortOption value and
// passes it in, plus an onSortChange callback fired when the user picks an option.
const SortControl = ({ sortOption, onSortChange }) => {
  return (
    <div className="sort-control">
      <label htmlFor="sort">Sort by: </label>
      <select
        id="sort"
        value={sortOption}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="none">None</option>
        <option value="title">Title (A–Z)</option>
        <option value="release_date">Release Date (Newest)</option>
        <option value="vote_average">Vote Average (Highest)</option>
      </select>
    </div>
  )
}

export default SortControl
